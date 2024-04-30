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

### 内置渲染管线中的预定义通道标签