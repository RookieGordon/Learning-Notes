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
![[（图解1）Yooasset中配置的收集组，收集项.png|490]]
收集项中的每一个资源，都会被封装成了`CollectAssetInfo`对象
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
这里重点关注`BundleName`和`DependAssets`这两个字段。
### 主资源Bundle名的构成
在具体操作每个收集项部分，会使用`AssetBundleCollector.CreateCollectAssetInfo`方法将找到的资源封装成`CollectAssetInfo`对象。我们重点关注一下该函数中，如何获取Bundle名和依赖资源列表。
```Csharp
private string GetBundleName(CollectCommand command, AssetBundleCollectorGroup group, AssetInfo assetInfo)  
{  
    if (command.AutoCollectShaders)  
    {        
        if (assetInfo.IsShaderAsset())  
        {            
            // 获取着色器打包规则结果  
            PackRuleResult shaderPackRuleResult = DefaultPackRule.CreateShadersPackRuleResult();  
            return shaderPackRuleResult.GetBundleName(command.PackageName, 
                                                    command.UniqueBundleName);  
        }    
    }  
    // 获取其它资源打包规则结果  
    IPackRule packRuleInstance = AssetBundleCollectorSettingData.GetPackRuleInstance(PackRuleName);  
    PackRuleResult defaultPackRuleResult = packRuleInstance.GetPackRuleResult(
        new PackRuleData(assetInfo.AssetPath, 
                        CollectPath, 
                        group.GroupName, 
                        UserData));  
    return defaultPackRuleResult.GetBundleName(command.PackageName, command.UniqueBundleName);  
}
```
在`AssetBundleCollector.GetBundleName`方法中，可以看到Shader资源的Bundle名是单独处理的。具体名字的组装是在`PackRuleResult.GetBundleName`方法中实现的：
```CSharp
public string GetBundleName(string packageName, bool uniqueBundleName)  
{  
    string fullName;  
    string bundleName = EditorTools.GetRegularPath(_bundleName)
                                    .Replace('/', '_')
                                    .Replace('.', '_')
                                    .Replace(" ", "_")
                                    .ToLower();  
    if (uniqueBundleName)  
        fullName = $"{packageName}_{bundleName}.{_bundleExtension}";  
    else  
        fullName = $"{bundleName}.{_bundleExtension}";  
    return fullName.ToLower();  
}
```
所以，shader的bundle名是：`firstpkg_unityshaders.bundle`。其他主资源的bundle名是：`资源所在文件夹路径.bundle`，因此同一个文件夹下的所有资源，会打成一个bundle。
### 依赖资源的收集
在打包选项中，我们开启了使用数据库，因此依赖资源的收集是通过`AssetDependencyDatabase`数据库实现的，关键代码如下：
```CSharp
private DependencyInfo CreateDependencyInfo(string assetPath)
{
    var dependAssetPaths = AssetDatabase.GetDependencies(assetPath, false);
    var dependGUIDs = new List<string>();
    foreach (var dependAssetPath in dependAssetPaths)
    {
        string guid = AssetDatabase.AssetPathToGUID(dependAssetPath);
        if (string.IsNullOrEmpty(guid) == false)
        {
            dependGUIDs.Add(guid);
        }
    }
    var cacheInfo = new DependencyInfo();
    cacheInfo.DependGUIDs = dependGUIDs;
    return cacheInfo;
}
```
接下来，根据这份收集列表，需要做如下几个事情：
1. 剔除未被引用的依赖资源
2. 录入主动收集的资源
3. 录入依赖资源
4. 收集shader
5. 计算共享资源包名
#### **剔除没有引用的资源**
这个步骤，只有当有收集项被配置成[依赖资源](https://www.yooasset.com/docs/api/YooAsset.Editor/ECollectorType#dependassetcollector)才会生效。我们配置了一部分资源为依赖资源，那么这些资源必须被其他资源依赖，如果没有，就需要进行剔除
#### **录入主动收集的资源**
将所有收集资源整理完毕后（`CollectAssetInfo`列表），就需要构建Bundle之间的引用关系了，因此，将收集到的资源，重新封装成`BuildAssetInfo`对象：
```CSharp
public class BuildAssetInfo  
{  
    private readonly HashSet<string> _referenceBundleNames = new HashSet<string>();  

    /// <summary>  
    /// 资源包完整名称  
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
    /// 依赖的所有资源  
    /// 注意：包括零依赖资源和冗余资源（资源包名无效）  
    /// </summary>  
    public List<BuildAssetInfo> AllDependAssetInfos { private set; get; }
}
```
关键字段是`_referenceBundleNames`，这里并不是指该资源的依赖，而是`依赖该资源的Bundle的集合`。
#### **录入依赖资源**
遍历整个`CollectAssetInfo`列表，遍历每个收集资源的依赖列表，将依赖资源封装成`BuildAssetInfo`对象，并且将引用该依赖资源的资源的Bundle名，添加到`_referenceBundleNames`中。
#### **计算共享资源包名**
遍历打包资源列表（`BuildAssetInfo`列表），如果资源没有设置Bundle名（依赖资源），那么就对其设置Bundle名。**对于只被一个资源引用的依赖资源，如果关闭了[SingleReferencedPackAlone](https://www.yooasset.com/docs/api/YooAsset.Editor/BuildParameters#singlereferencedpackalone)选项，那边就会根据其所在目录，生成Bundle名。**
```CSharp
public string GetShareBundleName(string packageName, bool uniqueBundleName)  
{  
    string fullName;  
    string bundleName = EditorTools.GetRegularPath(_bundleName)
                                    .Replace('/', '_')
                                    .Replace('.', '_')
                                    .Replace(" ", "_")
                                    .ToLower();  
    if (uniqueBundleName)  
        fullName = $"{packageName}_share_{bundleName}.{_bundleExtension}";  
    else  
        fullName = $"share_{bundleName}.{_bundleExtension}";  
    return fullName.ToLower();  
}
```
所以，共享资源的Bundle名为：`firstpkg_share_资源所在文件夹路径.bundle`
# AssetBundle加载
Yooasset插件的runtime部分，集成了Editor模式加载，离线模式加载，远程模式更新，远程模式加载等功能，这里着重讲解一下离线模式加载（OfflinePlayMode）。
## Yooasset初始化
## Yooasset加载资源
![[（图解1）yooasset关键类图.png|570]]
![[（图解2）资源加载时序图.png|670]]
Yooasset采用Update轮询加上状态来驱动整个资源加载流程。
### 任务和任务驱动
`AsyncOperationBase`是所有异步任务基类，通过`Status`记录任务当前的状态，通过`StartOperation`、`UpdateOperation`、`AbortOperation`实现任务的启动，更新和中断。并且通过`Childs`和`InternalStart`、`InternalUpdate`、`InternalAbort`实现了任务的嵌套。
```CSharp
public abstract class AsyncOperationBase : IEnumerator, IComparable<AsyncOperationBase>
{
    /// <summary>
    /// 所有子任务
    /// </summary>
    internal readonly List<AsyncOperationBase> Childs = new List<AsyncOperationBase>(10);
    /// <summary>  
    /// 任务状态  
    /// </summary>  
    public EOperationStatus Status { get; protected set; } = EOperationStatus.None;

    internal abstract void InternalStart();  
    internal abstract void InternalUpdate();  
    internal virtual void InternalAbort();

    /// <summary>  
    /// 开始异步操作，开启所有子任务  
    /// </summary>  
    internal void StartOperation()  
    {  
        // do something...
    }  
    
    /// <summary>  
    /// 更新异步操作，更新所有子任务
    /// </summary>  
    internal void UpdateOperation()  
    {  
        // do something...
    }  
    
    /// <summary>  
    /// 终止异步任务，终止所有子任务
    /// </summary>  
    internal void AbortOperation()  
    {  
        // do something...
    }
}
```
`OperationSystem`用于驱动任务。
```CSharp
internal class OperationSystem
{
	private static readonly List<AsyncOperationBase> _operations 
                                                    = new List<AsyncOperationBase>(1000);  
    private static readonly List<AsyncOperationBase> _newList 
                                                    = new List<AsyncOperationBase>(1000);

    /// <summary>  
    /// 更新异步操作系统  
    /// </summary>  
    public static void Update()  
    {  
        // 移除已经完成的异步操作  
        // 注意：移除上一帧完成的异步操作，方便调试器接收到完整的信息！  
        for (int i = _operations.Count - 1; i >= 0; i--)  
        {        
            var operation = _operations[i];  
            if (operation.IsFinish)  
                _operations.RemoveAt(i);  
        }  
        // 添加新增的异步操作  
        if (_newList.Count > 0)  
        {        
            bool sorting = false;  
            foreach (var operation in _newList)  
            {            
                if (operation.Priority > 0)  
                {                
                    sorting = true;  
                    break;  
                }        
            }  
            _operations.AddRange(_newList);  
            _newList.Clear();  
    
            // 重新排序优先级  
            if (sorting)  
                _operations.Sort();  
        }  
        // 更新进行中的异步操作  
        for (int i = 0; i < _operations.Count; i++)  
        {        
            if (IsBusy)  
                break;  
    
            var operation = _operations[i];  
            if (operation.IsFinish)  
                continue;  
    
            operation.UpdateOperation();  
        }
    }
}
```
### 资源加载任务
