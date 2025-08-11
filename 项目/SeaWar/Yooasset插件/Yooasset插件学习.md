---
tags: SeaWar/Yooasset插件/Yooasset插件学习 mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/Yooasset插件
dateStart: 2025-08-11
dateFinish: 2025-08-11
finished: false
displayIcon: pixel-banner-images/项目任务.png

---
# 资源收集策略
以下打包，以`ScriptableBuildPipeline`管线为例。
```cardlink
url: https://blog.csdn.net/m0_57771536/article/details/148870712
title: "Unity Scriptable Build Pipeline (SBP) 详解_unity sbp-CSDN博客"
description: "文章浏览阅读851次，点赞24次，收藏12次。Unity 的可编程构建管线（Scriptable Build Pipeline, SBP）标志着引擎构建架构的一次关键转变，它从不透明的 C++ 实现转向了灵活、可扩展的 C# 框架。SBP 旨在满足现代游戏开发日益增长的需求，通过改进增量处理和高效缓存机制显著提升了构建性能。它赋予开发者对内容构建过程前所未有的控制力，从而能够针对特定项目需求进行深度定制。尽管 SBP 是 Unity 推荐的 Addressables 系统的重要基础层，但理解其核心组件、构建流程和高级功能对于优化大型项目、简化 CI/C_unity sbp"
host: blog.csdn.net
```
## 打包参数`ScriptableBuildParameters`
`ScriptableBuildParameters`重点关注的参数是压缩选项`CompressOption`，主要是`LZMA`和`LZ4`两个压缩选项的区别
### **LZMA和LZ4**
Unity官方对于[AssetBundle 压缩格式](https://docs.unity3d.com/Manual/assetbundles-compression-format.html)的解释如下：
**相关参考如下：**
[7zip - Why doesnt Android compress its APK's with LZ4 / LZMA? - Stack Overflow](https://stackoverflow.com/questions/46357763/why-doesnt-android-compress-its-apks-with-lz4-lzma)
[Unity中ab包压缩方案 LZMA 和LZ4_lzma lz4-CSDN博客](https://blog.csdn.net/qq_38721111/article/details/129184791)
[关于LZMA和LZ4压缩的疑惑解析 - UWA问答 | 博客 | 游戏及VR应用性能优化记录分享 | 侑虎科技](https://blog.uwa4d.com/archives/TechSharing_112.html)
[Unity加载优化-将基于LZMA的ab压缩方案修改为LZ4压缩的过程_unitylz4压缩算法加载的接口-CSDN博客](https://blog.csdn.net/weixin_36719607/article/details/121257948)
[LZMAおよびLZ4圧縮に関する疑問の分析 #Unity - Qiita](https://qiita.com/UWATechnology/items/7039e4623998d2dc4fa3)
[Addressables：Asset Bundle Compression该如何选择？ - 知乎](https://zhuanlan.zhihu.com/p/673316663)
[Unity Addressables: Compression Benchmark | TheGamedev.Guru](https://thegamedev.guru/unity-addressables/compression-benchmark/)
## 资源收集
通过`AssetBundleCollectorSetting.BeginCollect`可以根据收集规则，获取所有需要构建AssetBundle的资源。具体步骤如下：遍历每个分组，遍历每个分组中的每个收集项，获取收集项中的资源。
所有收集到的，需要被打成AssetBundle的资源，都被封装成了`CollectAssetInfo`对象
```CSharp
public class CollectAssetInfo  
{  
    /// <summary>  
    /// 资源包名称  
    /// </summary>  
    public string BundleName { private set; get; }  
  
    /// <summary>  
    /// 可寻址地址  
    /// </summary>  
    public string Address { private set; get; }  
  
    /// <summary>  
    /// 资源信息  
    /// </summary>  
    public AssetInfo AssetInfo { private set; get; }  
  
    /// <summary>  
    /// 资源分类标签  
    /// </summary>  
    public List<string> AssetTags { private set; get; }  
  
    /// <summary>  
    /// 依赖的资源列表  
    /// </summary>  
    public List<AssetInfo> DependAssets = new List<AssetInfo>();  
}
```
接下来，根据这份收集列表，需要做如下几个事情：
1. 剔除未被引用的依赖资源
2. 区分主动收集和被动收集
3. 找到依赖资源

