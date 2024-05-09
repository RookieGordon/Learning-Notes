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

