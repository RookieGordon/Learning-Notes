---
link: https://www.cnblogs.com/wangqiang3311/p/11201647.html
excerpt: 一、什么是委托呢？
  听着名字挺抽象，确实不好理解。面试官最喜欢考察这个，而且更喜欢问：“委托和事件有何异同？”。如果对一些知识点没有想明白，那么很容易被绕进去。研究任何事物，我们不妨从它的定义开始，委托也不例外。那么先来看c#中的委托定义，先来个例子：
  这个委托，看起来就是个方法签名，取包裹，需要验
tags:
  - slurp/.net&&c#
slurped: 2024-06-18T04:24:21.638Z
title: 彻底搞清楚c#中的委托和事件 - micDavid - 博客园
---

# **一、什么是委托呢？**

听着名字挺抽象，确实不好理解。面试官最喜欢考察这个，而且更喜欢问：“委托和事件有何异同？”。如果对一些知识点没有想明白，那么很容易被绕进去。研究任何事物，我们不妨从它的定义开始，委托也不例外。那么先来看c#中的委托定义，先来个例子：

```CSharp
public delegate void GetPacage(string code);
```

这个委托，看起来就是个方法签名，取包裹，需要验证码。与方法签名不同的地方，在于多了一个**delegate**。c#中不乏一些便利好用的语法，比如**foreach、yield**，每一个关键字背后都有一段故事。delegate的背后，又有什么故事呢？其实就是c#编译器帮我们做了些什么事情。要知道这个，我们得看生成的**IL**，如何查看IL？请看下图：

![](https://img2018.cnblogs.com/blog/110779/201907/110779-20190717113157196-200047044.png)

vs命令行中输入 ildasm,会打开一个反编译的窗口，选择我们的程序集，如下图：

![](https://img2018.cnblogs.com/blog/110779/201907/110779-20190717113351120-2062309341.png)

从图中可以看出：
1. 委托的本质就是一个密封类，这个类继承了`MulticastDelegate`（多播委托）
2. 委托的构造函数，有两个参数，一个类型是IntPtr，用来接收方法的，如下图：
![|380](https://img2018.cnblogs.com/blog/110779/201907/110779-20190717114648543-2015891205.png)

3. 可以同步调用（Invoke），也可以异步调用 （BeginInvoke、EndInvoke）
注：
1. 多播委托：一个委托可以代表多个相同签名的方法，当委托被调用时，这些方法会依次执行
2. IntPtr表示窗口的时候，叫它“句柄”，表示方法时，叫它“指针”
3. 异步调用：会产生一个线程，异步执行

# **二、委托有什么用？**

在js中，并没有提委托的概念，却有“回调”，比如ajax回调。把一个函数传递到另外一个函数里执行，是非常自然的事情。但是在c#中，不能直接把方法名传递进去。所以创造了委托这么个类型。c#中的委托也是为了回调。委托有什么好处？举个例子：皇帝颁发圣旨，得派一个大臣去。大臣到了目的地，宣读圣旨后，这才得以执行。这说明以下两点：
1. 委托有很好的封装性
2. 委托的实例化与它的执行是在不同的对象中完成的

# **三、委托与代理**

我说的代理，是指设计模式中的代理。代理与实际对象有相同的接口，委托与实际方法有相同的方法签名。这就是它们类似的地方。无论是相同的接口，还是相同的方法签名，其本质是遵循相同的协议。这是它们仅存的相似点。不同点多了，如目的不同，委托只是回调，而代理是对实际对象的访问控制。

# **四、委托和事件**

先看一段代码：

```CSharp
public delegate void GetPacage(string code);
public class Heater
{
    public event EventHandler OnBoiled;
    public event GetPacage PackageHandler;
    private void RasieBoiledEvent()
    {
        if (OnBoiled == null)
        {
            Console.WriteLine("加热完成处理订阅事件为空");
        }
        else
        {
            OnBoiled(this, new EventArgs());
        }
    }
    public void Begin()
    {
        heatTime = 5;
        Heat();
        Console.WriteLine("加热器已经开启", heatTime);

    }
    private int heatTime;
    private void Heat()
    {
        Console.WriteLine("当前Heat Method线程：" + Thread.CurrentThread.ManagedThreadId);
        while (true)
        {
            Console.WriteLine("加热还需{0}秒", heatTime);

            if (heatTime == 0)
            {
                RasieBoiledEvent();
                return;
            }
            heatTime--;
            Thread.Sleep(1000);

        }
    }
}
```

这个是加热器例子，为了研究事件，里面混合了自定义的委托和事件。我们看看第6行编译后的代码（红框）：

![](https://img2018.cnblogs.com/blog/110779/201907/110779-20190717142804355-912950814.png)

编译器帮我们做了如下的事情：

1、生成了一个私有的委托字段

[CompilerGenerated, DebuggerBrowsable(DebuggerBrowsableState.Never)]
private GetPacage PackageHandler;

2、生成了添加和移除委托的方法

[CompilerGenerated]
public void add_PackageHandler(GetPacage value)
{
    GetPacage pacage2;
    GetPacage packageHandler = this.PackageHandler;
    do
    {
        pacage2 = packageHandler;
        GetPacage pacage3 = (GetPacage) Delegate.Combine(pacage2, value);
        packageHandler = Interlocked.CompareExchange<GetPacage>(ref this.PackageHandler, pacage3, pacage2);
    }
    while (packageHandler != pacage2);
}  

这就是事件和委托的关系。有点像字段和属性的关系。那有人说，事件是一种包装的委托，或者特殊的委托，那么到底对不对呢？我觉得不对。比如我坐了公交车回家了，能说我是一个特殊的公交车吗？不能说A事物拥有了B事物的能力，就说A是特殊的B。那到底该怎么描述事件和委托之间的关系呢？**事件基于委托，但并非委托。**可以把事件看成委托的代理。在使用者看来，只有事件，而没有委托。**事件是对委托的包装**，这个没错，到底包装了哪些东西？

1、保护委托字段，对外不开放，所以外部对象没法直接操作委托。提供了Add和Remove方法，供外部对象订阅事件和取消事件

2、事件的处理方法在对象外部定义，而事件的执行是在对象的内部，至于事件的触发，何时何地无所谓。

**五、c#鼠标键盘事件**

此类事件的底层实现，一方面是消息循环，另一方面是硬件中断，或者两者结合实现，有空了再研究。

**六、经典面试题，猫叫、老鼠跑了，主人醒来了**

   public delegate void ScreamHandler();

    public class Cat
    {
        public event ScreamHandler OnScream;

        public void Scream()
        {
            Console.WriteLine("猫叫了一声");
            OnScream?.Invoke();
        }

    }
    public class Mouse
    {
        public Mouse(Cat c)
        {
            c.OnScream += () =>
            {
                Console.WriteLine("老鼠跑了");
            };
        }
    }

    public class People
    {
        public People(Cat c)
        {
            c.OnScream += () =>
            {
                Console.WriteLine("主人醒来了");
            };
        }
    }

客户端调用：

  Cat cat = new Cat();
  Mouse m = new Mouse(cat);
  People p = new People(cat);
  cat.Scream();

运行结果：

![](https://img2018.cnblogs.com/blog/110779/201907/110779-20190717161347547-924653332.png)