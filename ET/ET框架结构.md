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