---
tags:
  - ET8/框架介绍/框架结构
  - ET8
  - ET8/CodeLoader
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

# [[Fiber 纤程模型|Fiber]]

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


```cardlink
url: https://www.yuque.com/et-xd/docs/cn0ygw71saocki21
title: "ET.ThirdParty 之 ETTask · 语雀"
description: "代码using System; using Syste..."
host: www.yuque.com
image: https://mdn.alipayobjects.com/huamei_0prmtq/afts/img/A*sRUdR543RjcAAAAAAAAAAAAADvuFAQ/original
```
