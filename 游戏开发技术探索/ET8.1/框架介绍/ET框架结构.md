---
tags:
  - ET8/框架介绍/框架结构
  - ET8
  - ET8/CodeLoader
  - ET8/FiberManager
  - ET8/Fiber
  - ET8/MainThreadScheduler
  - ET8/ThreadScheduler
  - ET8/ThreadPoolScheduler
  - ET8/Entity
  - ET8/Unit
  - ET8/启动流程
  - ET8/登录流程
---

# World和Singleton抽象类

`World`是游戏入口的单例对象，其他单例类都必须继承自`Singleton`抽象类，并且都被`World`所管理（`singletons`）

```CSharp
private readonly Dictionary<Type, ASingleton> singletons = new();
```

# CodeLoader热更代码加载器

`CodeLoader`通过`YooAsset`和`HybridCLR`加载到热更新代码后，向`World`添加`CodeTypes`单例对象，该对象主要是用来做代码热重载的，只有被`CodeAttribute`特性修饰的类才能被热重载

```CSharp
public void CreateCode()  
{  
    var hashSet = this.GetTypes(typeof (CodeAttribute));  
    foreach (Type type in hashSet)  
    {        
        object obj = Activator.CreateInstance(type);  
        ((ISingletonAwake)obj).Awake();  
        World.Instance.AddSingleton((ASingleton)obj);  
    }
}
```

# FiberManager和Fiber

通过`Create`方法，可以创建一个`Fiber`对象

```CSharp
public async ETTask<int> Create(SchedulerType schedulerType, 
                                int fiberId, 
                                int zone, 
                                SceneType sceneType, 
                                string name)
{
    try
    {
        Fiber fiber = new(fiberId, zone, sceneType, name);
        if (!this.fibers.TryAdd(fiberId, fiber))
        {
            throw new Exception(
                            $"same fiber already existed, 
                            if you remove, please await Remove then Create fiber! {fiberId}");
        }
        this.schedulers[(int) schedulerType].Add(fiberId);
        TaskCompletionSource<bool> tcs = new TaskCompletionSource<bool>();
        fiber.ThreadSynchronizationContext.Post(async () =>
        {
            try
            {
                // 根据Fiber的SceneType分发Init,必须在Fiber线程中执行
                await EventSystem.Instance.Invoke<FiberInit, ETTask>(
                                                (long)sceneType, 
                                                new FiberInit() {Fiber = fiber});
                tcs.SetResult(true);
            }
            catch (Exception e)
            {
                Log.Error($"init fiber fail: {sceneType} {e}");
            }
        });
        await tcs.Task;
        return fiberId;
    }
    catch (Exception e)
    {
        throw new Exception($"create fiber error: {fiberId} {sceneType}", e);
    }
}
```

创建完`Fiber`后，使用委托，派发一个`FiberInit`事件。

## Fiber调度方式

`FiberManager`提供了三种调度方式，分别是：主线程调度，（指定）线程调度和线程池调度

```CSharp
public enum SchedulerType
{
    Main,
    Thread,
    ThreadPool,
}
```

### MainThreadScheduler主线程调度

```CSharp
private readonly ConcurrentQueue<int> idQueue = new();
private readonly ConcurrentQueue<int> addIds = new();
private readonly FiberManager fiberManager;
private readonly ThreadSynchronizationContext threadSynchronizationContext = new();

public MainThreadScheduler(FiberManager fiberManager)
{
    SynchronizationContext.SetSynchronizationContext(
                                                this.threadSynchronizationContext);
    this.fiberManager = fiberManager;
}
```

`ThreadSynchronizationContext`是自定义的上下文同步对象，`Fiber`中就有该对象，用于记录当前`Fiber`的上下文。`idQueue`用于记录`Fiber`对象的id。`MainThreadScheduler.Update`方法，会先切换到主线程，执行主线程的任务，然后遍历`idQueue`队列，通过`FiberManager`获取到指定的`Fiber`对象，切换到其上下文，执行其内部的任务。所有`Fiber`都执行完毕后，最后再切回主线程。

```CSharp
public void Update()
{
    SynchronizationContext.SetSynchronizationContext(
                                        this.threadSynchronizationContext);
    this.threadSynchronizationContext.Update();
    int count = this.idQueue.Count;
    while (count-- > 0)
    {
        if (!this.idQueue.TryDequeue(out int id))
        {
            continue;
        }

        Fiber fiber = this.fiberManager.Get(id);
        // 一些合法性判断
        Fiber.Instance = fiber;
        SynchronizationContext.SetSynchronizationContext(
                                        fiber.ThreadSynchronizationContext);
        fiber.Update();
        Fiber.Instance = null;
        this.idQueue.Enqueue(id);
     }
     // Fiber调度完成，要还原成默认的上下文，否则unity的回调会找不到正确的上下文
     SynchronizationContext.SetSynchronizationContext(
                                        this.threadSynchronizationContext);
}
```

### ThreadScheduler固定线程调度

```CSharp
private readonly ConcurrentDictionary<int, Thread> dictionary = new();
private readonly FiberManager fiberManager;

public ThreadScheduler(FiberManager fiberManager)
{
    this.fiberManager = fiberManager;
}
```

`dictionary`用于存放线程，通过`Add`方法可知，每个`Fiber`对象都会分配一个线程。`Lopp`方法和`MainThreadScheduler.Update`方法思路一致，都是取出`Fiber`后，同步上下文，然后执行`Fiber.Update`和`Fiber.LateUpdate`

### ThreadPoolScheduler线程池调度

```CSharp
private readonly List<Thread> threads;
private readonly ConcurrentQueue<int> idQueue = new();
private readonly FiberManager fiberManager;

public ThreadPoolScheduler(FiberManager fiberManager)
{
    this.fiberManager = fiberManager;
    int threadCount = Environment.ProcessorCount;
    this.threads = new List<Thread>(threadCount);
    for (int i = 0; i < threadCount; ++i)
    {
        Thread thread = new(this.Loop);
        this.threads.Add(thread);
        thread.Start();
    }
}
```

根据可用的核心数量，创建出相应的线程个数。`Loop`方法，会将所有的`Fiber`分配到这些线程上去执行（非固定），每次`While`执行的`Fiber`数量是`Fiber`总数和可用核心数共同决定的。

```CSharp
private void Loop()
{
    int count = 0;
    while (true)
    {
        if (count <= 0)
        {
            Thread.Sleep(1);
            // count最小为1
            count = this.fiberManager.Count() / this.threads.Count + 1;
        }
  
        --count;
        // 从队列中取出Fiber，执行Fiber的任务
     }
}
```

## Fiber

通过`Process`和`Id`可以定位一个`Fiber`，`Process`来自于启动参数，Unity客户端默认是1，服务器则是通过启动配置`StartSceneConfig@s.xlsx`来启动服务器的。

```CSharp
public int Process  
{  
    get  
    {  
        return Options.Instance.Process;  
    }
}

// 其他字段和属性

internal Fiber(int id, int zone, SceneType sceneType, string name)  
{            
	this.Id = id;  
    this.Zone = zone;  
    this.EntitySystem = new EntitySystem();  
    this.Mailboxes = new Mailboxes();  
    this.ThreadSynchronizationContext = new ThreadSynchronizationContext();  
#if UNITY  
    this.Log = Logger.Instance.Log;  
#else  
    this.Log = new NLogger(sceneType.ToString(), this.Process, this.Id);  
#endif  
    this.Root = new Scene(this, id, 1, sceneType, name);  
}
```

`EventSystem`用于执行`Entity`对象的Update和LateUpdate生命周期。`LateUpdate`在执行完`Entity`的`LateUpdate`生命周期后，会完成`WaitFrameFinish`的task。最后再执行抛回到主线程的回调。
每个`Fiber`都会配置一个`Scene`

# 初始化和登录流程

## 初始化流程

![[（图解1）ET8.0框架初始化流程.png]]

### 启动参数

客户端是没有启动参数的。服务器的启动参数如下：

```CSharp
if (GUILayout.Button("Start Server(Single Process)"))  
{  
    string arguments = $"App.dll --Process=1 --StartConfig=StartConfig/{this.startConfig} --Console=1";  
    ProcessHelper.Run(dotnet, arguments, "../Bin/");  
}  
  
if (GUILayout.Button("Start Watcher"))  
{  
    string arguments = $"App.dll --AppType=Watcher --StartConfig=StartConfig/{this.startConfig} --Console=1";  
    ProcessHelper.Run(dotnet, arguments, "../Bin/");  
}  
  
if (GUILayout.Button("Start Mongo"))  
{  
    ProcessHelper.Run("mongod", @"--dbpath=db", "../Database/bin/");  
}
```

结合`EntryEvent2_InitServer`代码可以得知，服务器总共会启动三种进程：`Server（逻辑进程）`，`Watcher（守护进程）`，`Mongo（数据库进程）`。

`StartConfig`为启服配置，目前有：`Benchmark压测`，`Localhost本地服`，`Release正式服`，`RouterTest路由测试`几种配置，每种启服配置都需要：`StartMachineConfig`，`StartProcessConfig`，`StartSceneConfig`，`StartZoneConfig`四种配置文件。

### CodeLoader和CodeTypes

`CodeLoader`在服务端负责的工作很少，主要就是读取相关程序集的dll（`Hotfix`）文件，载入进来后启动。在客户端负责和`HybridCLR`一起，加载热更新的程序集（`Model`、`ModelView`、`Hotfix`、`HotfixView`）。ET框架的客户端一共存在`Loader`，`Core`、`Model`、`ModelView`、`Hotfix`、`HotfixView`、`ThirdParty`共7个程序集。

`CodeTypes`主要是用来做热重载功能的类。`Hotfix`中的所有普通类，都能被热重载，对于单例对象，只有被`Code`特性修饰的，才能被热重载。

## Fiber和Scene

创建`Fiber`的时候，会自动创建一个`Scene`并且关联起来。一般情况下，业务逻辑都是写在某个`Scene`当中的，`Scene`上会携带其所需的一些组件。整个`World`，`Fiber`，`Scene`呈现出一个标准的树状结构。Demo版本树状图如下：[[客户端组件树状图]]，[[服务端组件树状图]]

![[（图解2）ET8.0中，Fiber和Scene的层级关系.png|660]]
![[（图解3）ET8.0进程示例.png|660]]

对于`Scene`的使用没有非常硬性的要求，一般来说，客户端有两个`Fiber`，一个跑游戏业务逻辑，一个跑网络协议收发。业务`Fiber`拥有一个`Main Scene`，带有一个`CurrentScenesComponent`组件，可以再创建一个可变的`CurrentScene`，用于不同的场景。通常来说，可以将`CurrentScene`和Unity中的场景关联起来，其下的所有`Entity`会随着场景的变化动态加载和释放。

对于服务器而言，可以在`StartSceneConfig`配置中，按照业务逻辑，配置对应的`Scene`，比如，聊天服务就可以是一个单独的`Scene`。

## 登录流程

![[（图解4）ET8.0登陆流程图.png]]

框架的登录流程如图所示，客户端采用`ClientSenderComponent`组件与后端进行[[网络协议收发|协议交互]]
登录协议是`Main2NetClient_Login`，回包协议是`NetClient2Main_Login`。详细的发送和接收处理逻辑在`Main2NetClient_LoginHandler`类中

# Entity


# Unit


```cardlink
url: https://www.yuque.com/et-xd/docs/cn0ygw71saocki21
title: "ET.ThirdParty 之 ETTask · 语雀"
description: "代码using System; using Syste..."
host: www.yuque.com
image: https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*sRUdR543RjcAAAAAAAAAAAAADvuFAQ/original
```
