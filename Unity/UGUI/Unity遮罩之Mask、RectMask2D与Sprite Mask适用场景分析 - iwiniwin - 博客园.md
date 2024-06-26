---
link: https://www.cnblogs.com/iwiniwin/p/15191362.html
excerpt: 遮罩，顾名思义是一种可以掩盖其它元素的控件。常用于修改其它元素的外观，或限制元素的形状。比如ScrollView或者圆头像效果都有用到遮罩功能。本系列文章希望通过阅读UGUI源码的方式，来探究遮罩的实现原理，以及通过Unity不同遮罩之间实现方式的对比，找到每一种遮罩的最佳使用场合。
  本文是UGUI
tags:
  - slurp/UGUI
  - slurp/Unity
  - slurp/遮罩
  - slurp/Unity
slurped: 2024-06-26T03:08:40.149Z
title: Unity遮罩之Mask、RectMask2D与Sprite Mask适用场景分析 - iwiniwin - 博客园
---

遮罩，顾名思义是一种可以掩盖其它元素的控件。常用于修改其它元素的外观，或限制元素的形状。比如ScrollView或者圆头像效果都有用到遮罩功能。本系列文章希望通过阅读UGUI源码的方式，来探究遮罩的实现原理，以及通过Unity不同遮罩之间实现方式的对比，找到每一种遮罩的最佳使用场合。

本文是UGUI遮罩系列的第三篇，也是最后一篇。前两篇分别是对Mask和RectMask2D的源码分析，详细解读了它们的原理与实现细节。这次的侧重点是对Mask和RectMask2D做一个对比分析，同时总结一下在Mask和RectMask2D不起作用的场景下如何实现遮罩效果。本文大部分内容建立在读者已了解Mask与RectMask2D原理的基础之上，所以在阅读本文前建议先看下前两篇文章。

1. [【UGUI源码分析】Unity遮罩之Mask详细解读](https://www.cnblogs.com/iwiniwin/p/15131528.html)
2. [【UGUI源码分析】Unity遮罩之RectMask2D详细解读](https://www.cnblogs.com/iwiniwin/p/15170384.html)

本文所做的一些测试与验证均基于Unity2019.4版本

### Mask与RectMask2D对比

##### 1. Mask遮罩的大小与形状依赖于Graphic，而RectMask2D只需要依赖RectTransform

Mask是利用Graphic渲染时修改对应片元的模板值来确定遮罩的大小与形状的，Graphic的形状决定了Mask遮罩的形状。因此缺少Graphic组件，Mask遮罩将会失效。当禁用了对象的Graphic组件，比如Image组件，Unity会有以下警告提示

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201609506-464059544.png)

RectMask2D是利用自己的RectTransform计算出裁剪矩形，然后降低不在矩形内的片元透明度来实现遮罩效果，因此不需要依赖Graphic组件

##### 2. Mask支持圆形或其他形状遮罩， 而RectMask2D只支持矩形

Mask遮罩形状可以更加多样，由于Mask遮罩的形状由Graphic决定，所以利用不同的Graphic可以实现不同形状的遮罩

而RectMask2D通过RectTransform计算裁剪矩形的机制导致它只能支持矩形遮罩，仅在 2D 空间中有效，不能正确掩盖不共面的元素

##### 3. Mask会增加drawcall

除了绘制元素本身所需的1个drawcall以外，Mask还会额外增加2个drawcall。一个用来在绘制元素前修改模板缓冲的值，另一个用来在所有UI绘制完后将模板缓冲的值恢复原样

举个栗子，如下所示的一个UI场景，画布下一个带有Mask组件的panel父节点，其下有一个子节点Image

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201631276-676433325.png)

通过Unity的帧调试器查看渲染过程，共有3次drawcall

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201649693-1148741910.png)

3次drawcall的区别主要在于模板参数的不同。第一次是总是通过（Stencil Comp:Always）模板测试，并将模板值替换（Stencil Pass:Replace）为1（Stencil Ref:1）。第二次是用于绘制Image的。第三次是总是通过（Stencil Comp:Always）模板测试，并将模板值设置为0（Stencil Pass:Zero），即起到擦除模板值的作用。

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201702644-152593914.png)

##### 4. RectMask2D可能会破坏合批

有如下所示的一个测试场景，Panel1和Panel2都是只挂有RectTransform组件的单纯父节点，其下都有一个Image子节点，正常情况下应该可以合批，drawcall应为1

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201716499-2047217404.png)

通过帧调试器查看，确实如此，成功合批，drawcall是1

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201725549-1608236822.png)

此时给Panel1添加一个RectMask2D组件，实现遮罩效果。Panel2保持不变

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201743737-581114142.png)

通过帧调试器查看，drawcall数量是2，原本的合批被破坏了。

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201752879-393281710.png)

由此，网上查到的一些资料会得出“RectMask2D节点下的所有孩子都不能与外界UI节点合批且多个RectMask2D之间不能合批”的结论，实际上这是一种不严谨的说法，甚至是错误的。要搞清楚这个问题，需要先弄明白为什么RectMask2D会破坏合批？

通过帧调试器可以发现，是RectMask2D传递裁剪矩形时，修改了Shader的参数，导致不能合批。从下图可以看到2次drawcall的区别就在于_ClipRect不同

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201900049-101851739.png)

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201909527-1673805261.png)

既然是裁剪矩形参数不同导致不能合批，那如果将两个裁剪矩形参数设置为一致是不是就能合批了呢？动手验证一下，给Panel1和Panel2都添加上RectMask2D组件，同时将它们的RectTransform参数设置为完全一致（这样可以保证裁剪矩形参数相同），然后把Panel1的子节点Image往左移，Panel2的子节点Image往右移，让它们都能显示出来。最终效果如下图所示

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201922761-1224382023.png)

再次测试后可以看到drawcall只有1次了，_ClipRect是相同的值。因此可以得出结论，RectMask2D确实由于裁剪矩形参数的设置会破坏合批，但不是一定的。在满足条件时，RectMask2D节点下的孩子也能与外界UI节点合批，多个RectMask2D之间也是能合批的。

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201933264-5589666.png)

##### 5. Mask与RectMask2D用哪个？

Mask的实现利用了模板缓冲区，会增加2个drawcall，性能会受到一定影响。简单的UGUI界面，还是建议使用RectMask2D，相对来说性能更强，也无需额外的绘制调用。但由于RectMask2D也有可能破坏合批，在复杂的情况下，并没有确切的结论来判断哪个更优，只能利用工具实际测试找到最优者，具体问题具体分析才是正确做法。当然，诸如圆形遮罩等一些RectMask2D无法胜任的场景，还是要使用Mask

### 粒子系统实现遮罩效果

游戏的UI界面也经常会添加粒子效果，有时也会需要对粒子添加遮罩。Mask和RectMask2D只适用于UGUI，对粒子系统无法生效。此时可以使用SpriteMask。SpriteMask的原理与Mask相同，都是基于模板测试实现。

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201948329-1468195094.png)

粒子系统的Renderer模块有对应的Mask属性设置，可以调整粒子在精灵遮罩外部和内部的可见性

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826201955334-377802407.png)

### MeshRenderer实现遮罩效果

UI界面添加的一些特效也有可能是MeshRenderer实现的，例如利用Shader制作的顶点动画。但MeshRenderer没有提供Mask相关设置，无法使用遮罩。好在基于模板测试实现遮罩的原理都是相同的，可以自己动手修改MeshRenderer使用的材质，在Shader中添加[ShaderLab模板配置](https://docs.unity3d.com/cn/2019.4/Manual/SL-Stencil.html)来使用模板测试

需要添加到Shader中的代码如下所示

```
Properties
{
    _StencilComp ("Stencil Comparison", Float) = 8
    _Stencil ("Stencil ID", Float) = 0
    _StencilOp ("Stencil Operation", Float) = 0
    _StencilWriteMask ("Stencil Write Mask", Float) = 255
    _StencilReadMask ("Stencil Read Mask", Float) = 255
}

Stencil
{
    Ref [_Stencil]
    Comp [_StencilComp]
    Pass [_StencilOp]
    ReadMask [_StencilReadMask]
    WriteMask [_StencilWriteMask]
}
```

添加完成后，材质界面会多出模板相关的配置，如下所示

![](https://img2020.cnblogs.com/blog/1673734/202108/1673734-20210826202005767-1624061816.png)

再配合SpriteMask，修改对应的模板参数，就可以模拟遮罩效果了。例如

- Stencil Comparison设置为3，就相当于"Visible Inside Mask"
- Stencil Comparison设置为6，就相当于"Visible Outside Mask"
- Stencil Comparison设置为8，就相当于"No Masking"

### 参考

- [【Unity源码学习】遮罩：Mask与Mask2D](https://zhuanlan.zhihu.com/p/136505882)
- [源码探析Mask、Rect Mask2D与Sprite Mask的异同](http://blog.renkaikai.com/article/mask)
- [UI上的特效的裁剪问题](https://duanyiliang.com/2020/11/05/unity_particlesystem_mask/)