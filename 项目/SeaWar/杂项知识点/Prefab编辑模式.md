---
tags:
  - SeaWar/Unity杂项知识点/Prefab编辑模式
  - Unity/编辑器/Prefab编辑模式
---
# Prefab到编辑模式
通过Unity提供的[SceneManagement.PrefabStageUtility.OpenPrefab](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/SceneManagement.PrefabStageUtility.OpenPrefab.html)API，可以在编辑模式下打开一个Prefab。
```CSharp
// 打开Prefab编辑模式  
PrefabStage stage = PrefabStageUtility.OpenPrefab(prefabPath);  
// 获取根节点  
GameObject root = stage.prefabContentsRoot;
```
通过[SceneManagement.StageUtility.GoToMainStage](https://docs.unity3d.com/ScriptReference/SceneManagement.StageUtility.GoToMainStage.html)，可以关闭编辑模式
```CSharp
PrefabStage stage = PrefabStageUtility.GetCurrentPrefabStage();  
if (stage != null)  
{  
    StageUtility.GoToMainStage();  
}
```
## 在编辑模式中，选中节点
```CSharp
Selection.activeGameObject = targetNode;  
EditorGUIUtility.PingObject(targetNode);
```

