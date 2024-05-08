---
tags:
  - URP
  - Shader
---
# URP-Shader中的命名规范

不同于内置管线的shader写法，URP中，vertex和fragment着色器的命名规则为：光照模型+Pass+着色器类型。顶点数据变量一般为：Attribute，偏移着色器输入变量为：Varying

Attribute和Varying中的position变量一般加上后缀表示顶点数据位于哪个空间（OS—模型空间，WS—世界坐标系，VS—视图空间，CS—裁剪空间）。

# URP中的SRPBatcher合批

```cardlink
url: https://blog.csdn.net/zengjunjie59/article/details/122691474
title: "URP下SRPBatcher，GPUInstancing，动态合批，静态合批_urp管线启用动态合批-CSDN博客"
description: "文章浏览阅读1w次，点赞14次，收藏53次。SRPBatcher：适用前提：需要是同一个shader，可以是不同的材质球，Shader代码必须兼容SRP Batcher。但是不支持用材质球属性块（MaterialPropertyBlock）   渲染的物体必须是一个mesh或者skinnedmesh。不能是粒子。效果：    可以有效降低SetPassCall的数目，数据CPU性能优化优化原理：1.在过去的渲染架构中，Unity采取对一个材质分配一个C..............._urp管线启用动态合批"
host: blog.csdn.net
```

![[（图解7）SRP合批流程.png]]

SRP Batcher并没有实际减少Draw Calls，而是优化提升了调用Draw Calls前的大量的工作效率。所以后面SRP Batching的优化drawcalls，改成优化了batches。也就是将它们调用drawcalls的设置工作量合并批处理了。
![[（图解4）绑定和绘制命令的批处理减少了绘制调用之间的 GPU 设置.png|460]]

适用前提：
- 需要是同一个shader变体，可以是不同的材质球，项目需要使用自定义渲染管线，Shader代码必须兼容SRP Batcher。
- 不能使用材质球属性块（MaterialPropertyBlock）
- 渲染的物体必须是一个mesh或者skinned mesh，不能是粒子

要使自定义着色器与 SRP Batcher 兼容，它必须满足以下要求：
1. 着色器必须在名为`UnityPerDraw`的单个常量缓冲区中声明所有内置引擎属性。例如，或 `unity_ObjectToWorld`、`unity_SHAr`
```Cpp
// 如果需要支持SRP合批，内置引擎属性必须在“UnityPerDraw”的 CBUFFER 中声明
CBUFFER_START(UnityPerDraw)
	// 模型空间->世界空间，转换矩阵(uniform 值。它由GPU每次绘制时设置，对于该绘制期间所有顶点和片段函数的调用都将保持不变)
	float4x4 unity_ObjectToWorld;			
	// 世界空间->模型空间
	float4x4 unity_WorldToObject;			
	float4 unity_LODFade;
	// 包含一些我们不再需要的转换信息，real4向量，它本身不是有效的类型，而是取决于目标平台的float4或half4的别名。（需要引入unityURP库里的"Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"才能使用real4）
	real4 unity_WorldTransformParams;		
CBUFFER_END
```
1. 着色器必须在名为`UnityPerMaterial`的单个常量缓冲区中声明所有材质属性
```Cpp
// 使用核心RP库中的CBUFFER_START宏定义，因为有些平台是不支持常量缓冲区的。这里不能直接用cbuffer UnityPerMaterial{ float4 _BaseColor };
// Properties大括号里声明的所有变量如果需要支持合批，都需要在UnityPerMaterial的CBUFFER中声明所有材质属性
// 在GPU给变量设置了缓冲区，则不需要每一帧从CPU传递数据到GPU，仅仅在变动时候才需要传递，能够有效降低set pass call
CBUFFER_START(UnityPerMaterial)
	// 将_BaseColor放入特定的常量内存缓冲区
	float4 _BaseColor;															
CBUFFER_END
```
若需要配合GPUInstancing则需要改写为
```Cpp
UNITY_INSTANCING_BUFFER_START(UnityPerMaterial)
	// 把所有实例的_BaseColor以数组的形式声明并放入内存缓冲区
	UNITY_DEFINE_INSTANCED_PROP(float4, _BaseColor)								
UNITY_INSTANCING_BUFFER_END(UnityPerMaterial)
```

## SRPBatcher合批原理

采用动静分离策略，将低频和高频更新的数据放到不同的地方进行更新。
![[（图解5）SRP Batcher 渲染工作流程.png|560]]

标准流程和SRPBatcher流程的区别：
![[（图解6）标准流程和SRPBatcher流程的区别.png|460]]


参考文章：
[Unity ConstantBuffer的一些解析和注意 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/137455866)
[对艺术家的SRP Batcher的简单理解。 - 知乎 (zhihu.com)](https://zhuanlan.zhihu.com/p/156858564)
[SRP Batcher: Speed up your rendering | Unity Blog](https://blog.unity.com/engine-platform/srp-batcher-speed-up-your-rendering)
