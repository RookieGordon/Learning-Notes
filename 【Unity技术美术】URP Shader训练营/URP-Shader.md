---
tags:
  - URP
  - Shader
---
# URP-Shader中的命名规范

不同于内置管线的shader写法，URP中，vertex和fragment着色器的命名规则为：光照模型+Pass+着色器类型。顶点数据变量一般为：Attribute，偏移着色器输入变量为：Varying

Attribute和Varying中的position变量一般加上后缀表示顶点数据位于哪个空间（OS—模型空间，WS—世界坐标系，VS—视图空间，CS—裁剪空间）。

# URP中的SRPBatcher合批

SRP Batcher并没有实际减少Draw Calls，而是优化提升了调用Draw Calls前的大量的工作效率。所以后面SRP Batching的优化drawcalls，改成优化了batches。也就是将它们调用drawcalls的设置工作量合并批处理了。

适用前提：
- 需要是同一个shader变体，可以是不同的材质球，项目需要使用自定义渲染管线，Shader代码必须兼容SRP Batcher。
	要使自定义着色器与 SRP Batcher 兼容，它必须满足以下要求：

- 着色器必须在一个名为 的常量缓冲区中声明所有内置引擎属性。例如，或 。`UnityPerDraw``unity_ObjectToWorld``unity_SHAr`
- 着色器必须在名为 的单个常量缓冲区中声明所有材质属性。`UnityPerMaterial`

- 不能使用材质球属性块（MaterialPropertyBlock）
- 渲染的物体必须是一个mesh或者skinned mesh，不能是粒子。