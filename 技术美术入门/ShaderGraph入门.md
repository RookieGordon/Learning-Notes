---
tags:
  - Unity
  - Shader-Graph
---
# Shader Graph 界面

## Shader Graph 窗口

![|540](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/CC_Shad_SG_2_2.jpg)

- Shader Graph 工具栏 (1)是您保存着色器资源的地方。
- Blackboard 黑板(2): 包含可供使用此着色器创建材质所使用的属性（可以在 Unity 的 Inspector 窗口中进行值配置）。可以在此处对图表中的属性和关键字进行定义、排序和分类。在 Blackboard 中，您还可以编辑所选 Shader Graph Asset 或 Sub Graph 的路径。
- 工作区 (3): 将在其中创建着色器的节点图。
- Main Preview 主预览窗口 (4): 将为您提供着色器外观及其行为方式的实时更新。
- Graph Inspector 图形检查器窗口 (5): 将显示您选择的任何节点的当前设置、属性和值。
- Master Stack 主堆栈 (6): 是定义着色器最终表面外观的着色器图的终点，一个 Shader 中有且只有一个。它列出了顶点着色器和片段（片元）着色器的主要着色器属性，并为您提供了插入必要值的末端节点。
- Internal Inspector：包含与用户当前单击的任何内容相关的信息的区域。这是一个默认情况下自动隐藏的窗口，只有在选择了用户可以编辑的内容时才会出现。使用内部检查器显示和修改属性、节点选项和图形设置。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/SG_Inspector.png)