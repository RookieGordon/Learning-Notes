---
tags:
  - URP
  - Shader
---
# URP-Shader中的命名规范

不同于内置管线的shader写法，URP中，vertex和fragment着色器的命名规则为：光照模型+Pass+着色器类型。顶点数据变量一般为：Attribute，偏移着色器输入变量为：Varying

Attribute和Varying中的position变量一般加上后缀表示顶点数据位于哪个空间（OS—模型空间，WS—世界坐标系，VS—视图空间，CS—裁剪空间）。

# URP中的SRPBatcher合批