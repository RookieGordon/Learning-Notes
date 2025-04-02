---
tags:
  - CSharp
  - 异步编程
---

```cardlink
url: https://www.bilibili.com/video/BV1fkX7YQE4Y/?spm_id_from=333.1007.tianma.1-1-1.click&vd_source=b6adab4df1ba9fd0ec4afd2bda0940e9
title: "C#异步编程的一些新手常见误区_哔哩哔哩_bilibili"
description: "C#异步编程的一些新手常见误区, 视频播放量 4582、弹幕量 30、点赞数 382、投硬币枚数 256、收藏人数 283、转发人数 18, 视频作者 十月的寒流, 作者简介 Microsoft MVP｜专注于.NET、WPF、MVVM｜技术交流链接见FAQ专栏文章，相关视频：30+编程语言10亿次嵌套循环性能对比，我教你们git提交代码，不是把代码提交github上去。，如何优雅的避免代码嵌套? | 表驱动 | 状态模式 | lambda | 编程 | 空值判断 | 设计模式，go，一门丑到无法形容的语言，8GB显存对新游戏帧率影响明显｜显卡日报3月19日，太优雅辣！C#13，更新了啥？，go和rust谁是未来的主流，极客湾：纯臭打游戏，AU加A卡是最有性价比的吗？，聊聊Typescript 用go写不用C# 写这件事，写出简洁代码：掌握卫语句，消除IF嵌套！"
host: www.bilibili.com
image: https://i0.hdslb.com/bfs/archive/b6cdb59cd67ea4baf9a318b18e3d28dcd70be19e.jpg@100w_100h_1c.png
```

# Thread.Sleep和Task.Delay的异同
```CSharp
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
# 异步方法不是必须要有async/await关键字的
```CSharp
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
# 异步任务不是必须await的



