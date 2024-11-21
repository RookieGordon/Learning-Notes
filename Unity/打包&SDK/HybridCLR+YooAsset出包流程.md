---
tags:
  - Unity
  - HybridCLR
  - YooAsset
---
# 打包流程整合
通过HybridCLR构建热更工程的dll，将其作为一个原生资源，使用YooAsset连同其他资源一起构建AssetBundle。
## Runtime流程
运行时，先启动游戏入口，初始化YooAsset，通过YooAsset更新热更工程代码，启动热更工程，进入游戏业务逻辑。
### 初始化YooAsset
初始化流程可以参考官方射击游戏示例：
```cardlink
url: https://github.com/tuyoogame/YooAsset/blob/dev/Assets/YooAsset/Samples~/Space%20Shooter/GameScript/Runtime/PatchLogic/PatchOperation.cs
title: "YooAsset/Assets/YooAsset/Samples~/Space Shooter/GameScript/Runtime/PatchLogic/PatchOperation.cs at dev · tuyoogame/YooAsset"
description: "unity3d resources management  system. Contribute to tuyoogame/YooAsset development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/790768f9aa21f98c5db27121a0a0c08ac4c68f2de8d866baad17fb4a9a836127/tuyoogame/YooAsset
```
参考这份流程，设计了`PatchManager`类，其流程（代码。。）基本和官方一致：
```CSharp
private void _InitStateMachine()  
{  
    this._patchStateMachine = new SimpleStateMachine(this);  
    this._patchStateMachine.AddNode<UpdateVersionTask>();  
    this._patchStateMachine.AddNode<InitializePackageTask>();  
    this._patchStateMachine.AddNode<UpdatePackageVersionTask>();  
    this._patchStateMachine.AddNode<UpdatePackageManifestTask>();  
    this._patchStateMachine.AddNode<CreatePackageDownloaderTask>();  
    this._patchStateMachine.AddNode<DownloadPackageFilesTask>();  
    this._patchStateMachine.AddNode<DownloadPackageOverTask>();  
    this._patchStateMachine.AddNode<ClearPackageCacheTask>();  
    this._patchStateMachine.AddNode<UpdaterDoneTask>();  
}
```
其中的`UpdateVersionTask`任务用于获取资源服的更新文件，通过更新文件，获取更新版本。原生的YooAsset总是默认更新到最新的版本。该任务对象，下面会有讲解。
### 下载热更代码
YooAsset启动后，就可以使用其进行资源的加载（下载）
```CSharp
//补充元数据dll的列表  
//通过RuntimeApi.LoadMetadataForAOTAssembly()函数来补充AOT泛型的原始元数据  
private List<string> _listAOTMetaAssemblyFiles { get; } =  
    new() { "mscorlib.dll", "System.dll", "System.Core.dll", "ThirdParty.dll" };
    
private Dictionary<string, TextAsset> _dicAssetDatas = new Dictionary<string, TextAsset>();

private IEnumerator _LoadDlls()  
{  
    if (GameDefineConfig.Instance.PlayModeType != EPlayMode.EditorSimulateMode)  
    {        var dllPath = "Assets/Arts/Codes/{0}.bytes";  
        //判断是否下载成功  
        var assets = new List<string> { "HotfixsMain.dll", "GameCfg.dll" }.Concat(this._listAOTMetaAssemblyFiles);  
        foreach (var asset in assets)  
        {            var filePath = string.Format(dllPath, asset);  
            Log.Debug($"Load dll {filePath}");  
            var handle = ResourceMgr.Instance.LoadAssetAsync<TextAsset>(filePath, null);  
            yield return handle;  
            var assetObj = handle.AssetObject as TextAsset;  
            this._dicAssetDatas[asset] = assetObj;  
        }  
		// other game logic....
        Log.Debug("--------------- Hotfix Dll Load Success -------------------");  
    }}
```
这里在当时实践时发现一些情况，配置程序集`GameCfg.dll`是被热更程序集`HotfixsMain.dll`，原以为是不需要shoudo