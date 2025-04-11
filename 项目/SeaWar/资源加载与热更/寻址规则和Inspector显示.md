---
tags:
  - SeaWar/资源加载与热更/寻址规则和Inspector显示
  - mytodo
  - Unity/Inspector扩展/Inspector页眉
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/资源加载与热更
dateStart: 2025-04-08
dateFinish: 2025-04-08
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
# Inspector显示需求
在点击任意Asset资源唤出Inspetor窗口时，在Inspetor中显示该资源配置的可寻址路径，具体效果如下：
![[（图解1）Inspector显示自定义内容.png|470]]
# 实现逻辑
```CSharp
[InitializeOnLoad]
public class AddressableInspectorExtension : Editor
{
    static AddressableInspectorExtension()
    {
        Editor.finishedDefaultHeaderGUI += OnPostHeaderGUI;
    }
    private static void OnPostHeaderGUI(Editor editor)
    {
	    // etc.
    }
```
使用`Editor.finishedDefaultHeaderGUI`可以实现自定义页眉显示，详见：[Fetching Data#ufbw](https://zhuanlan.zhihu.com/p/683651815)




