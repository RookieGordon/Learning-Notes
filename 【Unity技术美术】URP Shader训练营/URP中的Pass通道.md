---
tags:
  - Unity
  - URP
  - ShaderLab
  - Shader
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

### URP渲染管线


| **值**                    | **功能**                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UniversalForward**     | 考虑光线。URP 在前向渲染路径中使用此标签值                                                                                                                                                                                                                                                                                 |
| **UniversalGBuffer**     | 不考虑任何光线。URP 在 "延迟渲染路径 "中使用此标签值。                                                                                                                                                                                                                                                                         |
| **UniversalForwardOnly** | 考虑光线，但是与`UniversalForward`不同的是，可以在正向和延迟渲染路径中同时使用。                                                                                                                                                                                                                                                       |
| **Universal2D**          | The Pass renders objects and evaluates 2D light contributions. URP uses this tag value in the 2D Renderer.                                                                                                                                                                                              |
| **ShadowCaster**         | The Pass renders object depth from the perspective of lights into the Shadow map or a depth texture.                                                                                                                                                                                                    |
| **DepthOnly**            | The Pass renders only depth information from the perspective of a Camera into a depth texture.                                                                                                                                                                                                          |
| **Meta**                 | Unity executes this Pass only when baking lightmaps in the Unity Editor. Unity strips this Pass from shaders when building a Player.                                                                                                                                                                    |
| **SRPDefaultUnlit**      | Use this `LightMode` tag value to draw an extra Pass when rendering objects. Application example: draw an object outline. This tag value is valid for both the Forward and the Deferred Rendering Paths.  <br>URP uses this tag value as the default value when a Pass does not have a `LightMode` tag. |

> **NOTE**: URP does not support the following LightMode tags: `Always`, `ForwardAdd`, `PrepassBase`, `PrepassFinal`, `Vertex`, `VertexLMRGBM`, `VertexLM`.