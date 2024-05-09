---
tags:
  - Unity
  - URP
  - Shader
---
# 纹理操作

## Tiling与Offset

为了能够使纹理的tiling与offset生效，需要声明一个带有”\_ST“后缀的变量，为了能够使用[[URP Shader基本结构#URP中的SRPBatcher合批|SRP Batcher]]，需要将该变量放到`CBUFFER_START(UnityPerMaterial) ... CBUFFER_END`块中。然后使用`TRANSFORM_TEX`函数，应用tiling与offset效果。

# 数组传参

Shader中的数组，只能从C#端进行传入，不能在Shader的Properties中进行声明与设置。

Unity中，可以传递float、向量和矩阵三种类型的数组。分别使用`Shader.SetGlobalFloatArray`，`Shader.SetGlobalVectorArray`和`Shader.SetGlobalMatrixArray`三个静态方法。

>[!Attention]
>1、数组类型变量是不兼容SRP Batcher的，一般不需要将数组变量放到代码块中去
>2、Shader的内存是有限的，不能传输非常大的数组参数，数组长度最大不能超过1023。

# 纹理数组




