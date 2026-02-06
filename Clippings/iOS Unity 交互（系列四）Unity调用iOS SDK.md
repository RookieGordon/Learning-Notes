---
title: "iOS Unity 交互（系列四）Unity调用iOS SDK"
source: "https://www.jianshu.com/p/d18212c1455a"
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

#### 实现场景

A公司给我们提供了他们自己生产的蓝牙设备，并且提供了iOS SDK，我们把他们提供的iOS SDK放入自己的Xcode项目里面，调用SDK，就能连接他们的蓝牙设备，并持续获取蓝牙设备发送过来的值。

现在，要把 “连接蓝牙设备 - 获取设备值” 这套逻辑放到Unity项目里，从Unity里面生成Xcode项目，然后把这个Xcode项目运行到手机上。

所以，要做的事情就是，写代码暴露A公司的SDK，以供Unity项目使用，我们充当一个桥接者的角色。

#### 操作流程

在前3篇文章里逐步讲解了 iOS 和 Unity是如何交互，互相发送消息，以及工程的创建，调试思路。本篇在此基础之上，直接写代码，不做其他细节讲述。

1、创建一个Unity项目，拖入一个物体，然后写个脚本挂载到物体上。  
2、创建一个Xcode项目，导入A公司SDK，自己代码调试蓝牙成功之后，再把你的代码 改写到一个.mm文件里面，备用。  
3、把A公司SDK和你的.mm文件一起放到Unity项目的 Asset/Plugins/iOS 目录下面。  
4、生成Xcode项目，运行。

#### 第1步

这一步使用到了上篇文章里的工程。如果不清楚项目是怎么来的，看一下上一篇 [iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值](https://www.jianshu.com/p/04eaca440c5e)

图片中的完整代码在文章末尾

  
![](https://upload-images.jianshu.io/upload_images/1235875-1faaa11fc9b3d1fb.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

1.png

#### 第2步 写代码

![](https://upload-images.jianshu.io/upload_images/1235875-1cd2e47eb4c364da.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

2.png

#### 图片中的示例代码：

C# 脚本代码 jiaoben.cs

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Runtime.InteropServices;

public class Jiaoben : MonoBehaviour
{
    //定义函数 初始化
    [DllImport("__Internal")]
    private static extern void CadenceInitWith(string name);
    //定义函数 开始连接
    [DllImport("__Internal")]
    private static extern void CadenceConnectWith(string name);
    //定义函数 断开连接
    [DllImport("__Internal")]
    private static extern void CadenceDisconnect();
    //定义函数 销毁OC对象
    [DllImport("__Internal")]
    private static extern void CadenceDestory();

    void Start(){}

    void Update(){}

    void OnGUI() {
        if (GUI.Button(new Rect(150, 200, 300, 150), "点击初始化")) {
            CadenceInitWith("YourLanYaObject"); //传入挂载的游戏物体名字
        }

        if (GUI.Button(new Rect(150, 400, 300, 150), "点击开始连接蓝牙")) {
            //#if UNITY_IPHONE || UNITY_IOS
            //连接蓝牙设备,这里为了方便,直接连接指定的蓝牙设备UUID.
            CadenceConnectWith("0C95B9DA-5033-C3D8-FE99-B176D93B70D7");
            //#else
            //#endif
        }

        if (GUI.Button(new Rect(150, 600, 300, 150), "点击断开蓝牙")) {
            CadenceDisconnect(); //断开连接
        }

        if (GUI.Button(new Rect(150, 800, 300, 150), "点击销毁物体")) {
            CadenceDestory(); //在物体销毁的时候 把OC对象也销毁
            GameObject.Destroy(this.gameObject, 0.0f);
        }
    }

    private void OnDestroy() {
        Debug.Log("C# 对象: " + this.gameObject + " 已经销毁");
    }
    //来自OC的函数
    public void CadenceDataCall(string data) {
        Debug.Log("C# 正在接受 踏频器蓝牙数据：" + data); //收到蓝牙设备发送过来的数据
    }
    //来自OC的函数
    public void CadenceDestoryCall(string obj){
        //OC对象销毁时发送过来的数据,实际这个函数不会调用,因为GameObject此时已经为空.
        Debug.Log("C# 对象: " + obj + " 已经销毁"); 
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
#import <FitBleKit/FitBleKit.h>
#import <UIKit/UIKit.h>

@interface iOSCadencer : NSObject <FBKApiBsaeDataSource, FBKApiCadenceDelegate>
///初始化对象名字
@property (nonatomic, strong) NSString *object;
///设备
@property (nonatomic, strong) FBKApiCadence *cadenceApi;
///设备id
@property (nonatomic, strong) NSString *uuid;
///允许日志 默认开启
@property (nonatomic) BOOL logEnable;
///出错状态信息
@property (nonatomic, strong) NSDictionary *dicerror;

@end

@implementation iOSCadencer

- (void)dealloc {
    //代码到这里,Unity里面传过来的 'GameObject' 对象已经销毁, self.object打印为空, 即便是给Unity发消息,它也是收不到的.
    //UnitySendMessage([self.object UTF8String], "CadenceDestoryCall", [@"对象销毁" UTF8String]);
    NSLog(@"♻️♻️♻️♻️ iOS实例对象:iOSCadencer已经销毁, Unity对象:%@", self.object);
}

- (instancetype)initWithObject:(NSString *)object {
    if (self = [super init]) {
        _logEnable = YES;
        self.object = object;
        self.cadenceApi = [[FBKApiCadence alloc] init];
        self.cadenceApi.delegate = self;
        self.cadenceApi.dataSource = self;
        self.cadenceApi.whellDiameter = 1.6;
    }
    return self;
}

- (void)setLogEnable:(BOOL)logEnable {
    _logEnable = logEnable;
    if (logEnable) {
        NSLog(@"🌤🌤🌤 日志开启");
    } else {
        NSLog(@"🌤🌤🌤 日志关闭");
    }
}

- (void)lll:(NSString *)lll {
    if (self.logEnable) {
        NSLog(@"🌤🌤🌤 %@",lll);
    }
}

- (NSDictionary *)dicerror {
    if (!_dicerror) {
        _dicerror = @{
            @(DeviceBleClosed):@"未开启蓝牙",
            @(DeviceBleIsOpen):@"蓝牙可用",
            @(DeviceBleSearching):@"搜索中...",
            @(DeviceBleConnecting):@"连接中...",
            @(DeviceBleConnected):@"已连接",
            @(DeviceBleSynchronization):@"同步中...",
            @(DeviceBleSyncOver):@"同步完成",
            @(DeviceBleSyncFailed):@"同步失败",
            @(DeviceBleDisconnecting):@"断开中...",
            @(DeviceBleDisconneced):@"已断开",
            @(DeviceBleReconnect):@"重连中...",
        };
    }
    return _dicerror;
}

// 蓝牙连接状态
- (void)bleConnectStatus:(DeviceBleStatus)status andDevice:(id)bleDevice {
    //FBKApiCadence *cadenceApi = (FBKApiCadence *)bleDevice;
    
    if (status == DeviceBleIsOpen) { //在手机蓝牙开启情况下,自动去连接踏频器设备
        [self lll:@"手机蓝牙已经开启"];
        if (self.uuid) {
            [self lll:@"重新连接对方蓝牙中..."];
            [self.cadenceApi startConnectBleApi:self.uuid andIdType:DeviceIdUUID];
        } else {
            [self lll:@"对方蓝牙设备UUID 为空, 请传入 UUID !"];
        }
    } else {
        NSString *s = [NSString stringWithFormat:@"蓝牙连接状态更新, 设备状态码: %d, %@", status, self.dicerror[@(status)]];
        [self lll:s];
    }
}

// 踏频数据
- (void)getCadence:(double)cadence andDevice:(id)bleDevice {
    
    //打印日志
    NSString *s = [NSString stringWithFormat:@"获取到踏频器数据 cadence (times/min) : %.2f ",cadence];
    [self lll:s];
    
    //发送数据
    NSString *data = [NSString stringWithFormat:@"%f",cadence];
    UnitySendMessage([self.object UTF8String], "CadenceDataCall", [data UTF8String]);
}

// 蓝牙连接错误信息
- (void)bleConnectError:(id)error andDevice:(id)bleDevice {
    NSString *e = [NSString stringWithFormat:@"蓝牙连接错误! \n原因:%@ \n设备%@", error, bleDevice];
    [self lll:e];
}

// 获取电量
- (void)devicePower:(NSString *)power andDevice:(id)bleDevice{}
// 获取固件版本号
- (void)deviceFirmware:(NSString *)version andDevice:(id)bleDevice{}
// 获取硬件版本号
- (void)deviceHardware:(NSString *)version andDevice:(id)bleDevice{}
// 获取软件版本号
- (void)deviceSoftware:(NSString *)version andDevice:(id)bleDevice{}
// 获取私有版本号
- (void)privateVersion:(NSDictionary *)versionMap andDevice:(id)bleDevice{}
// 获取私有MAC地址
- (void)privateMacAddress:(NSDictionary *)macMap andDevice:(id)bleDevice{}
// 速度距离数据
- (void)getSpeed:(double)speed withDistance:(double)distance andDevice:(id)bleDevice{}

@end

iOSCadencer *view = nil;

#ifdef __cplusplus
extern "C" {
#endif

///初始化
extern void CadenceInitWith(const char *objName) {
    NSString *s = [NSString stringWithUTF8String:objName];
    if (view == nil) {
        view = [[iOSCadencer alloc] initWithObject:s];
    }
}

///销毁
extern void CadenceDestory() {
    view.object = nil;
    view.cadenceApi = nil;
    view.uuid = nil;
    view = nil;
}

///开始连接踏频器
extern void CadenceConnectWith(const char *uuid) {
    NSString *s = [NSString stringWithUTF8String:uuid];
    [view lll:[NSString stringWithFormat:@"开始连接设备号: %@", s]];
    view.uuid = s;
    [view.cadenceApi startConnectBleApi:view.uuid andIdType:DeviceIdUUID];
}

///断开踏频器
extern void CadenceDisconnect() {
    [view.cadenceApi disconnectBleApi];
    [view lll:@"断开蓝牙连接"];
}

///是否打印日志
extern void CadenceLogEnable(bool open) {
    if (view == nil) {
        NSLog(@"先调用 CadenceInitWith 方法进行初始化!");
    } else {
        view.logEnable = open;
    }
}

#ifdef __cplusplus
}
#endif
```

## 结语

终究是有一天碰上了Unity。 这次iOS和Unity交互也花了点时间，网上的其他玩家写的文章猛一看让我有点摸不着头脑，还得是自己去试，最终发现，玩来玩去，就两个文件，一个脚本.cs 一个iOS的.mm。

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
