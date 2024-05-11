---
tags:
  - Unity
  - URP
  - Shader
---

# 无光照Shader

```hlsl
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
```

使用`Toggle`属性特性，定义一个宏变量`_ALPHATEST_ON`（名称固定），用于控制是否启用Alpha剔除功能。定义一个`Float`类型`_Cutoff`变量（名称固定），用于控制Alpha剔除的阈值。

定义一个`Enum`特性，定义一个变量`_CullMode`用于控制剔除方向。

定义`Cull`标签，可以将变量`_CullMode`作为标签的值，进而可以在外部控制剔除的方向。

使用`shader_feature`将`_ALPHATEST_ON`定义成一个变体。`shader_feature`指令，是Unity中的[[#着色器条件指令]]。

没有将纹理的变量写到`CBUFFER_START`代码块中，是因为第二个阴影pass导入了内置的代码，

这里使用了Unity内置的方法`GetVertexPositionInputs`来将顶点变换到裁剪空间。

## 着色器条件指令
# 漫反射Shader

# BlinnPhong Shader

# URP光照
