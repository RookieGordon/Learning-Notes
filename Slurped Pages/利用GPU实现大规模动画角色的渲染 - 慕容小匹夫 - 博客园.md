---
source: https://www.cnblogs.com/murongxiaopifu/p/7250772.html
tags:
  - Slurp/Unity/GPU-Animation
  - Slurp/Unity/GPU-Instancing
  - Slurp/Unity/动画烘焙
  - Slurp/Unity/骨骼动画
  - Slurp/Unity/动画蒙皮
---
本文就来聊聊利用GPU实现角色的动画效果，减少CPU端的蒙皮开销；同时将渲染10，000个带动画的模型的Draw Call从10，000+减少到22个。
![|580](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730135713240-1541635925.jpg)

# 0x00 前言

我想很多开发游戏的小伙伴都希望自己的场景内能渲染越多物体越好，甚至是能同时渲染成千上万个有自己动作的游戏角色就更好了。  
但不幸的是，渲染和管理大量的游戏对象是以牺牲CPU和GPU性能为代价的，因为有太多Draw Call的问题，如果游戏对象有动画的话还会涉及到cpu的蒙皮开销，最后我们必须找到其他的解决方案。那么本文就来聊聊利用GPU实现角色的动画效果，减少CPU端的蒙皮开销；同时将渲染10，000个带动画的模型的Draw Call从10，000+减少到22个。（模型来自： [RTS Mini Legion Footman Handpainted](https://www.assetstore.unity3d.com/en/#!/content/86576) ）

![|1160](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134701115-179265843.gif)

# 0x01 Animator和SkinnedMeshRender的问题

正常情况下，大家都会使用Animator来管理角色的动画，而角色也必须使用SkinnedMeshRender来进行渲染。

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134814677-203550434.gif)

例如在我的测试场景中，默认情况下渲染10,000个带动作的士兵模型，可以看到此时的各个性能指标十分糟糕：CPU 320+ms，DrawCall：8700+。

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134827709-1994108375.png)

因此，可以发现如果要渲染的动画角色数量很大时主要会有以下两个巨大的开销：

- CPU在处理动画时的开销。
- 每个角色一个Draw Call造成的开销。

CPU的这两大开销限制了我们使用传统方式渲染大规模角色的可能性。因此一些替代方案——例如广告牌技术——被应用在这种情况下。但是实事求是的说，在这种情境下广告牌技术的实现效果并不好。  
那么有没有可能让我们使用很少的开销就渲染出大规模的动画角色呢？

其实我们只需要回过头看看造成开销很大的原因，解决方案已经藏在问题之中了。

首先，主要瓶颈之一是角色动画的处理都集中在CPU端。因此一个简单的想法就是我们能否将这部分的开销转移到GPU上呢？因为GPU的运算能力可是它的强项。

其次，瓶颈之二是CPU和GPU之间的Draw Call问题，如果利用批处理（包括Static Batching和Dynamic Batching）或是从Unity5.4之后引入的GPU Instancing就可以解决这个问题。但是，不幸的是这两种技术都不支持动画角色的SkinnedMeshRender。

那么解决方案就呼之欲出了，那就是将动画相关的内容从CPU转移到GPU，同时由于CPU不需要再处理动画的逻辑了，因此CPU不仅省去了这部分的开销而且SkinnedMeshRender也可以替换成一般的Mesh Render，我们就可以很开心的使用GPU Instancing来减少Draw Call了。

# 0x02 Vertex Shader和AnimMap

写过shader的小伙伴可能很清楚，我们可以很方便的在vs中改变网格的顶点坐标。因此，一些简单的动画效果往往可以在vs中实现。例如飘扬的旗帜或者是波浪等等。

![|150](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134901052-665194815.gif)

（来源于bing搜索）

那么我们能否利用vs设置顶点坐标的方式来展现我们的角色动画呢？

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134913896-399852482.gif)

答案当然是可行。只不过和飘扬的旗帜那种简单的效果不同，这次我们不仅仅利用几个简单的vs的属性来实现动画效果，而是将角色的动画信息烘焙成一张贴图供vs使用。

简单来说，我们按照固定的频率对角色动画取样并记录取样点时刻角色网格上各个顶点的位置信息，并利用贴图的纹素的颜色属性（Color(float r, float g, float b, float a)）保存对应顶点的位置（Vector3(float x, float y, float z)）。当然利用颜色属性保存顶点的位置信息时需要考虑到一个小问题，在下文我会再说。

这样该贴图就记录了整个动画时间内角色网格顶点在各个取样点时刻的位置，这个贴图我把它称为AnimMap。  
一个AnimMap的结构就是下图这样的：  
![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134928693-105595121.png)

在实际工程中，AnimMap是这个样子的。水平方向记录网格各个顶点的位置，垂直方向是时间信息。

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730134948162-1477752698.png)

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730135015599-17203322.gif)

上图是将角色的Animator或Animation去掉，将SkinnedMeshRender更换为一般的Mesh Render，只使用AnimMap利用vs来随时间修改顶点坐标实现的动画效果。

到这里我们就完成了将动画效果的实现从CPU转移到GPU运算的目的，可以看到在CPU的开销统计中已经没有了动画相关的内容。但是在渲染的统计中，Draw Call并没有减少，此时渲染8个角色的场景内仍然有10个Draw Call的开销。因此下一步我们就来利用GPU Instancing技术减少Draw Call。

# 0x03 效果不错的GPU Instancing

除了使用批处理，提高图形性能的另一个好办法是使用GPU Instancing（批处理可以合并不同的mesh，而GPU Instancing主要是针对同一个mesh来的）。

GPU Instancing的最大优势是可以减少内存使用和CPU开销。当使用GPU Instancing时，不需要打开批处理，GPU Instancing的目的是一个网格可以与一系列附加参数一起被推送到GPU。要利用GPU Instancing，则必须使用相同的材质，并传递额外的参数到着色器，如颜色，浮点数等。

不过GPU Instancing是不支持SkinnedMeshRender的，也就是正常情况下我们带动画的角色是无法使用GPU Instancing来减少Draw Call的，所以我们必须先完成上一小节的目标，将动画逻辑从CPU转移到GPU后就可以只使用Mesh Render而放弃SkinnedMeshRender了。

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730135035771-1704558609.png)

很多build-in的shader默认是有开启GPU Instancing的选项的，但是我们利用AnimMap实现角色动画效果的shader显然不是build-in，因此需要我们自己开启GPU Instancing的功能。

```C
#pragma multi_compile_instancing//告诉Unity生成一个开启instancing功能的shader variant
...
struct appdata
{
    float2 uv : TEXCOORD0;
    UNITY_VERTEX_INPUT_INSTANCE_ID//用来给该顶点定义一个instance ID
}

v2f vert(appdata v, uint vid : SV_VertexID)
{
    UNITY_SETUP_INSTANCE_ID(v);//让shader的方法可以访问到该instance ID
    ...
}
```

![](https://images2017.cnblogs.com/blog/686199/201707/686199-20170730135100255-2065187080.png)

使用GPU Instancing之后，我们渲染10，000个士兵的Draw Call就从10，000左右降低到20上下了。  
当然，关于GPU Instancing的更多内容各位可以在文末的参考链接中找到。

# 0x04 颜色精度和顶点坐标

还记得之前我说过在利用贴图的纹素的颜色属性保存对应顶点的位置时需要考虑到的一个小问题吗？

是的，那就是颜色的精度问题。

由于现在rgb分别代表了坐标的x、y、z，因此rgb的精度就要好好考虑了。例如rgba32，每个通道只有8位，也就是某一个方向上的位置只有256种可能性，这对位置来说是一个不好的限制。

那么有没有解决方案呢？

当然还是有的。既然这是一个和颜色的精度相关的问题，那么最简单的方案就是增加精度。例如在写本文的时我的Demo就是采用的这种方式，我使用了RGBAHalf这种纹理格式，而它的精度是每个通道16bit。当然，移动平台上渲染大量角色的需求往往对动画的精确程度的要求没有那么高，因此8bit的精度问题应该也不大。

完整的项目可以到这里到这里下载：  
[Render-Crowd-Of-Animated-Characters](https://github.com/chenjd/Render-Crowd-Of-Animated-Characters)
# ref：

【1】 [GPUInstancing](https://docs.unity3d.com/Manual/GPUInstancing.html)  
【2】 [How to take advantage of textures in the vertex shader](http://www.gamasutra.com/blogs/TequilaWorks/20160620/275347/How_to_take_advantage_of_textures_in_the_vertex_shader.php)  
【3】 [GPU Gems 3 Chapter 2. Animated Crowd Rendering](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch02.html)  
【4】题图来自《全面战争：阿提拉》