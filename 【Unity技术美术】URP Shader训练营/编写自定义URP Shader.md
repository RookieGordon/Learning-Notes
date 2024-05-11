---
tags:
  - Unity
  - URP
  - Shader
---

# 无光照Shader

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

定义`LightMode`标签为[[URP Shader中的Pass通道#URP渲染管线|ShadowCaster]]。

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


# 漫反射Shader

# BlinnPhong Shader

# URP光照
