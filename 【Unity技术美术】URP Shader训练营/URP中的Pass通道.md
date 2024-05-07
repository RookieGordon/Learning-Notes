---
tags:
  - Unity
  - URP
  - ShaderLab
  - Shader
annotation-target: Forward Rendering vs Deferred Rendering.pdf
---
# Tag

标签是可以分配给通道的键值对数据。Unity 使用预定义的标签和值来确定如何以及何时渲染给定的通道。您还可以使用自定义值创建自己的自定义通道标签，并从 C# 代码访问它们。

## LightMode 标签

`LightMode` 标签是一个预定义的通道标签，Unity 使用它来确定是否在给定帧期间执行该通道，在该帧期间 Unity 何时执行该通道，以及 Unity 对输出执行哪些操作。

**注意：** `LightMode` 标签与 [LightMode](https://docs.unity3d.com/cn/2023.2/ScriptReference/Experimental.GlobalIllumination.LightMode.html) 枚举无关，后者与光照有关。

### 内置渲染管线

| **值**           | **功能**                                                |
| --------------- | ----------------------------------------------------- |
| `Always`        | 始终渲染；不应用任何光照。这是默认值。                                   |
| `ForwardBase`   | 在前向渲染中使用；应用环境光、主方向光、顶点/SH 光源和光照贴图。                    |
| `ForwardAdd`    | 在前向渲染中使用；应用附加的每像素光源（每个光源有一个通道）。                       |
| `Deferred`      | 在延迟渲染中使用；渲染 G 缓冲区。                                    |
| `ShadowCaster`  | 将对象深度渲染到阴影贴图或深度纹理中。                                   |
| `MotionVectors` | 用于计算每个对象的运动矢量。                                        |
| `Vertex`        | 用于旧版顶点光照渲染（当对象不进行光照贴图时）；应用所有顶点光源。                     |
| `VertexLMRGBM`  | 用于旧版顶点光照渲染（当对象不进行光照贴图时），以及光照贴图为 RGBM 编码的平台（PC 和游戏主机）。 |
| `VertexLM`      | 用于旧版顶点光照渲染（当对象不进行光照贴图时），以及光照贴图为双 LDR 编码的平台上（移动平台）。    |
| `Meta`          | 不用于常规渲染，仅用于光贴图烘焙或 Enlighten 实时全局光照                    |
|                 |                                                       |
关于前向渲染，延迟渲染等，详见：
```cardlink
url: https://gamedevelopment.tutsplus.com/forward-rendering-vs-deferred-rendering--gamedev-12342a
title: "Forward Rendering vs. Deferred Rendering | Envato Tuts+"
description: "If you're a developer of 3D games, then you've probably come across the terms forward rendering and deferred rendering in your research of modern graphics engines. And, often, you'll have to..."
host: gamedevelopment.tutsplus.com
image: https://cdn.tutsplus.com/gamedev/uploads/2013/10/deferred_x400.png
```

```cardlink
url: https://learnopengl-cn.readthedocs.io/zh/latest/05%20Advanced%20Lighting/08%20Deferred%20Shading/
title: "延迟着色法 - LearnOpenGL-CN"
host: learnopengl-cn.readthedocs.io
```

### URP渲染管线

| **值**                    | **功能**                                                                                                                                                                                                     |     |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **UniversalForward**     | 考虑光线。URP 在前向渲染路径中使用此标签值                                                                                                                                                                                    |     |
| **UniversalGBuffer**     | 不考虑任何光线。URP 在 "延迟渲染路径 "中使用此标签值。                                                                                                                                                                            |     |
| **UniversalForwardOnly** | 考虑光线，但是与`UniversalForward`不同的是，可以在正向和延迟渲染路径中同时使用。<br>如果 URP 使用延迟渲染路径时，某个 Pass 必须使用前向渲染路径渲染对象，则使用此值。<br>如果着色器必须使用 "前向渲染路径 "进行渲染，而不管 URP 渲染器使用哪种渲染路径，则只需声明一个将 LightMode 标签设置为 UniversalForwardOnly 的通道即可<br> |     |
| **DepthNormalsOnly**     | 将此值与延迟渲染路径中的 `UniversalForwardOnly` 结合使用。此值允许 Unity 在深度和法线预通道中渲染着色器。在延迟渲染路径中，如果缺少具有 `DepthNormalsOnly` 标签值的通道，则 Unity 不会在网格周围生成环境光遮挡。                                                                      |     |
| **Universal2D**          | 考虑2D光线。URP 在 2D 渲染器中使用此标签值。                                                                                                                                                                                |     |
| **ShadowCaster**         | 该通道从灯光的角度将物体的深度渲染到阴影贴图或深度纹理中。                                                                                                                                                                              |     |
| **DepthOnly**            | 该通道只将相机视角下的深度信息渲染成深度纹理。                                                                                                                                                                                    |     |
| **SRPDefaultUnlit**      | 在渲染对象时，使用此 LightMode 标签值绘制额外的 Pass。应用示例：绘制对象轮廓。此标签值对 "正向 "和 "延迟 "渲染路径都有效。<br>当通道没有 LightMode 标签时，URP 将此标签值作为默认值。                                                                                           |     |

> [!ATTENTION]
> URP不支持以下的Tag值： `Always`, `ForwardAdd`, `PrepassBase`, `PrepassFinal`, `Vertex`, `VertexLMRGBM`, `VertexLM`.

> [!Attention]
> 对于DepthOnly，会生成一张名为_CameraDepthTexture的深度图。使用DepthNormals，会生成_CameraDepthTexture和_CameraNormalsTexture两张纹理贴图

## PassFlags 标签

在内置渲染管线中，使用 `PassFlags` 通道标签来指定 Unity 提供给通道的数据。

| **值**           | **功能**                                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OnlyDirectional | 仅在内置渲染管线中且渲染路径设置为 Forward，`LightMode` 标签值为 `ForwardBase` 的通道中有效。  <br>  <br>Unity 只为该通道提供主方向光和环境光/光照探针数据。这意味着非重要光源的数据将不会传递到顶点光源或球谐函数着色器变量。请参阅[前向渲染路径](https://docs.unity3d.com/cn/2023.2/Manual/RenderTech-ForwardRendering.html)以了解详细信息。 |

## RequireOptions 标签

在内置渲染管线中，`RequireOptions` 通道标签根据项目设置启用或禁用一个通道

| **值**            | **功能**                                                                                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `SoftVegetation` | 只有 [QualitySettings-softVegetation](https://docs.unity3d.com/cn/2023.2/ScriptReference/QualitySettings-softVegetation.html) 开启时，才会渲染该pass |

## UniversalMaterialType 标签

URP渲染管线中，Unity 在延迟渲染路径中使用此标签。

| **属性**        | **描述**                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Lit**       | 此值指示着色器类型为光照 (Lit)。在 G 缓冲区通道期间，Unity 使用模板来标记使用光照着色器类型（镜面反射模型为 PBR）的像素。  <br>如果未在通道中设置标签，Unity 默认使用此值。 |
| **SimpleLit** | 此值指示着色器类型为简单光照 (SimpleLit)。在 G 缓冲区通道期间，Unity 使用模板来标记使用简单光照着色器类型（镜面反射模型为 Blinn-Phong）的像素。              |