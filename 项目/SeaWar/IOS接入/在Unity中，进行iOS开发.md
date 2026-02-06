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

### 桥接层结构（官方推荐做法）

```C
┌─────────────────────────────────────────────────────────────────────────┐  
│                   Unity iOS 原生插件标准结构                             │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  Assets/                                                                │  
│  └── Plugins/                                                           │  
│      └── iOS/                          ← iOS 专用插件目录                │  
│          ├── IOSUtility.cs             ← C# 桥接声明                     │  
│          ├── IOSUtility.mm             ← 原生实现（导出 C 函数）          │  
│          ├── SomeManager.h             ← 原生类头文件                    │  
│          └── SomeManager.mm            ← 原生类实现                      │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘
```

桥接层示例如下：
**IOSUtility.mm**
```c
extern "C"  
{
    void _IOS_StopBackgroundDownloadSupport()  
    {  
        [[DownloadBackgroundManager sharedManager] stopBackgroundDownloadSupport];  
    }  
    
    void _IOS_SetBackgroundTaskFailedCallback(IOSBackgroundTaskFailedCallback callback)  
    {  
        [[DownloadBackgroundManager sharedManager] setBackgroundTaskFailedCallback:callback];  
    }
}
```

**IOSUtility.cs**
```CSharp
public static class IOSUtility
{
    [DllImport("__Internal")]  
    public static extern void _IOS_StopBackgroundDownloadSupport();  
    
    // 回调委托定义  
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]  
    public delegate void BackgroundTaskFailedCallback();
}
```

`DllImport`和`UnmanagedFunctionPointer`用于两个不同的场景，C#调用iOS/C的代码，就需要使用`DllImport`特性。反之，原生代码需要回调C#代码，就需要使用`UnmanagedFunctionPointer`特性。

`CallingConvention.Cdecl`定义了函数调用时的底层规则：
1. 参数如何传递
```C
┌─────────────────────────────────────────────────────────────────┐  
│  函数调用：Add(1, 2, 3)                                         │  
├─────────────────────────────────────────────────────────────────┤  
│                                                                 │  
│  Cdecl (C 语言默认)          StdCall (Windows API 默认)         │  
│  ─────────────────────       ─────────────────────              │  
│  参数从右到左入栈              参数从右到左入栈                   │  
│  调用者清理栈                  被调用者清理栈                     │  
│                                                                 │  
│  栈 (Cdecl):                 栈 (StdCall):                      │  
│  ┌─────────┐                 ┌─────────┐                        │  
│  │    3    │ ← 先入           │    3    │                        │  
│  ├─────────┤                 ├─────────┤                        │  
│  │    2    │                 │    2    │                        │  
│  ├─────────┤                 ├─────────┤                        │  
│  │    1    │ ← 后入           │    1    │                        │  
│  └─────────┘                 └─────────┘                        │  
│  调用者负责清理 ←             被调用函数负责清理                   │  
│                                                                 │  
└─────────────────────────────────────────────────────────────────┘
```

2. 常见的调用约定

| 调用约定     | 使用场景               | 特点              |
| -------- | ------------------ | --------------- |
| Cdecl    | C/C++ 默认、iOS/macOS | 调用者清理栈，支持可变参数   |
| StdCall  | Windows API        | 被调用者清理栈，不支持可变参数 |
| ThisCall | C++ 成员函数           | this 指针通过寄存器传递  |
| FastCall | 优化调用               | 前几个参数通过寄存器传递    |

3. 为什么 iOS 用 Cdecl？
```CSharp
[UnmanagedFunctionPointer(CallingConvention.Cdecl)]
public delegate void BackgroundTaskFailedCallback();
```
	原因：
	- iOS/macOS 使用 C 语言 ABI，默认就是 Cdecl
	- Objective-C 底层基于 C，继承了 C 的调用约定
	- 跨语言调用必须约定一致，否则会栈不平衡导致崩溃

## Unity业务层开发