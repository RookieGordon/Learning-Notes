---
tags:
  - CSharp
  - 异步编程
---
# 经典误区
## Thread.Sleep和Task.Delay的异同
```C#
private static string SleepTest()  
{  
    Thread.Sleep(1000);  
    return "Sleep Done";  
}  
  
private static async Task<string> DelayTest()  
{  
    await Task.Delay(1000);  
    return "Delay Done";  
}
```
上面两个方法都能实现等待1秒的效果，但是区别在于，`Thread.Sleep`会阻塞调用方所在的线程，但是`Task.Delay`则不会。
## 异步方法不是必须要有async/await关键字的
```C#
static async Task<int> Foo1()  
{  
    await Task.Delay(1000);  
    return 1;  
}  
  
static Task<int> Foo2()  
{  
    return Task.Delay(1000).ContinueWith(_=> 1);  
}
```
以上两个方法是等价的
## 异步任务不是必须await的



