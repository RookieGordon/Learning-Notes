---
title: "iOS Unity 交互（系列二）iOS调用Unity函数 iOS给Unity传值"
source: "https://www.jianshu.com/p/f397d51e4447"
author:
  - "[[简书]]"
published: 2022-01-18
created: 2026-02-06
description: "前言: 这次是iOS和Unity交互。过程没有预想的那么顺利，也踩了一些坑，做个笔记。 要做的事情就是实现 iOS 和 Unity 交互，互相调用函数，传值。 传值系列 iO..."
tags:
  - "clippings"
---
## 前言:

这次是iOS和Unity交互。过程没有预想的那么顺利，也踩了一些坑，做个笔记。

要做的事情就是实现 iOS 和 Unity 交互，互相调用函数，传值。

## 传值系列

[iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值](https://www.jianshu.com/p/04eaca440c5e)  
[iOS Unity 交互（系列二）iOS调用Unity函数 iOS给Unity传值](https://www.jianshu.com/p/f397d51e4447)  
[iOS Unity 交互（系列三）iOS Unity互传参数与完整示例代码](https://www.jianshu.com/p/0b2a04acd51a)  
[iOS Unity 交互（系列四）Unity调用iOS SDK](https://www.jianshu.com/p/d18212c1455a)

#### 需要的工具

1、苹果电脑安装：Xcode，Unity，VSCode，开发工具安装最新的就行。

2、苹果手机真机，用于调试。

#### 实现目标

本篇实现在iOS代码中，调用 void UnitySendMessage(const char\* obj, const char\* method, const char\* msg); 方法给Unity传值

#### 操作流程

1、在上一个已经生成的Xcode项目中，编写发消息的代码，把这份代码复制粘贴到Unity项目中。

2、在Unity项目中写好接受函数。

3、在Unity里面重新生成Xcode项目，运行。

#### 第1步 写发送消息的代码

这一步使用到了上篇文章里的工程。如果不清楚项目是怎么来的，看一下上一篇 [iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值](https://www.jianshu.com/p/04eaca440c5e)

为什么要用到上一篇文章里的工程？  
1、一个Unity（需要运行在苹果手机上的Unity项目）项目，那么，最终是要从Unity项目里生成Xcode项目，然后放到手机上运行的。  
2、实际开发调试中，经常是这么一个循环： 在Unity中写好函数调用 → 生成Xcode项目 → Xcode项目连接手机调试 → 改动.mm文件 → Xcode调试通过 → 把Xcode中的.mm文件内容复制到Unity中的.mm里 → 重新生成Xcode项目 → Xcode项目连接手机调试...... 因为生成出来的Xcode项目里面包含了Unity的库（比如UnitySendMessage这个函数），在调用的时候不会给你报什么函数找不到，编译不通过这样的低级错误，能加快调试速度。

编写Xcode里面的.mm 文件代码，完整的示例代码在文章末尾给出。

  
![](https://upload-images.jianshu.io/upload_images/1235875-f69c5267f7674962.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

1.png

#### 第2步 把Xcode里调试通过的.mm 文件内容，复制到Unity里面的.mm 文件里。

![](https://upload-images.jianshu.io/upload_images/1235875-f09e68785d8b5ee0.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

2.png

#### 第3步 编写C#脚本，接受iOS消息

![](https://upload-images.jianshu.io/upload_images/1235875-355c4f55c7e3749a.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

3.png

#### 第4步 重新生成Xcode项目，真机运行。

![](https://upload-images.jianshu.io/upload_images/1235875-64183c4a65002cfc.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

4.png

#### 图片中的示例代码：

C# 脚本代码 jiaoben.cs

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using System.Runtime.InteropServices;

public class Jiaoben : MonoBehaviour
{

    [DllImport("__Internal")]
    private static extern void OCObjectInitWith(string name);

    void Start()
    {
        Debug.Log("脚本开始运行");
        //初始化对象,传入Unity 里面要挂载到的 GameObject 对象名字
        //这里因为脚本挂载到了相机(Main Camera)上,所以就写 Main Camera
        OCObjectInitWith("Main Camera");
    }

    //写上在 OC .mm文件中的同名函数
    public void ReceiveIOSMessage(string msg)
    {
        Debug.Log("C#收到:" + msg);
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
```

OC.mm文件代码 Unity\_iOS\_Connect.mm

```csharp
//
//  Unity_iOS_Connect.m
//
//
//  Created by 程序猿 on 2020/2/31.
//

#import <Foundation/Foundation.h>

//写一个OC类,
@interface OCObject : NSObject
///初始化对象名字
@property (nonatomic, strong) NSString *object;

@end

@implementation OCObject

- (void)dealloc {
    NSLog(@"♻️♻️♻️♻️ 实例对象 已经销毁");
}

- (instancetype)initWithObject:(NSString *)object {
    if (self = [super init]) {
        self.object = object;
        NSLog(@"调用 %s", __func__);
        [self performSelector:@selector(actionLog) withObject:nil afterDelay:5];
    }
    return self;
}

- (void)actionLog {
    NSLog(@"调用 %s", __func__);
    /*
     UnitySendMessage 方法来源: 这个方法来自于 Unity 工程生成 Xcode工程之后自带就有, 可直接调用.
     如果是新建一个Xcode工程,然后弄个 .mm 文件, 是无法调用 UnitySendMessage 这个方法的, 因为根本不知道去哪找.
     
     当前的Xcode工程是上一篇文章里后续已经生成出来的,所以在这个已经生成的Xcode工程里直接调用 UnitySendMessage 不会报错
     
     void    UnitySendMessage(const char* obj, const char* method, const char* msg);
     
     UnitySendMessage 三个参数:
     1.脚本挂载的 Unity Ganme Object 名, 根据这个名, 对应的脚本C#代码才能收到iOS发过来的消息.
     2.函数名
     3.函数参数
     */
    UnitySendMessage([self.object UTF8String], "ReceiveIOSMessage", [@"iOSXYZ消息" UTF8String]);
}

@end

OCObject *instance = nil;

extern "C" {

//初始化
extern void OCObjectInitWith(const char *objName) {
    NSString *s = [NSString stringWithUTF8String:objName];
    if (instance == nil) {
        instance = [[OCObject alloc] initWithObject:s];
    }
}

///销毁
extern void CadenceDestory() {
    instance.object = nil;
}
}
```

## 结语

终究是有一天碰上了Unity。

感谢以下iOS/Unity玩家的文章：  
[Unity3D与iOS的交互](https://www.jianshu.com/p/1ab65bee6692)
[<iOS和Unity交互>之参数传递](https://www.jianshu.com/p/86c4d9c9dafe)  
[Unity与iOS交互](https://www.jianshu.com/p/92fd1d197076)  
[unity 与oc交互](https://www.jianshu.com/p/8471114d6c3d)  
[Unity平台调用IOS](https://links.jianshu.com/go?to=https%3A%2F%2Fmy.oschina.net%2Fu%2F698044%2Fblog%2F610430)  
[Unity和OC简单交互(方法互调)](https://links.jianshu.com/go?to=https%3A%2F%2Fzhuanlan.zhihu.com%2Fp%2F375040440)  
[Unity-IOS交互整理](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.1024sou.com%2Farticle%2F62780.html)  
[iOS与Unity交互笔记之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.jb51.net%2Farticle%2F159590.htm)  
[iOS 和 Unity之间参数传递的方法](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.yisu.com%2Fzixun%2F570616.html)  
[iOS与Unity交互笔记之参数传递](https://links.jianshu.com/go?to=http%3A%2F%2Fwww.manongjc.com%2Farticle%2F101353.html)  
[iOS和Unity交互之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fcherish_joy%2Farticle%2Fdetails%2F70314336)  
[Unity3d与iOS交互开发—接入平台SDK必备技能](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.aliyun.com%2Farticle%2F130504)  
[iOS 和 Unity 交互之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fmy.oschina.net%2Fu%2F4589456%2Fblog%2F4584594)

报错解决：  
[malloc: \*\*\* error for object 0x1018ad6a0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fu012138730%2Farticle%2Fdetails%2F82896060)
[Unity 调用oc报错：malloc: \*\*\* error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjbl20078%2Farticle%2Fdetails%2F77865193)  
[malloc: \*\*\* error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fwuming22222%2Farticle%2Fdetails%2F38900637)  
[Unity3D中C#调用iOS的静态库(\*.a)](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fskylin19840101%2Farticle%2Fdetails%2F51039176%3Fspm%3D1001.2101.3001.6650.1%26utm_medium%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26depth_1-utm_source%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26utm_relevant_index%3D2)  
[pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjiangxf24%2Farticle%2Fdetails%2F84044308)

最后编辑于 ：

©著作权归作者所有,转载或内容合作请联系作者  
【社区内容提示】社区部分内容疑似由AI辅助生成，浏览时请结合常识与多方信息审慎甄别。  
平台声明：文章内容（如有图片或视频亦包括在内）由作者上传并发布，文章内容仅代表作者本人观点，简书系信息发布平台，仅提供信息存储服务。