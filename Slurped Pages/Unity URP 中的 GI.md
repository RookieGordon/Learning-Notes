---
link: https://zhuanlan.zhihu.com/p/684579536
site: 知乎专栏
excerpt: 记录一下 Unity 中的 GI 系统在 Unity URP Shader 中的使用 OverviewGI 包括静态 GI 和动态 GI，静态
  GI 由 Baked GI System 贡献，动态 GI 由 Enlighten Lighting System 贡献 将场景的 Lighting
  Mode 设置为 Sha…
tags:
  - slurp/unity
slurped: 2024-05-21T10:08:56.173Z
title: Unity URP 中的 GI
---

记录一下 Unity 中的 GI 系统在 Unity URP Shader 中的使用

### Overview

GI 包括静态 GI 和动态 GI，静态 GI 由 Baked GI System 贡献，动态 GI 由 Enlighten Lighting System 贡献

将场景的 Lighting Mode 设置为 Shadowmask 时，静态物体光照由实时直接光源、Lightmap、实时 Shadowmap 和 Shadowmask 组成；动态物体光照由实时直接光源、LightProbe 和实时 Shadowmap 组成，其中 LightProbe 提供了间接光和阴影

下图的示例场景为在开启了动态 GI 和 静态 GI，Shadowmask 的 LightMode，Forward 渲染路径下。主光源方向光为 Mixed，其余点光源均为 Baked；有一个 LightProbeGroup 和 三个 ReflectionProbe；可以看到烘焙得到了三张 Lightmap，分别为 dir、light 和 shadowmask，以及三个 ReflectionProbe 对应的 Cubemap 和一个默认的 Cubemap。

![](https://pic2.zhimg.com/v2-9e9ee4c683ee2ce1490f104dad546165_b.jpg)

### URP Shader

对于示例中的动态物体-球，和静态物体-立方体相比，其渲染时的Keyword 少了 `LIGHTMAP_ON` 和 `DYNAMICLIGHTMAP_ON`

**Sphere**

![](https://pic3.zhimg.com/v2-47fb586fa843b68200ef41bd0b16d3a2_b.jpg)

**Cube**

![](https://pic4.zhimg.com/v2-9411121251c0b3cd7ee8c1a469ccec0b_b.jpg)

### Dynamic Object - Sphere

### 间接光照

对于球的 GI，在 Vertex Shader 中，主要在这一行，输出 SH，使用球谐函数进行 GI 计算，对应 `SampleSHVertex`