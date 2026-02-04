# 一. 介绍

##   JobSystem

https://docs.unity3d.com/2021.3/Documentation/Manual/JobSystem.html

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjQ1ZmVkNzY4N2E0YzJlZWY4ZmEzYTkyZGQxZGQyNTJfT0xXMFJjcnN2NEE1Z2l2bmJZdTlZNzZYMTlYTWFmYVRfVG9rZW46RldhS2JDbU5Qb0hQVWF4Mkh6cWN4eTZsbktnXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

- job system是通过创建job任务而不是线程来管理多线程代码，unity引擎内部会跨多个核心来管理一组工作线程，以避免上下文的切换。
    
- 执行时，job system会将我们创建的job任务放到job队列中，以等待执行。
    
- 工作线程会从job队列中获取并执行相应的工作
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjRjOGE0YjIzMWI1MTZiMjI5NDFkZjUwOGU1ODhkM2ZfMHJmbEhLSlNZWno3Tk84MW1qY25OWUxsTDdVNVJSYXhfVG9rZW46QlV3S2I2QVdJb0dYMk54Tm5zc2N1UjQ2bjVkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

1. ### job的特性
    

- **多线程****并行**：将多个计算分解为独立任务，分配到多个work线程并行执行
    
- **数据安全**：通过**`NativeArray`**实现主线程与Job线程的安全数据传递
    
    - 同一个`NativeArray`实列只能执行1个Job对其写入，不然会抛出异常。
        
    - Job写入时，主线程不能对`NativeArray`读取，会报错，要等待完成。
        
    - 衍生的有`NativeList`,`NativeQueue`,`NativeHashMap`,`NativeHashSet`,`NativeText`等，但这些只能在单线程中使用
        
- **NativeContainer****内存****调配（allocate）**：
    
    - 管理非托管内存
        
    - 需要手动管理生命周期
        
    - **NativeContainer**类型new时需要选择`Temp`,`TempJob`,`Persistent`3种类型分配器，分配速度从快到慢
        
        ![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ODY3MGI0YWFmNTVmOTEzOTUyNmQ0YzRlNDRlMjljNTZfWjVRVXdUeGVQb2x6OHVHQkZ5S2M4QzBzcnJsM29STFBfVG9rZW46WHlEbmJMVWpob1BUalR4dFZLaGNSMW4zbmJmXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)
        
    
    ![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MGFhNTJjOTYxYzJlNjI1NWFjNjcyMjg0ZmViZTY5N2JfcXd1UE5aUVo3U1BRYjE5NjBQVUNRaFpvMXhSeTF6TDlfVG9rZW46WnlpNGJLcm9Xb1ljand4WTk5a2NWUWs2bjhnXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)
    
- **数据类型****限制**
    
    - jobSystem 执行时复制而非引用数据，避免了数据竞争，但 JobSystem 只能使用`memcpy`复制 [blittable types](https://link.zhihu.com/?target=https%3A//docs.microsoft.com/en-us/dotnet/framework/interop/blittable-and-non-blittable-types) 数据。`Blittable types` 是 .Net 框架中的数据类型，该类型数据在托管代码和非托管代码间传递无需转换
        
        https://learn.microsoft.com/zh-cn/dotnet/framework/interop/blittable-and-non-blittable-types
        
        ![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=Yzk1ODhhMzQzNDI4MDBhM2Y4MDQ3YTk2NDNkNDFkY2NfbHV2M2ZOQTRicVlVMVQ2dFBFM29yYTcwU2RjVm5TUW1fVG9rZW46RTVMWmJ6amRVb1lWRHF4Z3RCVWNSYU11bjNiXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)
        
- **无****GC****压力**：避免每帧产生托管内存垃圾
    
- **内存****布局优化**：
    
    - C# bool实际占用4字节（非1字节），需用`[MarshalAs(UnmanagedType.U1)]`处理布尔值
        
    - `NativeArray`确保数据线性排列，提高CPU缓存命中率
        

  

2. ### 内存类型关键API
    
    1. TransformAccessArray：批量处理Transform的线程安全容器，其内存分配类型是Persistent（持久化）的
        
    2. IJobParallelForTransform：专用于并行处理Transform的Job接口
        
    
      
    

3. ### 执行单线程Job
    

整个流程就是自己写个`IJob`类，主线程`Schedule`它，然后调用`Complete`堵塞等待Job完成。

```Java
public struct MyJob : IJob {
    public NativeArray<float> result;

    public void Execute() {
        for (int j = 0; j < result.Length; j++)
            result[j] = result[j] * result[j];
    }
}

void Update() {
    result = new NativeArray<float>(100000, Allocator.TempJob);

    MyJob jobData = new MyJob{
        result = result
    };

    handle = jobData.Schedule();
}

private void LateUpdate() {
    handle.Complete();
    result.Dispose();
}
```

4. ### 并行模式（Parallel Job）
    

上述代码从`IJob`改为继承`IJobParallelFor`就是并行模式了。

```Java
public struct MyJob : IJobParallelFor {
    public NativeArray<float> result;

    public void Execute(int i) {
        result[i] = result[i] * result[i];
    }
}

void Update() {
    result = new NativeArray<float>(100000, Allocator.TempJob);

    MyJob jobData = new MyJob{
        result = result
    };

    handle = jobData.Schedule(result.Length, result.Length / 10);
}

private void LateUpdate() {
    handle.Complete();
    result.Dispose();
}
```

并行模式不用自己写For loop，会对每个元素执行一次`Execute`，类似Shader。

`Schedule(result.Length, result.Length / 10)`指的是对数组`0`到`result.Length`长度的每个单位执行`Execute`，分配到`10`个worker上。

  

  

## Burst 编译器

  官方教程：

https://docs.unity3d.com/Packages/com.unity.burst@1.3/manual/index.html

  Burst可以再次增强Job的执行速度，对于上述示例，只要加一行这个**[BurstCompile]**：

```Plain
[BurstCompile]
 public struct MyJob : IJobParallelFor {
     ...
 }
```

```Plain
c# -----> .NET IL  -----> LLVM IR -----> C++ -----> native assembly

1. 第一个阶段是由.NET或者mono的编译器，将C#代码编译为.NET IL指令
2. 第二个阶段是由Burst，或者说是LLVM，将.NET IL指令转译为LLVM IR指令，在这一阶段，LLVM会对IR进行优化
3. 将LLVM IR通过IL2CPP转换为C++代码
4. 通过C++编译器将C++代码编译为对应平台的汇编指令
```

1. ### Burst特性
    
    - **LLVM****编译**：将C# IL代码编译为高度优化的原生机器码
        
        - 静态优化：在编译时进行常量传播、死代码消除、循环展开等，减少运行时冗余计算
            
        - 消除虚函数调用：通用逻辑需通过虚函数表动态分派，而 LLVM 生成直接调用的静态代码，减少间接跳转开销
            
        - 内联关键函数：将简单函数（如数学运算）内联到调用处，避免函数调用堆栈操作
            
        - 分支预测：条件简化、跳转指令优化
            
        - 计算密集型函数优化：内联数学函数（如 `abs()`、`plus()`），消除调用开销
            
        - 数据局部性优化/死代码消除/循环优化等
            
        
        https://llvm.org/
        
    
    https://www.cnblogs.com/wujianming-110117/p/17279852.html
    
    - **自动向量化**: 向量化就是把多个计算打包成1个指令，对`float3`/`quaternion`等数学运算进行特殊优化 ,float3的计算天然就是向量化的
        
    - **SIMD****加速**：自动使用CPU的SIMD指令集（如AVX/NEON）并行处理多个数据的操作
        
    
      
    

2. ### 如何知道Job是否正确向量化了？
    

打开Burst Inspector工具（在Jobs菜单里）

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NDYzNTEzNDVlZWJlNDBlMTYxNWFjNTVlMzgwZTIwZTRfTktvNXpWdENXMkd0QTRCajNlTXhvVE1qcWFjNFNzNG1fVG9rZW46VzNORmJob1ZnbzZMN3J4VUh6VGNWcFplbk1nXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MzJlMWI4NjEyZWJmYWJiOTkxMDY2YzdkZTQ4ZDc4NzNfRXhQZ2J3NHlVTG1LZVNCV0d3SlhPUmQzWXJPdkJwNzVfVG9rZW46VG5WSGI1MFNVbzFveXB4eklFUmNOcmNnbmNkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

选中你的函数，看Assembly是否有[avx指令](https://docs.oracle.com/cd/E36784_01/html/E36859/gntae.html)代码，以及看IR Optimisation是否有警告。如果未正常向量化，会显示：

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MDE5OTEzNzQwNTdiYTRlNDEyNzFiMzliNmU5ODA1NDhfaXRTeGRRQ2xWWnZmQWpzUzRUZElVdkRTeEJCRXpvaU5fVG9rZW46RzZSVGJtWHlqb2NHU2V4S0x5T2NVVjJBbjVmXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

常见的有：

- loop not vectorized: call instruction cannot be vectorized 是指调用了无法向量化的外部函数。
    
- loop not vectorized: instruction return type cannot be vectorized 一般这是调用了已经优化的函数，因此无法向量化第二遍，是正常的。
    
- loop not vectorized: control flow cannot be substituted for a select
    
      一般是job里存在逻辑分支
    
    ![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=M2UzMDE4N2RlMmE2NDRmMWUzMmQ0YzFmNWZjZmFhNjZfaVI4QmxIN1hZYlJ6TG5hWjlrZDNDWFVwUlVQREFwS1FfVG9rZW46Rmx0ZmI5MVU5b0o3cjZ4SjhDN2Nwbjd1bjZkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)
    

  

# 二. 家园的具体使用实现

1. ## 实现思路
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NTNkMjlhOGYwNGRiYmI4ZWIwZDcwN2ZhZmIyM2E2MmFfbmlROTBCdk0yeUp1WE5EaXB1UUdDcm5idW9LRm9udHFfVG9rZW46VDg4N2JZUEg4b3FPb3J4MlJBd2NySUxObjNkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

关键代码:

```Java
// HeightFollowsObj.cs
void LateUpdate()
{
    // Burst加速Job调度
    var job = new FollowHeightTransformJob { TargetHeights = s_TargetHeights };
    s_JobHandle = job.Schedule(s_FollowerTransforms);
}


// HeightFollowJobs.cs
[BurstCompile]
public struct FollowHeightTransformJob : IJobParallelForTransform 
{
    [ReadOnly] public NativeArray<float> TargetHeights;
    
    public void Execute(int index, TransformAccess transform) 
    {
        Vector3 pos = transform.position;
        pos.y = TargetHeights[index]; // 无分支直线代码
        transform.position = pos;
    }
}

```

2. ## 测试效果
    

测试手机：Oppo R9sk

传统实现方式：update里遍历设置transform的position

Npc数量在不同数量级别时的传统实现和jobsystem异步多线程实现耗时对比：

  **数量为200时：**

- 传统实现：0.35ms
    
- job实现：0.09ms
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=M2YwMjQ1NGU0YzFhMzE4M2UyNWMwYmFhNTczNzg1N2JfS3AwZ1FZaExVZGxpY3BDeVMxZnJsSHJPZGhNZTdNVmpfVG9rZW46RHBlTGJVc3Nyb25Rdk14R2VQMWNwRXZmbjBjXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MGU1NWFmODRjYTc2YzNlOTA4OGZmZDU2NThmMTc3OGZfbmxTZzVUaUhSMUtCRFFJSm1UR3IwYlBIMlZ6ODJuSFBfVG9rZW46QXc5VGJsWDlqb1h2ZWh4a0FBdGNkbUlobkFkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

**数量为200时：**

- 传统实现：1.4ms+
    
- Job: 0.15ms
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YTgxNTFkMzI5NWRmOWFjZjkwNmJiZDExMjQ4YzllNzVfbnltaUNVSGx2a0lyM0ZvTFFWeFYwRjF1YnBRREVWYWxfVG9rZW46Qmh3TWJKUFVWbzhjcmd4cXJOc2NmTDN4blFoXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ZjI1YjI3Mjg2ZDVkZTM1MWY5ZTc3NDk4NjYwYTBhY2FfZVZpaWxYcGFnSklkV2tadGJsYnV0U2ZzRThzTVFqckZfVG9rZW46VzJUTWJNME9Wb2JRMFR4S0wwY2N6TlZ5bjNiXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

**数量为400时：**

- 传统实现：3.53ms+
    
- Job: 0.34ms
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MmVkMDhmOGEyZGZlYmU5NzU4MDVhNGEwNTBiNGYyZWVfbEJ1UWNMb2dkR01UZnFsSGpoMWNGenNvdDZwOTZSY3RfVG9rZW46VFRKN2JMNW1Xb2tXVjF4TGNEeWNNNkJHbm5mXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NDNmY2UyNjk5MjdlM2Q4YTMwZTQ5NDNjNWU5YTg1MWNfaUNUTko5VlZZOW03Sjg4Y2hDdWtsWURNaHNlMXptbXZfVG9rZW46SjJVU2I2cHNNb0U5Y3R4ZlQwWmNIbHZVbllkXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

性能对比（Oppo R9sk）：

|   |   |   |   |
|---|---|---|---|
|NPC数量|传统方式|JobSystem+Burst|提升倍数|
|40|0.35ms|0.09ms|3.9x|
|200|1.4ms+|0.15ms|9.3x|
|400|3.53ms+|0.34ms|10.4x|

# 三. 注意事项

1. ##   线程安全原则：
    

- **主线程调用****`JobHandle.Complete()`****后才能修改Native数据**
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YmI5MWIzZDFhNzc1NTlmNzZmOGY1OTc4YmFhZjI0Yjhfa25wY3NXTjd5WkFOMkI4VnphZFFXbGZvVlpFTFg2Z3NfVG9rZW46S0JXcGJiYWVVb3EyNnR4dUxsRmMyTUsyblNjXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

- **Job中禁止访问任何非NativeContainer对象**
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MmE5NDAzN2Q2MzYyMmQ1NThjNTY5NDk2MTBkNzIyMDBfTWxLdkk4WGJpeVk3TDFnbDFacXhTeFRPYVV1bVBaTGJfVG9rZW46Sjg2NWJ4WWQ5b2FLZGV4MXJ1SmNGZ2dabkZlXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

- **当Transform被加入** **`TransformAccessArray`****后不能在主线程修改Transform层级**：
    
    - 禁止改变父子关系：
        
        1. 不能调用 `transform.SetParent(newParent)`
            
        2. 不能将对象移入/移出其他GameObject
            
    - 禁止销毁对象：
        
        1. 不能调用 `Destroy(transform.gameObject)`
            
        2. 不能调用 `Destroy(transform)`
            
    - 禁止创建新层级：
        
        1. 不能在已注册对象的子级创建新对象
            
        
          
        
    
        当Transform被加入 `TransformAccessArray`：
    
    - Unity 会创建内部快照
        
    - Worker线程直接操作物理内存中的Transform数据
        
    - 若主线程修改层级：
        
        1. 快照与实际数据结构不一致
            
        2. 导致内存访问越界
            
        3. 可能引起数据损坏或崩溃
            
        
          
        
- **不要在job中开辟托管内存**
    
        在job中开辟托管内存会难以置信得慢，并且这个job不能利用Unity的Burst编译器来提升性能
    

2. ##   做好内存管理
    

  申请的NativeContainer内存（NativeArray/TransformAccessArray等），由于是手动管理，必须做好清理卸载工作。

```Plain
void Cleanup()
{
    s_JobHandle.Complete(); // 必须等待Job结束
    
    if (s_FollowerTransforms.isCreated)
        s_FollowerTransforms.Dispose();
    
    if (s_TargetHeights.IsCreated)
        s_TargetHeights.Dispose();
}

private void OnDisable()
{
    Cleanup();
}

private void OnDestroy()
{
    Cleanup();
}
```

3. ##   Burst编译限制：
    

- **不支持****`try/catch`****异常处理** why
    
    - 运行时开销：`try/catch` 依赖运行时环境（如.NET CLR）的异常派发机制，需维护调用栈、类型匹配等动态信息，显著增加额外指令和内存访问。
        
    - 非确定性：异常路径破坏了代码的确定性行为，在并行Job中可能导致不可预测的竞态条件。
        
    - 与底层编译模型冲突：Burst将C#代码编译为无依赖的原生代码，剥离了托管运行时的异常处理框架，无法支持动态异常捕获。 替代方案：使用返回错误码（如 `bool TryXXX(out result)`）或预检查条件（如 `Assert`）处理错误。
        
- **禁止使用虚函数/接口调用** why
    
    - 虚函数破坏静态优化与确定性
        
    - 多态不确定性：运行时动态绑定与Burst的提前编译（AOT）冲突，无法在编译期确定具体调用的函数
        
- **不能访问静态变量** why
    
    - 线程安全问题：静态变量是进程级全局状态，多线程Job同时读写需加锁（如 `lock`），但Burst禁止托管锁机制，且原生代码无锁安全性无法保证。
        
    - 内存访问冲突：静态变量存储在堆或数据段（非栈），Burst要求内存访问完全可预测，而静态变量地址在运行时才确定
        

4. ##   数据准备优化
    

- 避免在Job中计算逻辑，例如将`GetHeight()`计算移出Job
    
- 保证内存连续访问：`for`循环顺序访问NativeArray
    

  

5. ##   将NativeContainer标记为只读的
    

  记住job在默认情况下拥有NativeContainer的读写权限。在合适的NativeContainer上使用[ReadOnly]属性可以提升性能。

```Plain
[ReadOnly] public NativeArray<float> Heights;
```

6. ##   立即调用 `JobHandle.Complete()` 的问题
    
    ```Plain
    // 主线程执行到这里
    JobHandle handle = job.Schedule(); 
    // 作业开始在后线程执行
    
    handle.Complete(); 
    // 主线程在这里阻塞，等待作业完成
    // 之后主线程继续执行
    ```
    
        `Complete()` 会使调用它的线程（通常是主线程）阻塞等待。
    
        当帧调用 `JobHandle.Complete()` 会导致当前线程阻塞并等待作业完成，由于JobHandle handle = job.Schedule()一般是主线程调用，所以当帧调用 `JobHandle.Complete()` 就会阻塞主线程。
    
      
    
        **性能影响**：
    
    - 如果作业执行时间长，会导致主线程卡顿（帧率下降）
        
    - 在移动端低端设备上，线程切换开销可能大于并行收益
        
    

  

  

7. ##   Editor下重载程序集注意回收Native数据
    

  脚本已更改且进入播放模式时，Unity 会重新加载所有程序集，此时需要回收好NativeArray，不然会造成编辑器下的内存泄露

  解决办法是使用UnityEditor.AssemblyReloadEvents.beforeAssemblyReload监听。Unity 重新加载所有程序集之前，会分发该事件。

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YWFiOGYyY2I4YjEwODFlMDhkNjEyOGI3NGY1MmUyZmJfTDY4M2JBak54d3cza3FZZW1VeVJGMmh0d0t4aDlGc2pfVG9rZW46TWxEOGJGWWJvb1duZUt4T2tjZmNtVnNhbkNmXzE3NzAxODg2OTg6MTc3MDE5MjI5OF9WNA)

  

# 四. 局限

1. ###   移动端兼容性问题
    
    1. 最低系统要求：
        
        1. iOS：需要 iOS 10.0+（ARMv7/AArch64 支持）
            
        2. Android：需要 Android 5.0+（API level 21+）
            
        3. 旧设备（Android 4.x/iOS 9.x）不支持 Job System
            
    2. 处理器架构限制：
        
        1. 32位 ARMv7 设备支持有限（性能提升不明显）
            
        2. Burst 编译器在 ARMv7 上功能受限
            
        3. 64位设备（ARM64）支持最佳
            
        
          
        
    
        根据Unity官方数据，全球2023年移动设备支持情况：
    
    - Android 5.0+：约98%设备支持
        
    - iOS 10.0+：约99%设备支持
        
    
    2. ###     内存访问问题
        

- 低端设备内存带宽有限，NativeArray 访问可能成为瓶颈
    
- 内存碎片问题在移动端更明显
    

3. ###   线程调度开销
    

- 低核数设备（1-2核）可能无法从 Job System 获益
    
- Unity worker线程创建/切换开销可能超过并行收益
    
- 低端设备在负载大时自动降频，多线程相当于没有
    

4. ###   job并行数据量小导致的问题
    

  jobsystem为了保证无锁多线程，内部做了很多job编排工作，所以在数据量很小的时候，这种编排操作就会造成比单线程耗时还长的情况出现

# 五. 展望

1. 沙盘的位置更新可以接入job+burst实现, 如行军/沙盘无极缩放物体的位置更新
    
2. 家园npc的移动也能通过job+burst实现
    

  

todo：

1. 获取高度也能job+burst
    
2. 建筑和npc的浮力job+burst后续可以考虑结合
    
3. moveComponent 设置
    
4. 总消耗
    

  

  

引用：

https://zhuanlan.zhihu.com/p/56459126

https://docs.unity3d.com/2021.3/Documentation/Manual/JobSystem.html

https://docs.unity3d.com/Packages/com.unity.burst@1.3/manual/index.html

https://blog.csdn.net/ww1351646544/article/details/139377781

https://heerozh.com/post/unity-job-xi-tong-ren-hua-jian-shu/