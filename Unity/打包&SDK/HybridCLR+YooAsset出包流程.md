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
private List<string> _listAOTMetaAssemblyFiles { get; } =  new() {
														"mscorlib.dll", 
													    "System.dll", 
													    "System.Core.dll", 
													    "ThirdParty.dll" };
    
private Dictionary<string, TextAsset> _dicAssetDatas = new Dictionary<string, TextAsset>();

private IEnumerator _LoadDlls()  
{  
    if (GameDefineConfig.Instance.PlayModeType != EPlayMode.EditorSimulateMode)  
    {       
        var dllPath = "Assets/Arts/Codes/{0}.bytes";  
        //判断是否下载成功  
        var assets = new List<string> { "HotfixsMain.dll", "GameCfg.dll" }
                                  .Concat(this._listAOTMetaAssemblyFiles);  
        foreach (var asset in assets)  
        {            
            var filePath = string.Format(dllPath, asset);  
            Log.Debug($"Load dll {filePath}");  
            var handle = ResourceMgr.Instance.LoadAssetAsync<TextAsset> (filePath, null);  
            yield return handle;  
            var assetObj = handle.AssetObject as TextAsset;  
            this._dicAssetDatas[asset] = assetObj;  
        }  
		// other game logic....
        Log.Debug("--------------- Hotfix Dll Load Success");  
    }
}
```
这里在当时实践时发现一些情况，配置程序集`GameCfg.dll`是被热更程序集`HotfixsMain.dll`，原以为是不需要手动加载的，实践发现，会报错
### 启动热更层
```CSharp
// 启动 热更 dll 接口  
private void _StartGame()  
{  
	// Editor下无需加载，直接查找获得HotUpdate程序集 
#if UNITY_EDITOR   
    this._pHotUpdateAss =  
        System.AppDomain.CurrentDomain
        .GetAssemblies().First(a => a.GetName().Name == "HotfixsMain");    
#else  
    _LoadMetadataForAOTAssemblies();  
	var cfg = Assembly.Load(_ReadBytesFromStreamingAssets("GameCfg.dll"));         this._pHotUpdateAss = Assembly.Load(
		                 _ReadBytesFromStreamingAssets("HotfixsMain.dll"));
#endif  
  
    Log.Debug("--------------- Enter Hotfix -------------------");  
    var type = this._pHotUpdateAss.GetType("HotfixEntrance");  
    type.GetMethod("StartGame")?.Invoke(null, null);  
}

/// <summary>  
/// 为aot assembly加载原始metadata， 这个代码放aot或者热更新都行。  
/// 一旦加载后，如果AOT泛型函数对应native实现不存在，则自动替换为解释模式执行  
/// </summary>  
private void _LoadMetadataForAOTAssemblies()  
{  
    // 注意，补充元数据是给AOT dll补充元数据，而不是给热更新dll补充元数据。  
    // 热更新dll不缺元数据，不需要补充，如果调用LoadMetadataForAOTAssembly会返回错误  
    HomologousImageMode mode = HomologousImageMode.SuperSet;  
    foreach (var aotDllName in _listAOTMetaAssemblyFiles)  
    {        
	    byte[] dllBytes = _ReadBytesFromStreamingAssets(aotDllName);  
        // 加载assembly对应的dll，会自动为它hook。一旦aot泛型函数的native函数不存在，用解释器版本代码  
		LoadImageErrorCode err = 
					RuntimeApi.LoadMetadataForAOTAssembly(dllBytes, mode);  
        Debug.Log($"LoadMetadataForAOTAssembly:{aotDllName}. mode:{mode} ret:{err}");  
    }}  
  
private byte[] _ReadBytesFromStreamingAssets(string dllName)  
{  
    if (this._dicAssetDatas.TryGetValue(dllName, out var asset))  
    {        
	    return asset.bytes;  
    }  
    return Array.Empty<byte>();  
}
```

# 打包流程
整合HybridCLR和YooAsset提供的工具面板的功能，参考

```cardlink
url: https://blog.csdn.net/capricorn1245/article/details/139990520
title: "Unity热更新方案HybridCLR+YooAsset，从零开始，保姆级教程，纯c#开发热更_unity yooasset-CSDN博客"
description: "文章浏览阅读9.5k次，点赞61次，收藏125次。Unity热更，HybirdCLR热更，YooAsset热更，保姆级教程，从零开始_unity yooasset"
host: blog.csdn.net
```


```cardlink
url: https://github.com/JoinEnjoyJoyYangLingYun/HybridCLR_YooAsset_UniTask
title: "GitHub - JoinEnjoyJoyYangLingYun/HybridCLR_YooAsset_UniTask: 整合HybridCLR+YooAsset+UniTask工程"
description: "整合HybridCLR+YooAsset+UniTask工程. Contribute to JoinEnjoyJoyYangLingYun/HybridCLR_YooAsset_UniTask development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/a3934a09c3cc83c527bbea5cdad457f0ee15b686e15afe9b086a3b7127d461d4/JoinEnjoyJoyYangLingYun/HybridCLR_YooAsset_UniTask
```
参考了YooAsset打Bundle的代码，设计了一个简陋的管线流程`Pipeline`，将打包的各个步骤，串联成一个管线流程。
## Jenkins打包参数传递
`BuildParameters`对象记录了所有Jenkins传递的打包参数，配合`BuildParamParseHelper`对参数进行解析和检查。`ParamFormatInfo`对象记录了参数解析的格式和方式
```CSharp
public delegate string ParseParamDelegate(string formatParam);

public class ParamFormatInfo  
{  
    public string ParamFormat;  
    public ParseParamDelegate ParseMethod;  
    public string FieldName;  
    public bool CanBeNull = false;  
}
```
所有的参数都放在了`BuildParamParseHelper.ListParams`列表中，方便新增构建参数
```CSharp
public static List<ParamFormatInfo> ListParams = new List<ParamFormatInfo>()  
{  
    new ParamFormatInfo()  
        { ParamFormat = "--BuildVersion", ParseMethod = ParseStringParam, FieldName = "AppVersion" },
    .... other element 
}
```
##  Jenkins调用构建脚本
Jenkins构建过程使用到的脚本都放在了BuildTools文件夹中
![[Pasted image 20241121155016.png|720]]
### JenkinsBuild.bat
该脚本的内容是写在Jenkins的Job中的代码
```Batch
@echo off
setlocal

REM 设置临时的参数文件路径，如果已存在，先删除
set FUNC_PARAM_FILE=%ProjectPath%\BuildTools\func_params.txt
if exist "%FUNC_PARAM_FILE%" (
    del "%FUNC_PARAM_FILE%"
)

REM 使用 PowerShell 将GameFunParams 参数内容写入文件
powershell -Command "Set-Content -Path '%FUNC_PARAM_FILE%' -Value ([System.Environment]::GetEnvironmentVariable('GameFunParams', 'Process')) -Encoding UTF8"  

REM 检查文件是否创建成功
echo Checking "%FUNC_PARAM_FILE%" exist...
if exist "%FUNC_PARAM_FILE%" (
    echo File "%FUNC_PARAM_FILE%" exist。
) else (
    echo Error: Can't create file "%FUNC_PARAM_FILE%"
    exit /b 1
)
@ ....处理其他需要写入到本地的参数

if "%ResServerDirName%" == "" set ResServerDirName=""
@ .....

set BuildScriptPath=%ProjectPath%\BuildTools\Build.bat
call %BuildScriptPath% ^
        %ProjectPath% ^
@ ....其他参数

if %errorlevel% neq 0 (
    echo Error: Jenkins run failed.
    exit /b 1
)

endlocal
```
Jenkins中有很多不同的参数类型，其中
- 多行参数类型，需要写入到本地文件中，才能被正确传递
- string类型参数，如果不填写任何内容，需要在bat中，赋值空字符串，否则该参数就是空，在向下传递时，会引起参数顺序的错乱。
### Build.bat
该脚本用于调用打包前处理和Untiy中的构建代码
```Batch
@echo off
setlocal enabledelayedexpansion

REM 初始化计数器
set "count=0"

REM 遍历所有参数并存储到 param 数组
for %%a in (%*) do (
    set /a count+=1
    set "param[!count!]=%%~a"
)

REM 将参数赋值给对应的变量
set "PROJECT_PATH=!param[1]!"
set "METHOD_NAME=!param[2]!"
set "REPOSITORY_PATH=!param[3]!"
@ ...接受其他参数

@ ...其他操作
 
REM 1、关闭Unity进程
echo Closing Unity process...
taskkill /F /IM Unity.exe

REM 2、清理工程
set "CLEAN_PROJ=%PROJECT_PATH%\BuildTools\CleanProject.bat"
call %CLEAN_PROJ% %PROJECT_PATH%

@ ...其他操作

REM 3、预处理
echo Preprocessing...
set "PREPROCESS_SCRIPT_PATH=%PROJECT_PATH%\BuildTools\BuildPreprocessing\BuildPreprocessing.exe"
"%PREPROCESS_SCRIPT_PATH%" ^
@ ....其他参数

REM 执行Unity的静态方法BuildTool.BuildPC，并传递参数，日志输出到标准输出
"%UNITY_EXE_PATH%" -projectPath "%PROJECT_PATH%" -batchmode -quit -executeMethod "%METHOD_NAME%" ^
    --RepositoryPath:"%REPOSITORY_PATH%" ^
    --BuildVersion:"%BUILD_VERSION%" ^
    @ ....其他参数

REM 读取%PROJECT_PATH%\BuildTools\ErrorLevel.txt"文件的内容到RESULT变量
set /p RESULT=<"%PROJECT_PATH%\BuildTools\ErrorLevel.txt"

REM 检查构建是否成功
if %RESULT% equ 0 (
    echo Unity build successfully.
    exit /b 0
) else (
    echo Unity build failed.
    exit /b 1
)

endlocal
```
- 使用遍历的方式接受外界的参数（参数比较多）
- 调用完成Unity的方法后，quit参数会自动结束Unity进程。即使`METHOD_NAME`是带有返回值的，返回值也会被quit过程吞掉，因此将执行过程的结果保存到`ErrorLevel.txt`中，这一步主要是为了能够在Jenkins中，直观的看到本次构建是否成功。
## Unity中的打包流程设计
按照需求，完整的打包流程包含：
- 版本号升级
- 写入`GameDefineConfig`参数
- 使用HybridCLR构建dll
- 使用YooAsset构建Bundle
- 构建EXE/APK/AAB等
- 同步资源到服务器
- 写入`GameUpdateConfig`更新信息，同时上传服务器
### GameDefineConfig参数
根据实际需求，Jenkins中的部分参数，是需要传递到Runtime中的，因此设计了`GameDefineConfig`对象用于记录这些数据到本地，另外其存储位置是`StreamingAssets`，也可以方便他人（运营）在发布流程前，按需修改内部的参数。`GameDefineConfig`对象目前是可读可写的，但是不会写入本地，因此上一次运行和本次运行期间，数据一致。
```CSharp
#region --------------------------------------------------更新相关  
/// <summary>  
/// YooAsset 资源加载模式  
/// </summary>  
public EPlayMode PlayModeType = EPlayMode.EditorSimulateMode;  
public EDefaultBuildPipeline BuildPipelineType = EDefaultBuildPipeline.BuiltinBuildPipeline;  
/// <summary>  
/// 资源版本号  
/// </summary>  
public int ResVersion = 0;  
/// <summary>  
/// Bundle资源服地址  
/// </summary>  
public string ResServerURL = "";  
/// <summary>  
/// 获取热更信息的地址  
/// </summary>  
public string UpdateVersionURL;  
  
#endregion --------------------------------------------------  
  
#region --------------------------------------------------全局定义  
public string AppVersion = "1.0.0";  
/// <summary>  
/// 设备操作系统  
/// </summary>  
public string DevicePlatform;  

// ----------------------- 其他参数
  
#endregion --------------------------------------------------  
  
#region --------------------------------------------------业务开关和业务定义  
/// <summary>  
/// 日志级别  
/// </summary>  
public string LOG_LEVEL = "Error";  
/// <summary>  
/// 显示GM功能  
/// </summary>  
public bool DISPLAY_GM = false; 

// ----------------------- 其他参数
#endregion --------------------------------------------------
```
### GameUpdateConfig参数
由于YooAsset只能更新到最新的版本，这是不符合运行需求的。并且还有一些其他需求，比如服务器列表也会有热更的需求，因此设计了`GameUpdateConfig`用于控制线上版本和服务器列表。
```CSharp
/// <summary>  
/// 发布版本  
/// </summary>  
public int PublishVersion;  
/// <summary>  
/// 审核版本  
/// </summary>  
public int ReviewVersion;  
/// <summary>  
/// Bundle资源地址  
/// </summary>  
public string ResServerURL;  
/// <summary>  
/// 提审包的Bundle资源地址  
/// </summary>  
public string ReviewResServerURL;

// ----------------------- 其他参数
```
### 打包脚本
典型的打包过程如下
```CSharp
public static void BuildWholeApk()  
{  
    if (!BuildHelper.CheckBuildTarget(BuildTarget.Android))  
    {        
	    _WriteExecuteResult(1);  
        return;  
    }  
    var buildParams = BuildTool._ParseArguments();  
    if (buildParams == null)  
    {        
	    _WriteExecuteResult(1);  
        return;  
    }  
    
    var pipeline = new Pipeline();  
    pipeline.Name = "Build Whole Android";  
    pipeline.Build(new UpdateLocalVersionTask(buildParams.AppVersion, buildParams.Channel, true));  
    pipeline.Build(  
        new SetupGameDefineCfgTask(BuildDefine.YOOASSET_PLAYMODE, buildParams));  
    pipeline.Build(new SetupBuildSettingsTask(buildParams));  
    pipeline.Build(new GenerateAOTDLLTask(BuildDefine.DLLGroupName));  
    pipeline.Build(new GenerateHotUpdateDLLTask(BuildDefine.DLLGroupName));  
    pipeline.Build(new BuildBundleTask(EBuildMode.ForceRebuild, null, EBuildinFileCopyOption.ClearAndCopyAll));  
    pipeline.Build(new UnityBuildTask(buildParams.DevMode));  
    pipeline.Build(new AndroidBuildTask(buildParams));  
    pipeline.Build(new SyncAPKTask(buildParams.RepositoryPath, buildParams.Channel));  
    pipeline.Build(new CompareBundleTask(buildParams.UploadToOSS));  
    pipeline.Build(new SyncBundleTask(buildParams));  
    pipeline.Build(new WriteVersionTask());  
    pipeline.Build(new SetupUpdateVersionTask(buildParams));  
  
    bool hasError = false;  
    try  
    {  
        pipeline.Execute();  
    }    
    catch (Exception e)  
    {        
	    UnityEngine.Debug.LogError($"[PIPELINE] Run pipeline {pipeline.Name} error, {e.ToString()}!");  
        hasError = true;  
    }  
    
    if (buildParams.UploadToOSS)  
    {        
	    var result = pipeline.ReadBlackboard("UPLOAD_BUNDLE_RESULT") as string;  
        if (result == "false")  
        {            
	        hasError = true;  
        }    
    }  
    _WriteExecuteResult(hasError ? 1 : 0);  
}
```
#### YooAsset构建AssetBundle
##### 构建整包
某些情况下，我们需要构建整包，即将构建的AssetBundle放到Unity中，让后打一个Apk。实验发现，2.1.x版本的YooAsset没有该功能，即使bundle打到包里面去，运行时还是会从服务器下载所有的bundle文件。2.2.x版本才有，其新增了一个`BuildinCatalog`文件，记录了所有在包里的bundle文件信息。
##### 极细粒度构建
目前来说，YooAsset构建Asset，Bundle的粒度取决于Collector的划分，比如一般情况下，UI界面会划分到一个Group里面去，如果我此时想对某个UI进行打bundle是做不到的，因此对这块做了修补。思路是在增量构建完成后，筛选出，需要的资源，重新构建一份新的Manifest文件，只包含需要更新的资源信息。
`Report`文件包含了本次构建的详细信息：
![[Pasted image 20241121170935.png|420]]
![[Pasted image 20241121171019.png|400]]
![[Pasted image 20241121171039.png|410]]
通过分析发现，`BundleInfos`中，是每个bundle的详细信息，包括bundle名称`BundleName`，bundle的依赖bundle名列表`DependBundles`，bundle包含的资源列表`AllBuiltinAssets`。
在指定了本次打bundle的资源后，通过遍历比对`BundleInfos`中的每个元素，只要该bundle的`AllBuiltinAssets`包含我们需要的资源，那么该bundle就需要保留。另外，依赖该bundle的bundle也需要被找出来。
最后，将变动的bundle的信息，写入到上一版本的manifest中去
```CSharp
/// <summary>  
/// 将当前生成的NewManifest文件和上一次的OldManifest合并生成新的Manifest，覆盖当前的  
/// </summary>  
public static void GenerateManifestFile(string outputDir, string oldVersion, string version)  
{  
    // 读取上一版本的Manifest文件，本次版本的manifest文件，本次版本的report文件  
  
    // 通过report，找到包含buildAsset的bundle  
    var resultBundleNameSet = new HashSet<string>();  
    foreach (var reportBundleInfo 
		     in from reportBundleInfo in newBuildReport.BundleInfos  
             from buildAsset in buildAssetList  
             where reportBundleInfo.AllBuiltinAssets.Contains(buildAsset)  
             select reportBundleInfo)  
    {        
	    resultBundleNameSet.Add(reportBundleInfo.BundleName);  
    }  
    
    var depBundleSet = new HashSet<string>();  
    foreach (var bundeInfo 
		    in from bundleName in resultBundleNameSet 
		    from bundeInfo in newBuildReport.BundleInfos 
		    where bundeInfo.DependBundles.Contains(bundleName) 
		    select bundeInfo)  
    {        
	    depBundleSet.Add(bundeInfo.BundleName);  
    }  
    foreach (var depBundleName in depBundleSet)  
    {        
	    resultBundleNameSet.Add(depBundleName);  
    }    
    foreach (var bundleName in resultBundleNameSet)  
    {        
	    var newBundle = newManifest.BundleList.
					    FirstOrDefault(b => b.BundleName == bundleName);  
        var oldBundle = oldManifest.BundleList.
				        FirstOrDefault(b => b.BundleName == bundleName);  
        if (oldBundle == null || string.IsNullOrEmpty(oldBundle.BundleName)) // 新的bundle  
        {  
            throw new Exception("[BUILD] Separate bundle of newly added resources is not supported!");  
        }else if (oldBundle == newBundle)  
        {            
	        continue;  
        }  
        else  
        {  
            oldBundle.UnityCRC = newBundle.UnityCRC;  
            oldBundle.FileHash = newBundle.FileHash;  
            oldBundle.FileCRC = newBundle.FileCRC;  
            oldBundle.FileSize = newBundle.FileSize;  
        }    
    }  
    
    ManifestTools.SerializeToJson(newManifestPath, oldManifest);  
    var bytesFilePath = newManifestPath.Replace(".json", ".bytes");  
    ManifestTools.SerializeToBinary(bytesFilePath, oldManifest);  
    var bytesFileHashStr = HashUtility.FileMD5(bytesFilePath);  
    File.WriteAllText(newManifestPath.Replace(".json", ".hash"), bytesFileHashStr);  
}
```
#### Android工程构建Apk或AAB
使用`gradlew.bat`构建Apk和AAB。Unity导出的安卓工程是没有该脚本的，可以通过安装[GradleWrapperGenerator]([gilzoide/unity-gradle-wrapper: Automatically generate Gradle Wrapper (gradlew) when exporting Android projects in Unity](https://github.com/gilzoide/unity-gradle-wrapper))插件，使得导出android工程后，自动生成gradlew。
通过`gradlew.bat assembleDebug`m

