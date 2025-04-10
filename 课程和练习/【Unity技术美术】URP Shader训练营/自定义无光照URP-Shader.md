---
tags:
  - Unity
  - URP
  - Shader
---


````hlsl
Shader "Custom/Unlit/BasicUnlitShader"  
{  
    Properties  
    {  
        [MainTexture] _BaseMap ("Main Texture", 2D)= "white"{}  
        [MainColor] _BaseColor ("Base Colore", Color) = (1,1,1,1)  
        // 定义一个宏开关  
        [Toggle(_ALPHATEST_ON)] _AlphaTest("Aplpha Test", int) = 0  
        _Cutoff("Aplha test value", Range(0,1)) = 0  
        [Enum(Off,0, Front,1, Back,2)] _CullMode("Cull Mode", int) = 2  
    }  
  
    SubShader  
    {  
        Tags  
        {  
            "RenderPipeline" = "UniversalPipline"  
            "RenderType" = "Opaque"  
            "Queue" = "Geometry"  
        }  
  
        HLSLINCLUDE  
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"  
        CBUFFER_START(UnityPerMaterial)  
            float4 _BaseColor;  
            float4 _BaseMap_ST;  
            float _Cutoff;  
        CBUFFER_END  
        ENDHLSL  
        
        Pass        
        {  
            Name "Custom Basic Unlit"  
  
            // 将变量作为标签的值  
            Cull [_CullMode]  
  
            HLSLPROGRAM  
            #pragma vertex ShadowCasterPassVertex  
            #pragma fragment UnitPassFragment  
            // 变体开关  
            #pragma shader_feature _ALPHATEST_ON  
  
            TEXTURE2D(_BaseMap);  
            SAMPLER(sampler_BaseMap);  
  
            struct Attribute  
            {  
                float4 posOS: POSITION;  
                float2 uv : TEXCOORD0;  
                float4 vertexColor: COLOR;  
            };  
            struct Varying  
            {  
                float4 posCS: SV_POSITION;  
                float2 uv: TEXCOORD0;  
                float4 vertexColor: COLOR;  
            };  
            Varying ShadowCasterPassVertex(Attribute IN)  
            {                Varying OUT = (Varying)0;  
  
                VertexPositionInputs inputs = GetVertexPositionInputs(IN.posOS.xyz);  
                OUT.posCS = inputs.positionCS;  
  
                OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap);  
  
                OUT.vertexColor = IN.vertexColor;  
  
                return OUT;  
            }  
            float4 UnitPassFragment(Varying IN): SV_Target  
            {  
                float4 texColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv);  
  
                #ifdef _ALPHATEST_ON  
                    clip(texColor.a - _Cutoff);  
                #endif  
  
                return texColor * _BaseColor * IN.vertexColor;  
            }           
             ENDHLSL  
        }  
  
        // 这里如果直接使用Unity引擎自带的阴影Pass，会导致SRP Batcher失败  
        // UsePass "Universal Render Pipeline/Lit/SHADOWCASTER"  
  
        Pass  
        {  
            Name "Custom Basic ShadowCaster"  
            Tags  {  "LightMode" = "ShadowCaster"  }  
  
            //需要写入深度值，但是不需要写入颜色值  
            ZWrite On  
            ZTest LEqual            
            ColorMask 0  
            Cull [_CullMode]  
  
            HLSLPROGRAM  
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"  
            #include "Packages/com.unity.render-pipelines.universal/Shaders/ShadowCasterPass.hlsl"  
  
            #pragma vertex ShadowPassVertex  
            #pragma fragment ShadowPassFragment  
  
            #pragma shader_feature _ALPHATEST_ON  
            // 使用abledo纹理的alpha作为平滑度使用  
            #pragma shader_feature _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A  
  
            // 支持GPU instance  
            #pragma multi_compile_instancing  
  
            // 用于顶点着色器阶段的变体  是否支持局部光  
            #pragma multi_compile_vertex _ _CASTING_PUNCTUAL_LIGHT_SHADOW  
            ENDHLSL  
        }  
  
        Pass  
        {  
            Name "DepthOnly"  
            Tags  {  "LightMode" = "DepthOnly"  }  
            ZWrite On  
            ZTest LEqual            
            ColorMask 0  
  
            HLSLPROGRAM  
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"  
            #include "Packages/com.unity.render-pipelines.universal/Shaders/DepthOnlyPass.hlsl"  
  
            #pragma vertex DepthOnlyVertex  
            #pragma fragment DepthOnlyFragment  
  
            #pragma shader_feature _ALPHATEST_ON  
            // 使用abledo纹理的alpha作为平滑度使用  
            #pragma shader_feature _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A  
  
            // 支持GPU instance  
            #pragma multi_compile_instancing  
            ENDHLSL  
        }  
  
        Pass  
        {  
            Name "DepthNormals"  
            Tags  {  "LightMode" = "DepthNormalsOnly"  }  
            ZWrite On  
            ZTest LEqual  
            
            HLSLPROGRAM            
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"  
            #include "Packages/com.unity.render-pipelines.universal/Shaders/DepthNormalsPass.hlsl"  
  
            #pragma vertex DepthNormalsVertex  
            #pragma fragment DepthNormalsFragment  
  
            #pragma shader_feature_local _NORMAL_MAP  
            #pragma shader_feature _ALPHATEST_ON  
            // 使用abledo纹理的alpha作为平滑度使用  
            #pragma shader_feature _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A  
  
            // 支持GPU instance  
            #pragma multi_compile_instancing  
            ENDHLSL  
        }  
    }
}
````

使用`Toggle`属性特性，定义一个宏变量`_ALPHATEST_ON`（名称固定），用于控制是否启用Alpha剔除功能。定义一个`Float`类型`_Cutoff`变量（名称固定），用于控制Alpha剔除的阈值。

定义一个`Enum`特性，定义一个变量`_CullMode`用于控制剔除方向。

## 无光照Pass

第一个pass实现了简单的无光照条件下的渲染，使用主纹理和主颜色混合成物体的颜色。

定义`Cull`标签，可以将变量`_CullMode`作为标签的值，进而可以在外部控制剔除的方向。

使用`shader_feature`将`_ALPHATEST_ON`定义成一个变体。`shader_feature`指令，是Unity中的[[#着色器条件指令]]。

没有将纹理的变量写到`CBUFFER_START`代码块中，是因为第二个阴影pass导入了内置的代码，其中也定义了主纹理变量，导致重复，所以将纹理变量定义在第一个pass中，表示该pass专用的变量。

这里使用了Unity内置的方法`GetVertexPositionInputs`来将顶点变换到裁剪空间。

使用`#ifdef`包裹宏定义`_ALPHATEST_ON`，用于开关是否进行Alpha剔除。使用内置`clip`函数，剔除alpha小于给定阈值的片元。

## 阴影Pass

可以直接使用`UsePass`关键字，使用内置的`SHADOWCASTER`pass来实现阴影效果，但是这样会导致SRP Batcher失效。

定义`LightMode`标签为[[URP-Shader中的Pass通道#URP渲染管线|ShadowCaster]]。

由于产生阴影，不需要写入颜色缓冲，只需要写入深度值，因此，开启`ZWrite`和`ZTest`，同时使用[ColorMask 0](https://docs.unity3d.com/cn/2023.2/Manual/SL-ColorMask.html)禁止写入颜色通道。

导入两个hlsl文件，将vertex和fragment着色器定义成和`ShadowCasterPass.hlsl`中着色器名字一致，才能正确使用内置pass。使用Alpha剔除的宏定义之所以定义成固定`_ALPHATEST_ON`，是因为`ShadowCasterPass.hlsl`使用了`AlphaDiscard`函数，该函数需要一个名为`_ALPHATEST_ON`的宏，才能在阴影中，正确生效alpha剔除。

使用`_SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A`变体，开启使用abledo纹理的alpha作为平滑度使用

使用`multi_compile_instancing`开启CPU instance。

使用`_CASTING_PUNCTUAL_LIGHT_SHADOW`支持局部光照，注意，该变体只在顶点着色器阶段生效

## 深度Pass

和阴影pass一样，也是使用Unity提供好的pass。`LightMode`声明为`DepthOnly`。

## 法线Pass

和深度pass一样，也是使用Unity提供好的pass。`LightMode`声明为`DepthNormalsOnly`。这里新增了一个`_NORMAL_MAP`变体。

## 着色器条件指令

### [[图形引擎实战：Unity Shader变体管理流程]]

### [[第9章 着色器编译、分支和变体]]

### [[Shader：优化破解变体的“影分身”之术]]

https://zhuanlan.zhihu.com/p/68888831

可以使用以下着色器指令之一：

| **Shader 指令**    | **分支类型**                                                                                             | **Unity 创建的着色器变体** |
| ---------------- | ---------------------------------------------------------------------------------------------------- | ------------------ |
| `shader_feature` | [静态分支](https://docs.unity3d.com/2023.2/Documentation/Manual/shader-branching.html#static-branching)  | 在构建时启用的关键字组合的变体    |
| `multi_compile`  | 静态分支                                                                                                 | 每种可能的关键字组合的变体      |
| `dynamic_branch` | [动态分支](https://docs.unity3d.com/2023.2/Documentation/Manual/shader-branching.html#dynamic-branching) | 无变体                |

- [静态分支](https://docs.unity3d.com/2023.2/Documentation/Manual/shader-branching.html#static-branching)：着色器编译器在编译时计算条件代码。
- [动态分支](https://docs.unity3d.com/2023.2/Documentation/Manual/shader-branching.html#dynamic-branching)：GPU 在运行时评估条件代码。
- [着色器变体](https://docs.unity3d.com/2023.2/Documentation/Manual/shader-variants.html)：Unity 使用静态分支将着色器源代码编译为多个着色器程序。然后，Unity 使用与运行时条件匹配的着色器程序。

**multi_complie**可以定义多个shader变体，在程序运行时可以通过脚本自由切换，这些变体会占用keyword，keyword在unity shader中是有数量限制的，通常为256个，但是Unity自身已经占用了60多个，所以我们要在使用时特别注意变体的数量，将尽量同一调控的功能代码控制在一个变体中。
可以在脚本中通过`Material.EnableKeyWord`和`Shader.EnableKeyword`来开启某功能，通过`Material.DisableKeyword`和`Shader.DisableKeyword`来关闭某功能。其中Material是针对这个材质进行设定，而shader则是对所用使用这个shader的材质进行设定。

**shader_feature**可以认为是`multi_complie`的子集，其与`multi_complie`最大的不同就是此关键字的声明变体是材质球层级的（`multi_complie`是全局），只能通过美术在制作时调整相应材质，未被选择的变体会在打包的时候被舍弃（`multi_complie`不会），所以其声明的变体是不能通过代码控制的（打包后会出问题）。

### 本地条件指令

默认情况下，关键字是全局的。在着色器指令中添加 \_local，可将关键字设置为本地关键字。如果启用或禁用全局关键字，不会影响同名的本地关键字的状态，例如：`shader_feature_local`

### 将指令局限到某些阶段

声明关键字时，Unity 假定着色器的所有阶段都包含该关键字的条件代码。
您可以添加后缀，表示只有某些阶段包含关键字的条件代码。这有助于 Unity 去除不需要的着色器变量。例如：`_vertex`、`_fragment`、`_hull`、`_geometry`等等