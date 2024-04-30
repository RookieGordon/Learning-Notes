---
tags:
  - Unity
  - ShaderLab
  - Shader
  - URP
---
# Tag

标签是数据的键/值对。Unity 使用预定义键和值确定如何以及何时使用给定子着色器，也可以使用自定义值创建自己的自定义子着色器标签。可以从 C# 代码访问子着色器标签。

Tag的定义方式如下：
>Tags { “[name1]” = “[value1]” “[name2]” = “[value2]”}

## RenderPipeline 标签

`RenderPipeline` 标签向 Unity 告知子着色器是否与通用渲染管线 (URP) 或高清渲染管线 (HDRP) 兼容。

|**参数**|**值**|**功能**|
|---|---|---|
|[name]|UniversalRenderPipeline|此子着色器仅与 URP 兼容。|
||HighDefinitionRenderPipeline|此子着色器仅与 HDRP 兼容。|
||（任何其他值，或未声明）|此子着色器与 URP 和 HDRP 不兼容。|

### 示例

此示例代码声明子着色器与 URP 兼容：
## Queue 标签

`Queue` 标签向 Unity 告知要用于它渲染的几何体的渲染队列。渲染队列是确定 Unity 渲染几何体的顺序的因素之一。

| **签名**                              | **功能**                                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| “Queue” = “[queue name]”            | 使用命名渲染队列。                                                        |
| “Queue” = “[queue name] + [offset]” | 在相对于命名队列的给定偏移处使用未命名队列（这种用法十分有用的一种示例情况是透明的水，它应该在不透明物体之后、透明物体之前绘制） |

| **签名**       | **值**                                                                                                            | **功能**                                     |     |
| :----------- | :--------------------------------------------------------------------------------------------------------------- | :----------------------------------------- | --- |
| [queue name] | Background（1000）                                                                                                 | 此渲染队列在任何其他渲染队列之前渲染                         |     |
|              | Geometry（2000）                                                                                                   | 不透明几何体使用此队列                                |     |
|              | [AlphaTest](https://docs.unity3d.com/cn/2023.2/ScriptReference/Rendering.RenderQueue.AlphaTest.html)（2450）       | 经过 Alpha 测试的几何体将使用此队列                      |     |
|              | [GeometryLast](https://docs.unity3d.com/cn/2023.2/ScriptReference/Rendering.RenderQueue.GeometryLast.html)（2500） | 视为“不透明”的最后的渲染队列                            |     |
|              | [Transparent](https://docs.unity3d.com/cn/2023.2/ScriptReference/Rendering.RenderQueue.Transparent.html)（3000）   | 此渲染队列在 Geometry 和 AlphaTest 之后渲染，按照从后到前的顺序 |     |
|              | [Overlay](https://docs.unity3d.com/cn/2023.2/ScriptReference/Rendering.RenderQueue.Overlay.html)（4000）           | 此渲染队列旨在获得覆盖效果                              |     |
| [offset]     | 整数                                                                                                               | 指定 Unity 渲染未命名队列处的索引（相对于命名队列）。             |     |
Unity中的渲染顺序如下：
1. 渲染不透明物体
	- 不透明物体从前到后渲染（较靠近摄像机的首先渲染） 
2. 渲染透明（或半透明）物体
	- 透明半透明物体，从后往前渲染（首先渲染较远的对象）
	- 由于透明着色器往往不使用深度测试/写入，因此更改队列将更改着色器与其他透明对象的排序方式

另见：[[高级渲染管线功能#混合绘制的顺序问题]]

## RenderType 标签

使用 `RenderType` 标签可覆盖 Shader 对象的行为。

在内置渲染管线中，可以使用一种称为[着色器替换](https://docs.unity3d.com/cn/2023.2/Manual/SL-ShaderReplacement.html)的技术在运行时交换子着色器。此技术的工作方式是标识具有匹配 `RenderType` 标签值的子着色器。这在某些情况下用于生成[摄像机的深度纹理](https://docs.unity3d.com/cn/2023.2/Manual/SL-CameraDepthTexture.html)

## ForceNoShadowCasting 标签

`ForceNoShadowCasting` 标签阻止子着色器中的几何体投射（有时是接收）阴影。确切行为取决于渲染管线和渲染路径。

## DisableBatching 标签

`DisableBatching` 子着色器标签阻止 Unity 将[动态批处理](https://docs.unity3d.com/cn/2023.2/Manual/DrawCallBatching.html)应用于使用此子着色器的几何体。

这对于执行对象空间操作的着色器程序十分有用。动态批处理会将所有几何体都变换为世界空间，这意味着着色器程序无法再访问对象空间。因此，依赖于对象空间的着色器程序不会正确渲染。为避免此问题，请使用此子着色器标签阻止 Unity 应用动态批处理。