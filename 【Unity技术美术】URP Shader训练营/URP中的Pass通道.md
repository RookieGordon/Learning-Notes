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

| **值**                    | **功能**                                                                                                                                                                                                     |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UniversalForward**     | 考虑光线。URP 在前向渲染路径中使用此标签值                                                                                                                                                                                    |
| **UniversalGBuffer**     | 不考虑任何光线。URP 在 "延迟渲染路径 "中使用此标签值。                                                                                                                                                                            |
| **UniversalForwardOnly** | 考虑光线，但是与`UniversalForward`不同的是，可以在正向和延迟渲染路径中同时使用。<br>如果 URP 使用延迟渲染路径时，某个 Pass 必须使用前向渲染路径渲染对象，则使用此值。<br>如果着色器必须使用 "前向渲染路径 "进行渲染，而不管 URP 渲染器使用哪种渲染路径，则只需声明一个将 LightMode 标签设置为 UniversalForwardOnly 的通道即可<br> |
| **DepthNormalsOnly**     | 将此值与延迟渲染路径中的 `UniversalForwardOnly` 结合使用。此值允许 Unity 在深度和法线预通道中渲染着色器。在延迟渲染路径中，如果缺少具有 `DepthNormalsOnly` 标签值的通道，则 Unity 不会在网格周围生成环境光遮挡。                                                                      |
| **Universal2D**          | 考虑2D光线。URP 在 2D 渲染器中使用此标签值。                                                                                                                                                                                |
| **ShadowCaster**         | 该通道从灯光的角度将物体的深度渲染到阴影贴图或深度纹理中。                                                                                                                                                                              |
| **DepthOnly**            | 该通道只将相机视角下的深度信息渲染成深度纹理。                                                                                                                                                                                    |
| **SRPDefaultUnlit**      | 在渲染对象时，使用此 LightMode 标签值绘制额外的 Pass。应用示例：绘制对象轮廓。此标签值对 "正向 "和 "延迟 "渲染路径都有效。<br>当通道没有 LightMode 标签时，URP 将此标签值作为默认值。                                                                                           |

> [!ATTENTION]
> URP不支持以下的Tag值： `Always`, `ForwardAdd`, `PrepassBase`, `PrepassFinal`, `Vertex`, `VertexLMRGBM`, `VertexLM`.

> [!Attention]
> 对于DepthOnly，会生成一张名为_CameraDepthTexture的深度图。使用DepthNormals，会生成_CameraDepthTexture和_CameraNormalsTexture两张纹理贴图

>[!INFO]
>SRPDefaultUnlit除了用于URP的LightMode标签的默认值外，还可以用于兼容早期的内置渲染管线

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

# Cull渲染剔除

此命令会更改渲染状态。在 `Pass` 代码块中使用它可为该通道设置渲染状态，或者在 `SubShader`代码块中使用它可为该子着色器中的所有通道设置渲染状态。

## 有效参数值

| **值**   | **功能**                             |
| ------- | ---------------------------------- |
| `Back`  | 剔除背对摄像机的多边形。这称为背面剔除。这是默认值。         |
| `Front` | 剔除面向摄像机的多边形。这称为正面剔除。使用它可翻转几何体。     |
| `Off`   | 不根据面朝的方向剔除多边形。可用于实现特殊效果，如透明对象或双面墙。 |
关于剔除，详见：[[高级渲染管线功能#剔除]]

# ZTest深度测试

此命令会更改渲染状态。在 `Pass` 代码块中使用它可为该通道设置渲染状态，或者在 `SubShader`代码块中使用它可为该子着色器中的所有通道设置渲染状态。

## 有效参数值

| **值**    | **功能**                                       |
| -------- | -------------------------------------------- |
| Disabled | 禁用ZTest                                      |
| Never    | 无论距离多远，都不绘制几何图形。                             |
| Less     | 绘制位于现有几何体前面的几何体。不绘制位于现有几何体相同距离或后面的几何体。       |
| Equal    | 绘制位于现有几何体相同距离的几何体。不绘制位于现有几何体前面的或后面的几何体。      |
| LEqual   | 绘制位于现有几何体前面或相同距离的几何体。不绘制位于现有几何体后面的几何体。这是默认值。 |
| Greater  | 绘制位于现有几何体后面的几何体。不绘制位于现有几何体相同距离或前面的几何体。       |
| NotEqual | 绘制不位于现有几何体相同距离的几何体。不绘制位于现有几何体相同距离的几何体。       |
| GEqual   | 绘制位于现有几何体后面或相同距离的几何体。不绘制位于现有几何体前面的几何体。       |
| Always   | 不进行深度测试。绘制所有几何体，无论距离如何。                      |
关于深度测试，详见：[[高级渲染管线功能#深度测试]]

# ZWrite

设置在渲染过程中是否更新深度缓冲区内容。通常，`ZWrite 对不透明对象启用，对半透明对象禁用。禁用 ZWrite 会导致不正确的深度排序。这种情况下，您需要在 CPU 上对几何体进行排序。`

此命令会更改渲染状态。在 `Pass` 代码块中使用它可为该通道设置渲染状态，或者在 `SubShader` 代码块中使用它可为该子着色器中的所有通道设置渲染状态。

## 有效参数值

| **参数** | **值** | **功能**     |
| ------ | ----- | ---------- |
| 状态     | On    | 启用写入深度缓冲区。 |
|        | Off   | 禁用写入深度缓冲区。 |

# ZClip

设置 GPU 的深度剪辑模式，从而确定 GPU 如何处理近平面和远平面之外的片元。

将 GPU 的深度剪辑模式设置为钳位对于模板阴影渲染很有用；这意味着当几何体超出远平面时不需要特殊处理，从而减少渲染操作。但是，它可能会导致不正确的 Z 排序。

此命令会更改渲染状态。在 `Pass` 代码块中使用它可为该通道设置渲染状态，或者在 `SubShader` 代码块中使用它可为该子着色器中的所有通道设置渲染状态。

## 有效参数值

| **参数**  | **值** | **功能**                                                     |
| ------- | ----- | ---------------------------------------------------------- |
| enabled | True  | 将深度剪辑模式设置为剪辑。  <br>  <br>这是默认设置。                           |
|         | False | 将深度剪辑模式设置为钳位。  <br>  <br>比近平面更近的片元正好在近平面，而比远平面更远的片元正好在远平面。 |

# Blend

确定 GPU 如何将片元着色器的输出与渲染目标进行合并。此命令的功能取决于混合操作，您可以使用 BlendOp 命令进行设置。

此命令会更改渲染状态。在 `Pass` 代码块中使用它可为该通道设置渲染状态，或者在 `SubShader` 代码块中使用它可为该子着色器中的所有通道设置渲染状态。

如果启用了混合，则会发生以下情况：
- 如果使用 BlendOp 命令，则混合操作将设置为该值。否则，混合操作默认为 `Add`。
- 如果混合操作是 `Add`、`Sub`、`RevSub`、`Min` 或 `Max`，GPU 会将片元着色器的输出值乘以源系数。
- 如果混合操作是 `Add`、`Sub`、`RevSub`、`Min` 或 `Max`，GPU 会将渲染目标中现有的值乘以目标系数。
- GPU 对结果值执行混合操作。

混合等式为：

```Cpp
finalValue = sourceFactor * sourceValue operation destinationFactor * destinationValue
```

在这个等式中：
- `finalValue` 是 GPU 写入目标缓冲区的值。
- `sourceFactor` 在 Blend 命令中定义。
- `sourceValue` 是片元着色器输出的值。
- `operation` 是混合操作。
- `destinationFactor` 在 Blend 命令中定义。
- `destinationValue` 是目标缓冲区中现有的值。

| **签名**                                                                                                                 | **示例语法**                     | **功能**                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `Blend <state>`                                                                                                        | `Blend Off`                  | 禁用默认渲染目标的混合。这是默认值。                       |
| `Blend <render target> <state>`                                                                                        | `Blend 1 Off`                | 如上，但针对给定的渲染目标。(1)                        |
| `Blend <source factor> <destination factor>`                                                                           | `Blend One Zero`             | 启用默认渲染目标的混合。设置 RGBA 值的混合系数。              |
| `Blend <render target> <source factor> <destination factor>`                                                           | `Blend 1 One Zero`           | 如上，但针对给定的渲染目标。(1)                        |
| `Blend <source factor RGB> <destination factor RGB>, <source factor alpha> <destination factor alpha>`                 | `Blend One Zero, Zero One`   | 启用默认渲染目标的混合。为 RGB 和 Alpha 值设置单独的混合系数。(2) |
| `Blend <render target> <source factor RGB> <destination factor RGB>, <source factor alpha> <destination factor alpha>` | `Blend 1 One Zero, Zero One` | 如上，但针对给定的渲染目标。(1) (2)                    |

**注意：**
1. 任何指定渲染目标的签名都需要 OpenGL 4.0+、`GL_ARB_draw_buffers_blend` 或 OpenGL ES 3.2。
2. 单独的 RGB 和 Alpha 混合与[高级 OpenGL 混合操作](https://docs.unity3d.com/cn/2023.2/Manual/SL-BlendOp.html)不兼容。

## BlendOp有效参数值

| **参数**        | **值**                 | **功能**                                                  |
| ------------- | --------------------- | ------------------------------------------------------- |
| **operation** | `Add`                 | 将源和目标相加。                                                |
|               | `Sub`                 | 从源减去目标。                                                 |
|               | `RevSub`              | 从目标减去源。                                                 |
|               | `Min`                 | Use the smaller of source and destination. (1)          |
|               | `Max`                 | Use the larger of source and destination. (1)           |
|               | `LogicalClear`        | Logical operation: `Clear (0)` (1)                      |
|               | `LogicalSet`          | Logical operation: `Set (1)` (1)                        |
|               | `LogicalCopy`         | Logical operation: `Copy (s)` (1)                       |
|               | `LogicalCopyInverted` | 逻辑操作：`Copy inverted (!s)` 2                             |
|               | `LogicalNoop`         | Logical operation: `Noop (d)` (1)                       |
|               | `LogicalInvert`       | Logical operation: `Invert (!d)` (1)                    |
|               | `LogicalAnd`          | Logical operation: `And (s & d)` (1)                    |
|               | `LogicalNand`         | Logical operation: `Nand !(s & d)` (1)                  |
|               | `LogicalOr`           | Logical operation: `Or (s \| d)` (1)                    |
|               | `LogicalNor`          | Logical operation: `Nor !(s \| d)` (1)                  |
|               | `LogicalXor`          | Logical operation: `Xor (s ^ d)` (1)                    |
|               | `LogicalEquiv`        | Logical operation: `Equivalence !(s ^ d)` (1)           |
|               | `LogicalAndReverse`   | Logical operation: `Reverse And (s & !d)` (1)           |
|               | `LogicalAndInverted`  | Logical operation: `Inverted And (!s & d)` (1)          |
|               | `LogicalOrReverse`    | Logical operation: `Reverse Or (s \| !d)` (1)           |
|               | `LogicalOrInverted`   | Logical operation: `Inverted Or (!s \| d)` (1)          |
|               | `Multiply`            | Advanced OpenGL blending operation: `Multiply` (2)      |
|               | `Screen`              | Advanced OpenGL blending operation: `Screen` (2)        |
|               | `Overlay`             | Advanced OpenGL blending operation: `Overlay` (2)       |
|               | `Darken`              | Advanced OpenGL blending operation: `Darken` (2)        |
|               | `Lighten`             | Advanced OpenGL blending operation: `Lighten` (2)       |
|               | `ColorDodge`          | Advanced OpenGL blending operation: `ColorDodge` (2)    |
|               | `ColorBurn`           | Advanced OpenGL blending operation: `ColorBurn` (2)     |
|               | `HardLight`           | Advanced OpenGL blending operation: `HardLight` (2)     |
|               | `SoftLight`           | Advanced OpenGL blending operation: `SoftLight` (2)     |
|               | `Difference`          | Advanced OpenGL blending operation: `Difference` (2)    |
|               | `Exclusion`           | Advanced OpenGL blending operation: `Exclusion` (2)     |
|               | `HSLHue`              | Advanced OpenGL blending operation: `HSLHue` (2)        |
|               | `HSLSaturation`       | Advanced OpenGL blending operation: `HSLSaturation` (2) |
|               | `HSLColor`            | Advanced OpenGL blending operation: `HSLColor` (2)      |
|               | `HSLLuminosity`       | Advanced OpenGL blending operation: `HSLLuminosity` (2) |
注意：
1. 逻辑操作需要支持DX 11.1+或Vulkan
2. 高级混合操作需要支持`GLES3.1 AEP+`，`GL_KHR_blend_equation_advanced`或 `GL_NV_blend_equation_advanced`。它们只能用于标准 RGBA 混合；与单独的 RGB 和 alpha 混合不兼容。

## 有效参数值

| **参数**            | **值**              | **功能**                                                                                                          |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **render target** | 整数，范围 0 到 7        | 渲染目标索引。                                                                                                         |
| **state**         | `Off`              | 禁用混合。                                                                                                           |
| **factor**        | `One`              | 此输入的值是 one。该值用于使用源或目标的颜色的值。                                                                                     |
|                   | `Zero`             | 此输入的值是 zero。该值用于删除源或目标值。                                                                                        |
|                   | `SrcColor`         | GPU 将此输入的值乘以源颜色值。                                                                                               |
|                   | `SrcAlpha`         | GPU 将此输入的值乘以源 Alpha 值。                                                                                          |
|                   | `SrcAlphaSaturate` | The GPU multiplies the value of this input by the minimum value of `source alpha` and `(1 - destination alpha)` |
|                   | `DstColor`         | GPU 将此输入的值乘以帧缓冲区的源颜色值。                                                                                          |
|                   | `DstAlpha`         | GPU 将此输入的值乘以帧缓冲区的源 Alpha 值。                                                                                     |
|                   | `OneMinusSrcColor` | GPU 将此输入的值乘以（1 - 源颜色）。                                                                                          |
|                   | `OneMinusSrcAlpha` | GPU 将此输入的值乘以（1 - 源 Alpha）。                                                                                      |
|                   | `OneMinusDstColor` | GPU 将此输入的值乘以（1 - 目标颜色）。                                                                                         |
|                   | `OneMinusDstAlpha` | GPU 将此输入的值乘以（1 - 目标 Alpha）。                                                                                     |

## 常见混合类型 (Blend Type)

以下是最常见的混合类型的语法：

``` Cpp
// 传统透明度 srcColor.A * scrColor + dstColor * (1 - srcColor.A)
Blend SrcAlpha OneMinusSrcAlpha
// 预乘透明度 srcColor + dstColor * (1 - srcColor.A)
Blend One OneMinusSrcAlpha 
// 加法 scrColor + dstColor
Blend One One 
// 软加法 scrColor * (1 - dstColor) + dstColor
Blend OneMinusDstColor One 
// 乘法 srcColor * dstColor
Blend DstColor Zero 
// 2x乘法 (srcColor * dstColor) * 2
Blend DstColor SrcColor 
```

>[!Attention]
>从[[URP中的SubShader#^f1d77c|Unity的渲染顺序]]来说，设置混合后，都要关闭深度写入

# URP中的多Pass编写

在URP中，编写多pass的两个方法：
- 使用RenderObject（可视化方法）
- 使用RenderFeature

## URP Renderer Feature

渲染器特性是一种资产，可让您为URP渲染器添加额外的渲染传递并配置其行为。URP 提供以下渲染器功能：
- [Render Objects](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/renderer-features/renderer-feature-render-objects.html)
- [Screen Space Ambient Occlusion](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/post-processing-ssao.html)
- [Decal](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/renderer-feature-decal.html)
- [Screen Space Shadows](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/renderer-feature-screen-space-shadows.html)
- [Full Screen Pass](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/renderer-features/renderer-feature-full-screen-pass.html)

### Renderer Objects

URP 通过 DrawOpaqueObjects（绘制不透明对象）和 DrawTransparentObjects（绘制透明对象）来绘制对象。您可能需要在帧渲染的不同点绘制对象，或以其他方式解释和写入渲染数据（如深度和模版）。通过渲染对象渲染器功能，您可以在特定的时间、特定的图层上绘制对象，并使用特定的重载功能进行此类自定义操作。

详见：[Render Objects Renderer Feature | Universal RP | 15.0.7 (unity3d.com)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@15.0/manual/renderer-features/renderer-feature-render-objects.html)

## 配置RenderObject实现多个Pass效果

在当前生效的管线中，添加一个新的Render Objects
![[（图解2）Add Renderer Feature.png|460]]
该Render Object是通过Filters属性来确定