---
tags:
  - Unity
  - URP
  - Shader
---

# 无光照Shader

```Cpp
Shader "Custom/Unlit/BasicUnlitShader"  
{  
    Properties  
    {  
        [MainTexture] _MainTex ("Main Texture", 2D)= "white"{}  
        [MainColor] _BasicColor ("Basic Colore", Color) = (1,1,1,1)  
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
                float4 _BasicColor;  
                TEXTURE2D(_MainTex);  
                SAMPLER(sampler_MainTex);  
                float4 _MainTex_ST;  
            CBUFFER_END  
        ENDHLSL  
        Pass  
        {  
            Name "Custom Unlit"  
            HLSLPROGRAM  
  
            #pragma vertex UnlitPassVertex  
            #pragma fragment UnitPassFragment  
  
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
            Varying UnlitPassVertex(Attribute IN)  
            {                
	            Varying OUT = (Varying)0;  
	            
                VertexPositionInputs inputs = GetVertexPositionInputs(IN.posOS.xyz); 
                 
                OUT.posCS = inputs.positionCS;  
                                OUT.uv = TRANSFORM_TEX(IN.uv, _MainTex);  
  
                OUT.vertexColor = IN.vertexColor;  
  
                return OUT;  
            }  
            float4 UnitPassFragment(Varying IN): SV_Target  
            {  
                float4 texColor = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv);  
                return texColor * _BasicColor * IN.vertexColor;  
            }            
            ENDHLSL  
        }  
    }}
```

# 漫反射Shader

# BlinnPhong Shader

# URP光照
