---
tags:
  - SeaWar/打包步骤调整/资源自动导入YooassetCollector
  - mytodo
  - Unity/资源后处理
  - Unity/编辑器/资源变更回调
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/资源加载与热更
dateStart: 2025-04-08
dateFinish: 2025-04-10
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
# 资源后处理框架
需要实现一套资源导入后的后处理框架，在资源被创建，被删除，被移动后，执行某些操作。那么资源自动收集到YooAsset就可以通过该框架进行实现
## 需求
1. 在Unity的资源发生变更的时（被创建，被删除，被移动，被修改），执行特定的处理逻辑；
2. 不能出现递归处理的情况，例如：资源A在被后处理后，会再次触发`被修改`回调，此时就不应该继续处理，否则就会死循环；
## 实现
通过Unity提供的[Unity - Scripting API: AssetPostprocessor.OnPostprocessAllAssets](file:///C:/Program%20Files/Unity/2021.3.32f1/Editor/Data/Documentation/en/ScriptReference/AssetPostprocessor.OnPostprocessAllAssets.html)，可以很方便的获取本次导入，删除，移动的资源列表，可以在该API的基础上实现资源后处理的功能。
```CSharp
public abstract class AAssetPostProcessor  
{  
    public virtual bool OnCreateProcess(string assetPath)  {...}
    
    public virtual bool OnModifyProcess(string assetPath)  {...}
    
    public virtual bool OnWillDeletedProcess(string assetPath)  {...}
    
    public virtual bool OnDeletedProcess(string assetPath)  {...}  
    
    public virtual bool OnMoveProcess(string newPath, string oldPath)  {...}  
}
```
`AAssetPostProcessor`抽象类，包含了所有的类型的处理方法，子类只需要继承该类，就可以选择某些方法重写，进而实现后处理的逻辑。
接下来就是实现一个后处理的管理类，所有的后处理对象都需要被注册进去，然后该类会监听`OnPostprocessAllAsset`方法，派发处理事件
```CSharp
public class AssetProcessManager : AssetPostprocessor  
{  
    private static HashSet<string> _objSet = new HashSet<string>();  
  
    private static List<AAssetPostProcessor> _processHandlers = new List<AAssetPostProcessor>();  
  
    private static Dictionary<string, string> _processedObjDic = new Dictionary<string, string>();  
  
    public static void Register(AAssetPostProcessor processHandler)  
    {        
        _processHandlers.Add(processHandler);  
    }  

    private static void OnPostprocessAllAssets(string[] importedAssets, 
                                                string[] deletedAssets, 
                                                string[] movedAssets,  
                                                string[] movedFromAssetPaths, 
                                                bool didDomainReload)  
    {        
        var passAll = true;  
        foreach (var assetPath in importedAssets)  
        {            
            if (_objSet.Add(assetPath))  
            {                
                passAll = passAll && _CreateOrModifyProcess(EAssetProcessType.Add, assetPath);  
            }            
            else  
            {  
                passAll = passAll && _CreateOrModifyProcess(EAssetProcessType.Modify, assetPath);  
            }        
        }  
        foreach (var assetPath in deletedAssets)  
        {           
             _UpdateCache(assetPath);  
            passAll = passAll && _DeleteOrMoveProcess(EAssetProcessType.Deleted, assetPath);  
        }  
        for (int i = 0; i < movedAssets.Length; i++)  
        {            
            var oldPath = movedFromAssetPaths[i];  
            var newPath = movedAssets[i];  
            _UpdateCache(oldPath, newPath);  
            passAll = passAll && _DeleteOrMoveProcess(EAssetProcessType.Move, newPath, oldPath);  
        }  
        AssetDatabase.Refresh();  
  
        if (!passAll)  
        {            
            EditorUtility.DisplayDialog("Post Process Error", 
                                        "Some post process failed, please check the console.",  
                                        "OK");  
        }    
    }  

    private static bool _DeleteOrMoveProcess(EAssetProcessType processType, 
                                            string assetPath, 
                                            string oldPath = "")  
    {        
        return _OnProcess(processType, assetPath, oldPath);  
    }  
    private static bool _CreateOrModifyProcess(EAssetProcessType processType, string assetPath)  
    {        
        if (processType == EAssetProcessType.Modify)  
        {            
            var newMd5 = AssetUtil.GetAssetSignature(assetPath);  
            if (_processedObjDic.TryGetValue(assetPath, out var oldMd5) && oldMd5 == newMd5)
            {  
                return true;  
            }        
        }  
        var passAll = _OnProcess(processType, assetPath);  
        AssetDatabase.ImportAsset(assetPath);  
        _processedObjDic[assetPath] = AssetUtil.GetAssetSignature(assetPath);  
        return passAll;  
    }  

    private static bool _OnProcess(EAssetProcessType processType, 
                                    string assetPath, 
                                    string oldPath = "")  
    {        
        var passAll = true;  
        foreach (var handler in _processHandlers)  
        {            
            var result = false;  
            try  
            {  
                switch (processType)  
                {                    
                    case EAssetProcessType.Add:  
                        result = handler.OnCreateProcess(assetPath);  
                        break;  
                    case EAssetProcessType.Modify:  
                        result = handler.OnModifyProcess(assetPath);  
                        break;  
                    case EAssetProcessType.WillDeleted:  
                        result = handler.OnWillDeletedProcess(assetPath);  
                        break;  
                    case EAssetProcessType.Deleted:  
                        result = handler.OnDeletedProcess(assetPath);  
                        break;  
                    case EAssetProcessType.Move:  
                        result = handler.OnMoveProcess(assetPath, oldPath);  
                        break;  
                }  
                if (!result)  
                {                    
                    Debug.LogError(  
                        $"{handler.GetType().Name} post process failed. processType: {processType}, assetPath: {assetPath}, oldPath: {oldPath}");  
                }            
            }            
            catch (System.Exception e)  
            {                
                Debug.LogError(  
                    $"{handler.GetType().Name} post process error. processType: {processType}, assetPath: {assetPath}, oldPath: {oldPath}, error: {e}");  
            }  
            passAll = passAll && result;        
        }  
        return passAll;  
    } 
     
    private static void _UpdateCache(string oldPath, string newPath = "")  
    {        
        _objSet.Remove(oldPath);  
        if (!string.IsNullOrEmpty(newPath))  
        {            
            _objSet.Add(newPath);  
            if (_processedObjDic.TryGetValue(oldPath, out var md5))  
            {                
                _processedObjDic[newPath] = md5;  
            }        
        }  
        _processedObjDic.Remove(oldPath);  
    }
}
```
添加，移动和删除部分都很容易。修改逻辑会相对复杂。修改部分，会容易造成死循环，因此需要通过某种方式标记资源是否已经经过后处理修改过，`Dictionary<string, string> _processedObjDic`字典标记已修改。

>[!ATTENTION]
>这种标记，不是标记某个路径已经修改，而是，资源有无变动，可以使用MD5来记录文件有无变动。例如，资源A经过后处理后，记录MD5。因为后处理脚本同样修改了A资源，因此会再次触发`OnPostprocessAllAssets`回调，此时再次计算A的MD5，如果和之前的一致，那么就不需要再次调用后处理脚本了。
  
考虑到计算MD5的消耗比较大，因此改用计算文件的修改时间戳
```CSharp
public static string GetAssetSignature(string assetPath)  
{  
    try  
    {  
        var path = Path.GetFullPath(assetPath);  
        if (File.Exists(path))  
        {            
	        var fi = new FileInfo(path);  
            return $"{fi.LastWriteTimeUtc.Ticks}_{fi.Length}";  
        }  
        return string.Empty;  
    }    catch  
    {  
        return string.Empty;  
    }
}
```
不过，文件签名机制具有局限性：
- 在1秒内多次保存文件可能无法检测（文件系统时间精度限制）
- 极特殊情况可能误判（文件大小和时间戳同时相同但内容不同）

>[!ATTENTION]
>后处理脚本，在资源修改后需要主动刷新资源，否则会导致计算文件修改时间失败。但是`AssetDatabase.Refresh()`方法会滞后刷新，`AssetDatabase.ImportAsset`方法，可以立刻刷新资源。


