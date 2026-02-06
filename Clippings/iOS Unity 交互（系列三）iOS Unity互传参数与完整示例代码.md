---
title: "iOS Unity 交互（系列三）iOS Unity互传参数与完整示例代码"
source: "https://www.jianshu.com/p/0b2a04acd51a"
author:
  - "[[简书]]"
published: 2022-01-19
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

实现在Unity中调用Xcode里面的函数传值，然后Xcode处理完把结果再传给Unity，然后Unity移除GameObject，Xcode把对应的对象销毁。

在Unity里面放一个立方体（Cube），把脚本挂载到立方体上，运行项目，观察Unity iOS传值，随后销毁立方体。

#### 操作流程

1、在Unity里面放一个立方体 Cube。

1、在上一个已经生成的Xcode项目中，写.mm代码，编译通过后，复制粘贴到Unity工程里，（.mm文件放在 Asset/Plugins/iOS 目录下）。

2、在Unity中写C#脚本。

3、运行项目

#### 第1步 在场景里新建一个立方体，并挂载脚本。

这一步使用到了上篇文章里的工程。如果不清楚项目是怎么来的，看一下上一篇 [iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值](https://www.jianshu.com/p/04eaca440c5e)

![](https://upload-images.jianshu.io/upload_images/1235875-94ca2e10e88a7ee2.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

1.png

#### 第2步 写代码

图片中的完整代码在文章末尾  
jiaoben.cs 代码文件在 Asset 目录下，Unity\_iOS\_Connect.mm 文件在 Asset/Plugins/iOS目录下。

  
![](https://upload-images.jianshu.io/upload_images/1235875-32f90a93ce37ba87.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

2.png

#### 第3步 生成Xcode项目，真机运行。

![](https://upload-images.jianshu.io/upload_images/1235875-d49829f62482e4e8.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

3.png

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
    private static extern void BridgeObjectInitWith(string name);

    [DllImport("__Internal")]
    private static extern void BridgeObjectNeed(string name);

    [DllImport("__Internal")]
    private static extern void BridgeObjectDestory();

    void Start()
    {
        Debug.Log("脚本开始运行");
        //初始化对象,传入Unity 里面要挂载到的 GameObject 对象名字
        //这里脚本挂载到了自定义的一个立方体上
        BridgeObjectInitWith("CubeOnYourPhone");
        //初始化之后给iOS发送消息
        BridgeObjectNeed("Unity_Tag");
        //3秒钟之后把自己从场景中干掉
        GameObject.Destroy(this.gameObject, 3.0f);
    }

    //写上在 OC .mm文件中的同名函数
    public void ObtainIOSMessage(string msg)
    {
        Debug.Log("C# 脚本收到消息: " + msg);
    }

    //在挂载对象销毁的时候,把OC里面的类也销毁掉,避免占用内存
    private void OnDestroy()
    {
        BridgeObjectDestory();
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

//写一个OC类 BridgeObject
@interface BridgeObject : NSObject
///Unity中挂载脚本的对象名字
@property (nonatomic, strong) NSString *objectName;

@end

@implementation BridgeObject

- (void)dealloc {
    NSLog(@"♻️♻️♻️♻️ 实例对象 已经销毁");
}

- (instancetype)initWithObject:(NSString *)objectName {
    if (self = [super init]) {
        self.objectName = objectName;
    }
    return self;
}

- (void)handleMsgFromUnity:(NSString *)message {
    NSLog(@"调用 %s", __func__);
    NSString *s = [NSString stringWithFormat:@"%@ & iOS_Tag", message];
    UnitySendMessage([self.objectName UTF8String], "ObtainIOSMessage", [s UTF8String]);
}

@end

BridgeObject *instance = nil;

extern "C" {
//初始化
extern void BridgeObjectInitWith(const char *gameObjectName) {
    NSString *s = [NSString stringWithUTF8String:gameObjectName];
    if (instance == nil) {
        instance = [[BridgeObject alloc] initWithObject:s];
    }
}

//初始化
extern void BridgeObjectNeed(const char * message) {
    NSString *s = [NSString stringWithUTF8String:message];
    [instance handleMsgFromUnity:s];
}

///销毁
extern void BridgeObjectDestory() {
    instance = nil;
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
