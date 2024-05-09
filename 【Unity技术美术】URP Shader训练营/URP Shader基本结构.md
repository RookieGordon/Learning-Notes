---
tags:
  - Unity
  - Shader
  - URP
---
# 基本框架

Unity Shader的基本模板如下：
```Cpp
Shader "Custom/BasicShader"  
{  
    // 通过材质面板传入的属性  
    Properties {}  
  
    // 子着色器（根据硬件不同，启用不同的SubShader）  
    SubShader {} 
	// 子着色器（根据硬件不同，启用不同的SubShader）  
    SubShader {} 
    // 故障情况下，最保守的内置shader路径  
    Fallback "Hidden/Universal Render Pipeline/FallbackError"  
}
```

不同的SubShader，用来代表不同的渲染级别，和硬件相关联。通过设置LOD，来微调不同硬件上的着色器性能。Shader代码块中，必须将子着色器按 LOD 降序排列。

```Cpp
SubShader  
{  
	LOD 200  
    Pass  {...}  
}  

SubShader  
{  
    LOD 100  
    Pass{...}  
}
```

可以在C#中，使用 [Shader.maximumLOD](https://docs.unity3d.com/cn/2023.2/ScriptReference/Shader-maximumLOD.html)和[Shader.globalMaximumLOD](https://docs.unity3d.com/cn/2023.2/ScriptReference/Shader-globalMaximumLOD.html)来设置Shader的渲染级别。

子着色器用于将 Shader 对象分成多个部分，分别兼容不同的硬件、渲染管线和运行时设置。一个子着色器包含：
- 有关此子着色器与哪些硬件、渲染管线和运行时设置兼容的信息
- 子着色器标签，这是提供有关子着色器的信息的键值对
- 一个或多个通道
# Shader中的Pass

SubShader中的每个pass都代表进行一次渲染。在 `Pass` 代码块中，您可以：
- 使用 Name 代码块为通道指定一个名称。请参阅 [ShaderLab：为通道指定名称](https://docs.unity3d.com/cn/2023.2/Manual/SL-Name.html)。
- 使用 Tags 代码块将数据的键值对分配给通道。请参阅 [ShaderLab：为通道分配标签](https://docs.unity3d.com/cn/2023.2/Manual/SL-PassTags.html)。
- 使用 ShaderLab 命令执行操作。请参阅 [ShaderLab：使用命令](https://docs.unity3d.com/cn/2023.2/Manual/shader-shaderlab-commands.html)。
- 使用着色器代码块将着色器代码添加到通道。请参阅 [ShaderLab：着色器代码块](https://docs.unity3d.com/cn/2023.2/Manual/shader-shaderlab-code-blocks.html)。

```Cpp
// 子着色器（根据硬件不同，启用不同的SubShader）  
SubShader  
{  
    pass  
    {  
        HLSLPROGRAM  
        // 引入Unity中的内置功能  
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"  
        #pragma vertex vert  
        #pragma fragment frag  
        // 顶点数据  
        struct appdata  
        {  
            float3 pos: POSITION;  
        }; 
        // 经过顶点着色器和固定管线阶段后，传入片元着色器的像素数据  
        struct v2f  
        {  
            float4 pos: SV_POSITION;   
        };  
        
        v2f vert(appdata IN)  
	    { 
		    v2f OUT = (v2f)0;  
            // UNITY_MATRIX_MVP是Unity预定义的MVP矩阵，在Core.hlsl文件中  
            OUT.pos = mul(UNITY_MATRIX_MVP, float4(IN.pos, 1));  
            return OUT;  
        }
        
        float4 frag(v2f IN): SV_TARGET  
        {  
            return float4(1,0,0,1);  
        }      
          
        ENDHLSL  
    }
```

使用HLSLPROGRAM和ENDHLSL包裹代码，代表一个着色器代码块，提交到GPU进行执行。

Core.hlsl定义了Unity中常用的功能和变量，UNITY_MATRIX_MVP宏就定义在其中。

用#pragma定义[[渲染管线#架构梳理|顶点着色器和片元着色器]]。

ShaderLab中，字段的定义格式为：`字段类型 字段名: 字段语义` ，[着色器语义](https://docs.unity3d.com/cn/2023.2/Manual/SL-ShaderSemantics.html)用于表明变量的“意图”，告诉计算机，如何填充或者解释字段值。 

# Properties属性

Properties可以定义通过材质面板传入的属性（比如颜色、贴图，数值等等） 

## 属性语法

>Name(display name, property Type) = DefaultValue

着色器中的每个属性均通过 **name** 引用（在 Unity 中，着色器属性名称通常以下划线开头）。属性在材质检视面板中将显示为 **display name**。每个属性都在等号后给出默认值：
- 对于 _Range_ 和 _Float_ 属性，默认值仅仅是单个数字
- 对于 _Color_ 和 _Vector_ 属性，默认值是括在圆括号中的四个数字，例如“(1,0.5,0.2,1)”
- 对于 2D 纹理，默认值为空字符串或内置默认纹理之一：“white”（RGBA：1,1,1,1）
- 对于非 2D 纹理（立方体、3D 或 2D 数组），默认值为空字符串。如果材质未指定立方体贴图/3D/数组纹理，则使用灰色（RGBA：0.5,0.5,0.5,0.5）。

![[（图解1）Perperties属性与面板显示.png|350]]

其他详见：[ShaderLab：Properties - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2019.4/Manual/SL-Properties.html)

## 属性的使用

在着色器的固定函数部分中，[可使用括在方括号中的属性名称来访问属性值：**[name]**](https://docs.unity3d.com/cn/2019.4/Manual/SL-PropertiesInPrograms.html)。例如，可通过声明两个整数属性（例如_SrcBlend和_DstBlend）来使混合模式由材质属性驱动，然后让 [Blend 命令](https://docs.unity3d.com/cn/2019.4/Manual/SL-Blend.html)使用它们：`Blend [_SrcBlend] [_DstBlend]`。

例如，以下着色器属性：
```
_MyVector ("Some Vector", Vector) = (0,0,0,0) 
_MyFloat ("My float", Float) = 0.5 
```
可通过如下 Cg/HLSL 代码进行声明以供访问：
```
float4 _MyVector;
float _MyFloat; 
```
Cg/HLSL 还可以接受 **uniform** 关键字，但该关键字并不是必需的：`uniform float4 _MyColor`

ShaderLab 中的属性类型以如下方式映射到 Cg/HLSL 变量类型：
- Color 和 Vector 属性映射到 **float4**、**half4** 或 **fixed4** 变量。
- Range 和 Float 属性映射到 **float**、**half** 或 **fixed** 变量。
- 对于纹理来说，一般映射到两个变量：纹理变量和纹理采样变量
	- 对于普通 (2D) 纹理，纹理映射到**TEXTURE2D** 变量，采样映射到**sampler2D**变量
	- 立方体贴图 (Cubemap) ，纹理映射到**TEXTURECUBE**变量，采样映射到**samplerCUBE**
	- 3D 纹理，纹理映射到**TEXTURE3D**变量，采样映射到**sampler3D**

详见：[使用 Cg/HLSL 访问着色器属性 - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2019.4/Manual/SL-PropertiesInPrograms.html)

### 采样器

#### 耦合的纹理采样器

对于纹理采样器，在DX9中，使用耦合的纹理和采样器，一般写作：
```Cpp
sampler2D _MainTex; // ... 
half4 color = tex2D(_MainTex, uv);
```

在DX11中，也使用耦合的纹理和采样器，但需要通过一个特殊的命名约定来让它们匹配：名称为`sampler+其他`格式的采样器将从该纹理中获取采样状态。

以上部分中的着色器代码片段可以用 DX11 风格的 HLSL 语法重写，并且也会执行相同的操作：
```
TEXTURE2D(_MainTex);
SAMPLER(sampler_MainTex); //"sampler"+"_MainTex"
// ...
half4 color = _MainTex.Sample(sampler_MainTex, uv);
```

#### 单独的纹理采样器与内联采样器

使用单独的纹理和采样器，可以 "重复使用 "其他纹理的采样器，同时对多个纹理进行采样，使用`SamplerState`关键字。

内联采样器除了可以采样多个纹理，还可以根据变量名，使用特定的采样模式，无需修改纹理资源的采样模式

如果为单独的采样器，则变量命名规范为：`“sampler”+其他`
如果为内联采样器，则命名规范为：`纹理Filter类型+Wrap类型+其他`，如PointClampSampler
*“Compare”（可选）设置用于深度比较的采样器；与 HLSL SamplerComparisonState 类型和 SampleCmp/SampleCmpLevelZero 函数配合使用。*

```Cpp
Texture2D _MainTex; 
Texture2D _SecondTex; 
Texture2D _ThirdTex; 
SamplerState sampler_MainTex; //"sampler"+"_MainTex" 
// ... 
half4 color = _MainTex.Sample(sampler_MainTex, uv); 
color += _SecondTex.Sample(sampler_MainTex, uv); 
color += _ThirdTex.Sample(sampler_MainTex, uv);
```
同时，Unity提供了几个宏定义来帮助我们定义贴图和采样器，并且能够兼容所有平台:
```Cpp
UNITY_DECLARE_TEX2D(_MainTex); 
UNITY_DECLARE_TEX2D_NOSAMPLER(_SecondTex); UNITY_DECLARE_TEX2D_NOSAMPLER(_ThirdTex); 
// ... 
half4 color = UNITY_SAMPLE_TEX2D(_MainTex, uv); 
color += UNITY_SAMPLE_TEX2D_SAMPLER(_SecondTex, _MainTex, uv); 
color += UNITY_SAMPLE_TEX2D_SAMPLER(_ThirdTex, _MainTex, uv);
```
使用内置宏，需要包含”HLSLSupport.cginc“文件，详见：[内置着色器 include 文件 - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2023.2/Manual/SL-BuiltinIncludes.html)。不过内置宏，只是定义的单独的采样器，而非内联采样器。

详见：[使用采样器状态 - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2023.2/Manual/SL-SamplerStates.html)

## 使用脚本从外部控制属性

### 通过Material控制属性

Material中的`SetColor`，`SetFloat`，`SetInteger`，`SetTexture`等方法，可以在运行时修改具体某个材质上的着色器的属性。

如果是对sharedMaterial进行操作，则会修改所有使用该材质的对象，并且该修改时永久性的，所以一般用于编辑器操作

### 通过Shader控制属性

通过Shader的静态方法，可以全局修改指定属性（可以存在于不同Shader中）。注意，通过这种方式修改的属性，不能被定义在 `Properties`代码块中。但是，这种修改也是会永久生效的。

因为CPU与GPU通信存在比较大的开销，一般需要频繁传值的时候，倾向于将数据打包一起传过去，详见：[[Unity3D]降低向Shader中传值的开销 - oayx - 博客园 (cnblogs.com)](https://www.cnblogs.com/lancidie/p/7832933.html)

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

2. 着色器必须在名为`UnityPerMaterial`的单个常量缓冲区中声明所有材质属性
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

>[!Attention]
> GPUInstance与SRP Batcher是不兼容的
