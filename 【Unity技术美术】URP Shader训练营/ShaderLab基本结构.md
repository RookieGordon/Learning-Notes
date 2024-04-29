---
tags:
  - Unity
  - Shader
  - ShaderLab
---
Unity Shader的基本模板如下：
```Cpp
Shader "Custom/BasicShader"  
{  
    // 通过材质面板传入的属性  
    Properties {}  
  
    // 子着色器（根据硬件不同，启用不同的SubShader）  
    SubShader {}  
    // 故障情况下，最保守的内置shader路径  
    Fallback "Hidden/Universal Render Pipeline/FallbackError"  
}
```

SubShader中的每个pass都代表进行一次渲染。

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
        {            v2f OUT = (v2f)0;  
            // UNITY_MATRIX_MVP是Unity预定义的MVP矩阵，在Core.hlsl文件中  
            OUT.pos = mul(UNITY_MATRIX_MVP, float4(IN.pos, 1));  
  
            return OUT;  
        }        float4 frag(v2f IN): SV_TARGET  
        {  
            return float4(1,0,0,1);  
        }        ENDHLSL  
    }
```

ShaderLab中，字段的定义格式为：`字段类型 字段名: 字段语义` ， 