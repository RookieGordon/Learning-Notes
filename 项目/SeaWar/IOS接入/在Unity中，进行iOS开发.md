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

### 回调函数问题

当C#中某个函数需要被原生层调用时，需要添加`AOT.MonoPInvokeCallback`特性进行标记
```C
┌─────────────────────────────────────────────────────────────────────────┐  
│                    AOT（Ahead-Of-Time）编译问题                          │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  iOS 使用 AOT 编译（不允许 JIT）                                         │  
│                                                                         │  
│  问题：                                                                  │  
│  ┌───────────────────────────────────────────────────────────────┐     │  
│  │ 原生代码调用 C# 方法时，需要一个"反向 P/Invoke 封装器"          │     │  
│  │ (Reverse P/Invoke Wrapper)                                   │     │  
│  │                                                               │     │  
│  │ 如果没有 [MonoPInvokeCallback]，AOT 编译器不知道需要生成       │     │  
│  │ 这个封装器，导致运行时崩溃！                                   │     │  
│  └───────────────────────────────────────────────────────────────┘     │  
│                                                                         │  
│  解决：                                                                  │  
│  ┌───────────────────────────────────────────────────────────────┐     │  
│  │ [AOT.MonoPInvokeCallback(typeof(委托类型))]                   │     │  
│  │                                                               │     │  
│  │ 告诉 AOT 编译器：                                              │     │  
│  │ "这个方法会被原生代码调用，请生成对应的封装器"                  │     │  
│  └───────────────────────────────────────────────────────────────┘     │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘
```

#### iOS vs Android 回调机制对比

和Android开发对比，Unity侧的回调函数是可以直接传递到Android侧的。
```C
┌─────────────────────────────────────────────────────────────────────────┐  
│                    iOS 回调机制 (P/Invoke)                               │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  C# 传递函数指针给原生代码                                               │  
│                                                                         │  
│  ┌──────────────┐      函数指针       ┌──────────────┐                 │  
│  │    C#        │  ───────────────>   │  Objective-C │                 │  
│  │              │                     │              │                 │  
│  │ delegate     │      直接调用       │  callback()  │                 │  
│  │ 静态方法     │  <───────────────   │              │                 │  
│  └──────────────┘                     └──────────────┘                 │  
│                                                                         │  
│  特点：                                                                  │  
│  - 原生代码直接调用 C# 函数指针                                          │  
│  - 需要 [AOT.MonoPInvokeCallback] 生成封装器                            │  
│  - 必须是静态方法                                                        │  
│  - 调用约定必须匹配 (Cdecl)                                              │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘  
  
┌─────────────────────────────────────────────────────────────────────────┐  
│                   Android 回调机制 (JNI Proxy)                          │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  C# 传递 AndroidJavaProxy 对象给 Java                                   │  
│                                                                         │  
│  ┌──────────────┐    AndroidJavaProxy   ┌──────────────┐               │  
│  │    C#        │  ─────────────────>   │    Java      │               │  
│  │              │                       │              │               │  
│  │ Proxy 对象   │      JNI 反射调用     │  interface   │               │  
│  │ (普通实例)   │  <─────────────────   │  callback    │               │  
│  └──────────────┘                       └──────────────┘               │  
│                                                                         │  
│  特点：                                                                  │  
│  - Java 通过 JNI 反射调用 C# 方法                                        │  
│  - 不需要 [AOT.MonoPInvokeCallback]                                     │  
│  - 可以是实例方法                                                        │  
│  - Unity 自动处理线程切换                                                │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘
```

**为什么 Android 不需要 [AOT.MonoPInvokeCallback]？**

| 对比项  | iOS (P/Invoke)           | Android (JNI Proxy)        |
| ---- | ------------------------ | -------------------------- |
| 回调方式 | 函数指针直接调用                 | JNI 反射调用                   |
| 调用路径 | 原生 → Mono 封装器 → C#       | Java → JNI → Unity 代理 → C# |
| 封装器  | 需要 AOT 预生成               | Unity 运行时自动处理              |
| 方法类型 | 必须是 static               | 可以是实例方法                    |
| 特性需求 | 需要 [MonoPInvokeCallback] | 不需要                        |

**核心原因**
```C
┌─────────────────────────────────────────────────────────────────────────┐  
│  iOS：原生代码直接调用函数指针                                           │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  Objective-C:                                                           │  
│      callback();  // 直接调用，需要知道确切的内存地址和调用约定            │  
│                                                                         │  
│  问题：AOT 编译时，编译器不知道这个 C# 方法会被原生代码调用               │  
│  解决：[MonoPInvokeCallback] 告诉编译器生成封装器                        │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘  
  
┌─────────────────────────────────────────────────────────────────────────┐  
│  Android：通过 JNI 反射调用                                              │  
├─────────────────────────────────────────────────────────────────────────┤  
│                                                                         │  
│  Java:                                                                  │  
│      callback.onSuccess(path);  // 接口调用，JNI 处理转发                │  
│                                                                         │  
│  流程：                                                                  │  
│  1. Java 调用接口方法                                                   │  
│  2. JNI 识别到这是 Unity 代理对象                                       │  
│  3. Unity 运行时查找对应的 C# AndroidJavaProxy 实例                     │  
│  4. 通过反射调用 C# 方法                                                │  
│                                                                         │  
│  不需要预生成封装器，Unity 运行时动态处理                                │  
│                                                                         │  
└─────────────────────────────────────────────────────────────────────────┘
```

为什么 iOS 不用 AndroidJavaProxy 类似机制？因为 iOS 没有类似 JNI 的反射桥接层：
- Android：Java ↔ C# 之间有 JNI + Unity 运行时 作为中间层
- iOS：Objective-C ↔ C# 之间是直接的 P/Invoke，没有中间反射层














