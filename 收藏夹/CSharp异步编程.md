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
上面两个方法都能实现等待1秒的效果，但是区别在于，`Thread.Sleep`会阻塞主线程，但是`Task.Delay`则不会。



