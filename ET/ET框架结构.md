---
tags:
  - ET
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
    {        object obj = Activator.CreateInstance(type);  
        ((ISingletonAwake)obj).Awake();  
        World.Instance.AddSingleton((ASingleton)obj);  
    }
}
```
# FiberManager和Fiber
## Filber调度方式
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
根据可用的核心数量，创建出相应的线程个数

`Fiber`是ET8.0版本的核心内容。通过`Process`和`Id`可以定位一个`Fiber`。
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
`Fiber`
## Fiber和Scene
![[（图解1）Fiber和Scene的层级关系.png|500]]

![[（图解2）ET8.0版本进程示例.png|530]]