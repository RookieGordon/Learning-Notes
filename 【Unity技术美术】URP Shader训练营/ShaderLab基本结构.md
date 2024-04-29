---
tags:
  - Unity
  - Shader
  - ShaderLab
---
# ShaderLab的基本框架

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

对于纹理采样器，在DX9中，使用耦合的纹理和采样器，一般写作：
```Cpp
sampler2D _MainTex; // ... 
half4 color = tex2D(_MainTex, uv);
```

在DX11中，使用单独的纹理和采样器，但需要通过一个特殊的命名约定来让它们匹配：名称为`“sampler”+TextureName`格式的采样器将从该纹理中获取采样状态。
以上部分中的着色器代码片段可以用 DX11 风格的 HLSL 语法重写，并且也会执行相同的操作：
```
Texture2D _MainTex;
SamplerState sampler_MainTex; //"sampler"+"_MainTex"
// ...
half4 color = _MainTex.Sample(sampler_MainTex, uv);
```

详见：[使用 Cg/HLSL 访问着色器属性 - Unity 手册 (unity3d.com)](https://docs.unity3d.com/cn/2019.4/Manual/SL-PropertiesInPrograms.html)