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

纹理数组类型是`2DArray`，例如：`_TexArray ("Texture Array", 2DArray) = "white" {}`。纹理变量的类型是`Texture2DArray`，或者使用宏定义`TEXTURE2D_ARRAY`，采样器和普通纹理采样器一样即可。采样使用宏定义`SAMPLE_TEXTURE2D_ARRAY`

## C#中，创建纹理数据

通过一组纹理，创建一个纹理数组：
```C#
public Texture2D[] ordinaryTextures;  
private Texture2DArray texture2DArray;  
  
private void CreateTextureArray()  
{  
    //Create Texture2DArray  
    texture2DArray = new Texture2DArray(ordinaryTextures[0].width, 
										ordinaryTextures[0].height, 
										ordinaryTextures.Length,  
							            TextureFormat.RGBA32, true, false);  
    
    //Apply settings  
    texture2DArray.filterMode = FilterMode.Bilinear;  
    texture2DArray.wrapMode = TextureWrapMode.Repeat; 
     
    //Loop through ordinary textures and copy pixels to the  Texture2DArray    
    for (int i = 0; i < ordinaryTextures.Length; i++)  
    {        
	    texture2DArray.SetPixels(ordinaryTextures[i].GetPixels(0), i, 0);  
    }  
    
    //Apply our changes  
    texture2DArray.Apply();  
}
```
该纹理数组，可以通过`Shader.SetGlobalTexture`方法，传递给shader。

>[!Attention]
>纹理数组是不兼容SRP Batcher的，一般不需要将数组变量放到代码块中去

# Compute Buffer

```cardlink
url: https://developer.unity.cn/projects/6116875dedbc2a00204564c9
title: "Unity中ComputeShader入门 - 技术专栏 - Unity官方开发者社区"
description: "ComputeShader的简单介绍，转自个人知乎：https://zhuanlan.zhihu.com/p/368307575 - Unity技术专栏是中国Unity官方为开发者准备的中文技术分享社区，极简高效的markdown文本编辑器体验更适合Unity开发者日常记录开发经验和灵感，通过输出倒逼输入，加快自身学习成长速度；每一位开发者都可以通过技术分享与社区中的伙伴们交流学习，一起成为更优秀的创作者。"
host: developer.unity.cn
favicon: https://developer-prd.cdn.unity.cn/images/favicons/favicon_cn.ico?v=3
image: https://u3d-connect-cdn-public-prd.cdn.unity.cn/h1/20210813/p/images/02ea88af-ed88-4160-8e28-08ae7b5aeb17_src_http___pic.vjshi.com_2017_05_15_3ad4dcb96bceaae51889ccf130cc4a3f_00002.jpg_x_oss_process_style_watermark_refer_http___pic.vjshi.jpg
```

```cardlink
url: https://zhuanlan.zhihu.com/p/368307575
title: "【Unity】Compute Shader的基础介绍与使用"
description: "Compute Shader概念当代GPU被设计成可以执行大规模的并行操作，这有益于图形应用，因为在渲染管线中，不论是顶点着色器还是像素着色器，它们都可以独立进行。然而对于一些非图形应用也可以受益于GPU并行架构所提供…"
host: zhuanlan.zhihu.com
image: https://picx.zhimg.com/v2-2c5673d67b8cda781d8f0b787470bce3_720w.jpg?source=172ae18b
```

使用Compute Buffer的要求：DirectX 11 或 DirectX 12 图形 API 和着色器模型 5.0 GPU

Compute Buffer主要用于计算着色器。计算着色器程序经常需要将任意数据读写到内存缓冲区中。ComputeBuffer 类正是为此而生。你可以从脚本代码中创建和填充它们，并在计算着色器或普通着色器中使用它们。

详见：[Unity - Scripting API: ComputeBuffer (unity3d.com)](https://docs.unity3d.com/2023.2/Documentation/ScriptReference/ComputeBuffer.html)
       [Unity - 手册：计算着色器 (unity3d.com)](https://docs.unity3d.com/2023.2/Documentation/Manual/class-ComputeShader.html)

## 通过Computer Buffer进行传参

在Shader中定义一个结构体和一个以该结构体为元素的StructBuffer，例如：
```C#
struct BufferElement{
	float3 dir;
	float scale;
}

StructuredBuffer<BufferElement> _ComputerBuffer;
```
这样就定义了一个Computer Buffer。可以像访问List一样，访问StructuredBuffer。

在C#端，同样需要定义一个和`BufferElement`一样的结构体和一个`ComputeBuffer`对象，然后通过`Shader.SetGlobalBuffer`进行传参。

