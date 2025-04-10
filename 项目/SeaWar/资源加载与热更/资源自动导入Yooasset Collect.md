---
tags:
  - SeaWar/资源加载与热更/资源自动导入Yooasset
  - Collect
  - mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/资源加载与热更
dateStart: 2025-04-08
dateFinish: 2025-04-10
finished: false
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
接下来就是实现一个后处理的管理类，所有的后处理对象都需要被注册进去，然后该类会监听`OnPostprocessAllAsset`方法，在方法中，遍历调用处理对象。




