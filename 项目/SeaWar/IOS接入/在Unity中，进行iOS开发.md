---
tags:
  - Unity/IOS开发
---

```cardlink
url: https://docs.unity.cn/cn/2021.1/Manual/iphone-GettingStarted.html
title: "iOS 开发入门 - Unity 手册"
description: "为 iPhone 和 iPad 等设备构建游戏需要采用与桌面 PC 游戏不同的方法。与 PC 市场不同，您的目标硬件是标准化的，不像搭载专用显卡的计算机那么快速或强大。因此，您必须以稍微不同的方式为这些平台开发游戏。此外，iOS 版 Unity 中提供的功能与桌面 PC 版的功能略有不同。"
host: docs.unity.cn
favicon: ../StaticFiles/images/favicons/favicon.png
image: https://unity3d.com/files/images/ogimg.jpg
```

# Unity与iOS原生层的交互

## iOS原生层开发（Objective-C开发）

通过编写.h和.mm文件来开发原生层的功能。在定义.h文件时，通常会用`NS_ASSUME_NONNULL_BEGIN`和`NS_ASSUME_NONNULL_END`宏来包裹相关的定义：
```objective-c
NS_ASSUME_NONNULL_BEGIN  
// ... 代码 ...  
NS_ASSUME_NONNULL_END
```
这是 Objective-C 的空安全标记：
- 在这个范围内声明的所有指针默认都是非空的
- 如果某个参数可以为空，需要显式标记 `nullable`
- 主要用于和 Swift 互操作时提供更好的类型安全

## 桥接层开发

桥接层示例如下：
```objective-c
[DllImport("__Internal")]  
public static extern void _IOS_StopBackgroundDownloadSupport();  
// 回调委托定义  
[UnmanagedFunctionPointer(CallingConvention.Cdecl)]  
public delegate void BackgroundTaskFailedCallback();
```


## Unity业务层开发