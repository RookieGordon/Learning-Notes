---
tags:
  - ET
---
# World和Singleton抽象类
`World`是游戏入口的单例对象，其他单例类都必须继承自`Singleton`抽象类，并且都被`World`所管理（`singletons`）
```CSharp
private readonly Dictionary<Type, ASingleton> singletons = new();
```

# FiberManager

# CodeLoader热更代码加载器
`CodeLoader`通过`YooAsset`和`HybridCLR`加载到热更新代码后，向`World`添加`CodeTypes`单例对象，该对象主要是用来做代码热重载的，只有被`CodeAttribute`特性修饰的类才能被re'chong
# Fiber和Scene
![[（图解1）Fiber和Scene的层级关系.png|550]]

![[（图解2）ET8.0版本进程示例.png|530]]