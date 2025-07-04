---
tags:
  - SeaWar/UI适配/UGUI适配
  - mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/UI适配
dateStart: 2025-07-14
dateFinish: 2025-07-19
finished: false
displayIcon: pixel-banner-images/项目任务.png
---
# CanvasScaler组件
## 三种UI缩放模式

### Constant Pixel Size
![[（图解1）Constant Pixel Size缩放模式.png|590]]
不根据屏幕分辨率调整 Canvas 的缩放，以 UI 元素的 像素值 × Scale Factor 对应真实屏幕的像素点进行渲染。当 Scale Factor 为 1 时，屏幕上显示为 UI 元素的给定像素大小。

**_Scale Factor_** 画布的缩放比例。默认况下为 1，表示正常大小。

_**Reference Pixels Per Unit**_ 每个 UI 单位代表的像素量。 官方的解释是”如果  sprite（精灵，下同） 具有 **Pixels Per Unit** 设置，则 sprite 中的一个像素将覆盖 UI 中的一个单位”，个人理解这个值是用来覆盖 sprite 导入设置中的 **Pixels Per Unit** 值，即决定每个 UI 单位应包含多少像素。
### Scale With Screen Size
![[（图解2）Scale With Screen Size模式.png|580]]
**Scale With Screen Size** 表示根据真实屏幕的宽高来缩放 Canvas。**Reference Resolution** 是游戏的设计分辨率。**Screen Match Mode** 有三种模式
1. **Match Width or Height** 根据真实屏幕的宽高比按指定的 **Match** 值来缩放 Canvas。  **Match**决定 Canvas 按宽高缩放的[权重值，当 **Match = 0** 时，按宽度进行 Canvas 等比缩放；当 **Match = 1** 时，按高度度进行 Canvas 等比缩放。一般情况下这个值非 0 即 1，不用纠结中间值
2. **Expand** 在屏幕大小上**内接**画布。以 Canvas 小于 屏幕 为例，放大画布直至宽或高有一边与屏幕重合停止。此模式下为 **Canvas 全部显示在屏幕中** 的前提下 Canvas 的最大缩放值
3. **Shrink** 在屏幕大小上 **外切** 画布。以 Canvas 小于 屏幕 为例，放大画布直至宽或高最后一边与屏幕重合停止。此模式下为 **Canvas 被裁切，不能完全显示在屏幕中**


```cardlink
url: https://blog.csdn.net/NRatel/article/details/146253789
title: "Unity屏幕适配——立项时设置_unity 竖屏-CSDN博客"
description: "文章浏览阅读1.4k次，点赞26次，收藏7次。其中：1334 是设计高2 是Camera（相机）的Size属性用于定义相机视图的垂直大小。这个值实际上是相机视图的一半高度。100 UI坐标系相对世界坐标系的缩放倍数。_unity 竖屏"
host: blog.csdn.net
```
[Fetching Data#6002](https://zhuanlan.zhihu.com/p/463633574)

```cardlink
url: https://developer.unity.cn/ask/question/66deda61edbc2a001db5be1d
title: "关于Unity屏幕适配的问题 - 技术问答 - Unity官方开发者社区"
description: "哪位大神知道Unity哪个版本对Screen.safeArea接口的支持比较齐全,目前用的是2020的版本，或者是不是有其他更好的方案解决水滴屏、挖孔屏、灵动岛？ - UnityAsk是中国Unity官方推出的Unity中文答疑论坛"
host: developer.unity.cn
favicon: https://developer-prd.cdn.unity.cn/images/favicons/favicon_cn.ico?v=3
image: https://developer-prd.cdn.unity.cn/images/logo-new.png
```

```cardlink
url: https://blog.csdn.net/weixin_43352477/article/details/102219439
title: "Unity 屏幕自适应的三种方法（UI控件/Canvas/摄像机视口）总结_unity 自适应-CSDN博客"
description: "文章浏览阅读1.4w次，点赞3次，收藏18次。经常会用到Unity 自适应的问题，今天来总结以下三点。1.UI控件自适应UI控件（Button,Image等）的自适应是用的最多的，通常通过锚点的设定，来完成UI控件的适应。根据UI控件需要锁定的不同位置，设置锚点的位置。2.Canvas自适应不同的设备，分辨率不同，这时候Canvas需要根据不同的分辨率缩放，需要设置Canvas组件上的Canvas Scale脚本 的UI Scale..._unity 自适应"
host: blog.csdn.net
```

```cardlink
url: https://cloud.tencent.com/developer/article/1637553
title: "Unity3D-关于项目的屏幕适配(看我就够了)-腾讯云开发者社区-腾讯云"
description: "屏幕适配是为了让我们的项目能够跑在各种电子设备上(手机,平板,电脑) 那么了解是适配之前首先要了解两个知识点:"
host: cloud.tencent.com
image: https://cloudcache.tencentcs.com/open_proj/proj_qcloud_v2/gateway/shareicons/cloud.png
```

```cardlink
url: https://www.jianshu.com/p/a4b8e4c5d9b0
title: "Android 目前最稳定和高效的UI适配方案"
description: "Android系统发布十多年以来，关于Android的UI的适配一直是开发环节中最重要的问题，但是我看到还是有很多小伙伴对Android适配方案不了解。刚好，近期准备对糗事百..."
host: www.jianshu.com
image: http://upload-images.jianshu.io/upload_images/689802-aaa7ddb776fccb68
```

```cardlink
url: https://blog.csdn.net/oWanMeiShiKong/article/details/146315511
title: "Unity3D手游多分辨率适配深度解决方案_unity 多分辨率适配-CSDN博客"
description: "文章浏览阅读1.9k次，点赞48次，收藏24次。本方案已在多个千万级DAU项目中验证，可有效覆盖市面上95%以上的移动设备。建议开发团队建立专门的适配测试小组，在项目初期即引入适配框架，通过持续迭代优化达到最佳显示效果。当前移动端设备分辨率呈现多元化发展趋势，主流设备分辨率跨度从720P到4K级别，屏幕宽高比包含16:9、18:9、19.5:9、21:9等多种形态。_unity 多分辨率适配"
host: blog.csdn.net
```
[Fetching Data#k3a1](https://zhuanlan.zhihu.com/p/658463332)

```cardlink
url: https://developer.aliyun.com/article/1566257
title: "【技术深度解析】多平台适配下的UI适配难题：U3D游戏UI错乱的终极解决方案-阿里云开发者社区"
description: "【7月更文第12天】随着移动设备市场的多元化，Unity游戏开发者面临的一大挑战是如何在不同分辨率和屏幕尺寸的设备上保持UI的一致性和美观性。游戏在高分辨率平板与低分辨率手机上呈现出的UI布局混乱、按钮错位等问题，严重影响玩家体验。本文旨在探讨Unity UI（UGUI）在多平台适配中的最佳实践，通过优化Canvas Scaler设置、灵活运用RectTransform和Anchor Points，以及高效利用设计工具，确保UI的完美适配。"
host: developer.aliyun.com
image: https://img.alicdn.com/tfs/TB1LCE1aQ5E3KVjSZFCXXbuzXXa-200-200.png
```

```cardlink
url: https://blog.csdn.net/shaobing32/article/details/136344776
title: "Unity UI适配规则和对热门游戏适配策略的拆解-CSDN博客"
description: "文章浏览阅读3.5k次，点赞24次，收藏36次。本文分析了RoyalMatch和MonopolyGO两款热门游戏的UI适配方法，介绍了设计分辨率、参考分辨率和两种适配模式，并详细展示了他们在不同设备上的具体应用，为开发者提供学习和参考案例。"
host: blog.csdn.net
```
[Fetching Data#tpb5](https://zhuanlan.zhihu.com/p/350034863)

```cardlink
url: https://www.arkaistudio.com/blog/2016/03/28/unity-ugui-%E5%8E%9F%E7%90%86%E7%AF%87%E4%BA%8C%EF%BC%9Acanvas-scaler-%E7%B8%AE%E6%94%BE%E6%A0%B8%E5%BF%83/
title: "Unity UGUI 原理篇(二)：Canvas Scaler 縮放核心"
description: "目標 了解各種不同 UI Scale Mode Pixels Per Unit 每單位像素 Canvas Sc..."
host: www.arkaistudio.com
favicon: https://www.arkaistudio.com/blog/wp-content/uploads/2021/06/cropped-LOGO_ARKAI_512-32x32.png
image: https://www.arkaistudio.com/blog/wp-content/uploads/2016/03/special-1.png
```
