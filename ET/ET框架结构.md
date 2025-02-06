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

# CodeLoade热更代码加载器
# Fiber和Scene
![[（图解1）Fiber和Scene的层级关系.png|550]]

![[（图解2）ET8.0版本进程示例.png|530]]