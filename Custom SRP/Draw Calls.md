---
tags:
  - Unity
  - URP
  - Shader
annotation-target: Draw Calls.pdf
---
# Shaders

## Shader函数

>%%
>```annotation-json
>{"created":"2024-05-25T07:02:54.906Z","text":"一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可","updated":"2024-05-25T07:02:54.906Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":8876,"end":9021},{"type":"TextQuoteSelector","exact":"he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough","prefix":" use half as much as possible. T","suffix":".When not targeting mobile platf"}]}]}
>```
>%%
>*%%PREFIX%%use half as much as possible. T%%HIGHLIGHT%% ==he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough== %%POSTFIX%%.When not targeting mobile platf*
>%%LINK%%[[#^2qgvqyy4vlr|show annotation]]
>%%COMMENT%%
>一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可
>%%TAGS%%
>
^2qgvqyy4vlr

# 批处理

## SPR的批处理

>%%
>```annotation-json
>{"created":"2024-05-25T12:37:52.592Z","text":"SRP批次并没有减少抽取调用的数量，而是使它们更精简。它缓存材质属性在GPU上，所以他们不需要发送每个绘制调用。","updated":"2024-05-25T12:37:52.592Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":23093,"end":23375},{"type":"TextQuoteSelector","exact":"Rather than reducing the amount of draw calls the SRP batches makes them leaner. It cachesmaterial properties on the GPU so they don't have to be sent every draw call. This reduces boththe amount of data that has to be communicated and the work that the CPU has to do per drawcall. ","prefix":" reason for this.Not compatible.","suffix":"But this only works if the shade"}]}]}
>```
>%%
>*%%PREFIX%%reason for this.Not compatible.%%HIGHLIGHT%% ==Rather than reducing the amount of draw calls the SRP batches makes them leaner. It cachesmaterial properties on the GPU so they don't have to be sent every draw call. This reduces boththe amount of data that has to be communicated and the work that the CPU has to do per drawcall.== %%POSTFIX%%But this only works if the shade*
>%%LINK%%[[#^iikguqxho2k|show annotation]]
>%%COMMENT%%
>SRP批次并没有减少抽取调用的数量，而是使它们更精简。它缓存材质属性在GPU上，所以他们不需要发送每个绘制调用。
>%%TAGS%%
>
^iikguqxho2k

>%%
>```annotation-json
>{"created":"2024-05-25T12:44:35.070Z","text":"几个重要的矩阵，是放到`UnityPerDraw`中的","updated":"2024-05-25T12:44:35.070Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":24642,"end":24771},{"type":"TextQuoteSelector","exact":"CBUFFER_START(UnityPerDraw)float4x4 unity_ObjectToWorld;float4x4 unity_WorldToObject;real4 unity_WorldTransformParams;CBUFFER_END","prefix":"als/custom-srp/draw-calls/ 19/43","suffix":"In this case we're required to d"}]}]}
>```
>%%
>*%%PREFIX%%als/custom-srp/draw-calls/ 19/43%%HIGHLIGHT%% 
>==CBUFFER_START(UnityPerDraw)
>float4x4 unity_ObjectToWorld;
>float4x4 unity_WorldToObject;
>real4 unity_WorldTransformParams;
>CBUFFER_END==
> %%POSTFIX%%In this case we're required to d*
>%%LINK%%[[#^nltxai06xk|show annotation]]
>%%COMMENT%%
>几个重要的矩阵，是放到`UnityPerDraw`中的
>%%TAGS%%
>
^nltxai06xk

>%%
>```annotation-json
>{"created":"2024-05-25T12:48:25.712Z","text":"使用`GraphicsSettings.useScriptableRenderPipelineBatching = true`开启SRP Batcher。","updated":"2024-05-25T12:48:25.712Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":25544,"end":25637},{"type":"TextQuoteSelector","exact":"public CustomRenderPipeline () {GraphicsSettings.useScriptableRenderPipelineBatching = true;}","prefix":"r method toCustomRenderPipeline.","suffix":"Negative batches saved.The Stats"}]}]}
>```
>%%
>*%%PREFIX%%r method toCustomRenderPipeline.%%HIGHLIGHT%% 
>==public CustomRenderPipeline () {
>GraphicsSettings.useScriptableRenderPipelineBatching = true;
>}== 
>%%POSTFIX%%Negative batches saved.The Stats*
>%%LINK%%[[#^36xzdt4m45o|show annotation]]
>%%COMMENT%%
>使用`GraphicsSettings.useScriptableRenderPipelineBatching = true`开启SRP Batcher。
>%%TAGS%%
>
^36xzdt4m45o

## 多种颜色

>%%
>```annotation-json
>{"created":"2024-05-25T13:26:43.846Z","text":"创建一个`PerObjectMaterialProperties`组件，用于控制物体材质的`_BaseColor`属性。使用`MaterialPropertyBlock`对象来修改物体Renderer组件使用的着色器的`Properties`属性。","updated":"2024-05-25T13:26:43.846Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":27539,"end":27703},{"type":"TextQuoteSelector","exact":"public class PerObjectMaterialProperties : MonoBehaviour {static int baseColorId = Shader.PropertyToID(\"_BaseColor\");[SerializeField]Color baseColor = Color.white;}","prefix":"gine;[DisallowMultipleComponent]","suffix":"PerObjectMaterialProperties comp"}]}]}
>```
>%%
>*%%PREFIX%%gine;[DisallowMultipleComponent]%%HIGHLIGHT%% 
>==public class PerObjectMaterialProperties : MonoBehaviour {
>static int baseColorId = Shader.PropertyToID("_BaseColor");
>[SerializeField]Color baseColor = Color.white;
>}== 
>%%POSTFIX%%PerObjectMaterialProperties comp*
>%%LINK%%[[#^afkh0yp1tjf|show annotation]]
>%%COMMENT%%
>创建一个`PerObjectMaterialProperties`组件，用于控制物体材质的`_BaseColor`属性。使用`MaterialPropertyBlock`对象来修改物体Renderer组件使用的着色器的`Properties`属性。但是这样会有一个问题，就是无法应用SPR Batcher。
>%%TAGS%%
>
^afkh0yp1tjf

## GPU Instancing

>%%
>```annotation-json
>{"created":"2024-05-26T08:14:18.795Z","text":"要使用GPU Instancing，需要导入UnityInstancing.hlsl，其所做的就是重新定义一些矩阵相关的宏，数组形式访问。但要实现这一点，它需要知道当前正在渲染的对象的索引。索引是通过顶点数据提供的，因此我们必须提供它。UnityInstancing.hlsl 定义了宏来简化这一过程，但它们假定我们的顶点函数有一个struct参数。","updated":"2024-05-26T08:14:18.795Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":30945,"end":31332},{"type":"TextQuoteSelector","exact":"What UnityInstancing.hlsl does is redefine those macros to access the instanced data arraysinstead. But to make that work it needs to know the index of the object that's currently beingrendered. The index is provided via the vertex data, so we have to make it available.UnityInstancing.hlsl defines macros to make this easy, but they assume that our vertex functionhas a struct parameter","prefix":"derLibrary/SpaceTransforms.hlsl\"","suffix":".It is possible to declare a str"}]}]}
>```
>%%
>*%%PREFIX%%derLibrary/SpaceTransforms.hlsl"%%HIGHLIGHT%% ==What UnityInstancing.hlsl does is redefine those macros to access the instanced data arraysinstead. But to make that work it needs to know the index of the object that's currently beingrendered. The index is provided via the vertex data, so we have to make it available.UnityInstancing.hlsl defines macros to make this easy, but they assume that our vertex functionhas a struct parameter== %%POSTFIX%%.It is possible to declare a str*
>%%LINK%%[[#^4b9zaqfhsnp|show annotation]]
>%%COMMENT%%
>要使用GPU Instancing，需要导入UnityInstancing.hlsl，其所做的就是重新定义一些矩阵相关的宏，数组形式访问。但要实现这一点，它需要知道当前正在渲染的对象的索引。索引是通过顶点数据提供的，因此我们必须提供它。UnityInstancing.hlsl 定义了宏来简化这一过程，但它们假定我们的顶点函数有一个struct参数。
>%%TAGS%%
>
^4b9zaqfhsnp

>%%
>```annotation-json
>{"created":"2024-05-26T08:24:55.091Z","text":"在`Attributes`属性中加上`UNITY_VERTEX_INPUT_INSTANCE_ID`，同时在`UnlitPassVertex`函数中调用`UNITY_SETUP_INSTANCE_ID(input)`，这样就能正确将对象索引传递给GPU Instancing，并且可以提取出来使用。","updated":"2024-05-26T08:24:55.091Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":32167,"end":32247},{"type":"TextQuoteSelector","exact":"struct Attributes {float3 positionOS : POSITION;UNITY_VERTEX_INPUT_INSTANCE_ID};","prefix":"T_INSTANCE_ID inside Attributes.","suffix":"Next, add UNITY_SETUP_INSTANCE_I"}]}]}
>```
>%%
>*%%PREFIX%%T_INSTANCE_ID inside Attributes.%%HIGHLIGHT%% ==struct Attributes {float3 positionOS : POSITION;UNITY_VERTEX_INPUT_INSTANCE_ID};== %%POSTFIX%%Next, add UNITY_SETUP_INSTANCE_I*
>%%LINK%%[[#^ucn3tdi4jyc|show annotation]]
>%%COMMENT%%
>在`Attributes`属性中加上`UNITY_VERTEX_INPUT_INSTANCE_ID`，同时在`UnlitPassVertex`函数中调用`UNITY_SETUP_INSTANCE_ID(input)`，这样就能正确将对象索引传递给GPU Instancing，并且可以提取出来使用。
>%%TAGS%%
>
^ucn3tdi4jyc
