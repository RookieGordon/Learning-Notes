    

[![](https://zhuanlan.zhihu.com/p/98642798)](javascript:void\(0\))

[](https://www.zhihu.com/)

首发于[游戏码农的自我修养](https://www.zhihu.com/column/samuncle-haircut)

切换模式

写文章

登录/注册

![关于静态批处理/动态批处理/GPU Instancing /SRP Batcher的详细剖析](HTML%20import/Attachments/v2-59aa202bf84300c9b6218a73869b5abe_1440w.image)

# 关于静态批处理/动态批处理/GPU Instancing /SRP Batcher的详细剖析

[![SamUncle](HTML%20import/Attachments/v2-1cdbfcf07644a98948a0daa8b96977f5_l.jpg)](https://www.zhihu.com/people/YeSamUncle)

[SamUncle](https://www.zhihu.com/people/YeSamUncle)

U3D开发

416 人赞同了该文章

## 静态批处理[[1]](https://zhuanlan.zhihu.com/p/98642798#ref_1)

- **定义**

标明为 Static 的静态物件，如果在使用**相同材质球**的条件下，在**Build（项目打包）**的时候Unity会自动地提取这些共享材质的静态模型的[Vertex buffer](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Vertex+buffer&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJWZXJ0ZXggYnVmZmVyIiwiemhpZGFfc291cmNlIjoiZW50aXR5IiwiY29udGVudF9pZCI6MTEwMDUxNzEyLCJjb250ZW50X3R5cGUiOiJBcnRpY2xlIiwibWF0Y2hfb3JkZXIiOjEsInpkX3Rva2VuIjpudWxsfQ.om28vQXYCUMtobhKThZh3FnGlUHDrsERQ6Lx3_ix4hA&zhida_source=entity)和[Index buffer](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Index+buffer&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJJbmRleCBidWZmZXIiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoxMTAwNTE3MTIsImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.E9KdEavRReecrz2lzH44r6MnN0RyAH6-OuXslwjcYVQ&zhida_source=entity)。根据其摆放在场景中的位置等最终状态信息，将这些模型的顶点数据变换到世界空间下，存储在新构建的大Vertex buffer和Index buffer中。并且记录每一个子模型的Index buffer数据在构建的大Index buffer中的起始及结束位置。

![](HTML%20import/Attachments/v2-48b948e088a2310817c67c6530637a95_1440w.jpg)

在后续的绘制过程中，一次性提交整个合并模型的顶点数据，根据引擎的场景管理系统判断各个子模型的可见性。然后设置一次渲染状态，调用多次[Draw call](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Draw+call&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJEcmF3IGNhbGwiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoxMTAwNTE3MTIsImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.hJkGHH7HxkVaInUNBVhMOQQ_stTvI0Q5YZl2T4FfrYE&zhida_source=entity)分别绘制每一个子模型。

![](HTML%20import/Attachments/v2-9e2e1e5df3ad1b37ebe0dc1af4712005_1440w.jpg)

[Static batching](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Static+batching&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJTdGF0aWMgYmF0Y2hpbmciLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoxMTAwNTE3MTIsImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.-NWk7n1LVcB66qt6dtVc73495AZ7dbzYa3cmIJ-veMI&zhida_source=entity)并**不减少Draw call的数量（**但是在编辑器时由于计算方法区别Draw call数量是会显示减少了的[[2]](https://zhuanlan.zhihu.com/p/98642798#ref_2)），但是由于我们预先把所有的子模型的顶点变换到了世界空间下，所以在运行时cpu不需要再次执行顶点变换操作，节约了少量的计算资源，并且这些子模型共享材质，所以在多次Draw call调用之间并没有渲染状态的切换，渲染API（[Command Buffer](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Command+Buffer&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJDb21tYW5kIEJ1ZmZlciIsInpoaWRhX3NvdXJjZSI6ImVudGl0eSIsImNvbnRlbnRfaWQiOjExMDA1MTcxMiwiY29udGVudF90eXBlIjoiQXJ0aWNsZSIsIm1hdGNoX29yZGVyIjoxLCJ6ZF90b2tlbiI6bnVsbH0.oc-Ipv1AOh_Z42beYLYyhky3bEA68OsJP_LFk6umybQ&zhida_source=entity)）会缓存绘制命令，起到了渲染优化的目的 。

但Static batching也会带来一些性能的负面影响。Static batching会导致应用打包之后体积增大，应用运行时所占用的内存体积也会增大。

另外，在很多不同的GameObject引用同一模型的情况下，如果不开启Static batching，GameObject共享的模型会在应用程序包内或者内存中只存在一份，绘制的时候提交模型顶点信息，然后设置每一个GameObjec的材质信息，分别调用渲染API绘制。开启Static batching，在Unity执行Build的时候，场景中所有引用相同模型的GameObject都必须将模型顶点信息复制，并经过计算变化到最终在世界空间中，存储在最终生成的Vertex buffer中。这就导致了打包的体积及运行时内存的占用增大。例如，在茂密的森林级别将树标记为静态会严重影响内存[[3]](https://zhuanlan.zhihu.com/p/98642798#ref_3)。

- **无法参与批处理情况**

1. 改变Renderer.material将会造成一份材质的拷贝，因此会打断批处理，你应该使用Renderer.sharedMaterial来保证材质的共享状态。

- **相同材质批处理断开情况**

1. 位置不相邻且中间夹杂着不同材质的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解。
2. 拥有[lightmap](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=lightmap&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJsaWdodG1hcCIsInpoaWRhX3NvdXJjZSI6ImVudGl0eSIsImNvbnRlbnRfaWQiOjExMDA1MTcxMiwiY29udGVudF90eXBlIjoiQXJ0aWNsZSIsIm1hdGNoX29yZGVyIjoxLCJ6ZF90b2tlbiI6bnVsbH0.bfqSSGDFECAVLWCz4xp9CH2zOyFBQ8Y_B_BuEi_31tc&zhida_source=entity)的物体含有额外（隐藏）的材质属性，比如：lightmap的偏移和缩放系数等。所以，拥有lightmap的物体将不会进行同批处理（除非他们指向lightmap的同一部分）。

- **流程原理**

![](HTML%20import/Attachments/v2-37b225e02afe6dca369647e4a3bf3bd4_1440w.jpg)

---

## 动态批处理[[4]](https://zhuanlan.zhihu.com/p/98642798#ref_4)

- **定义**

在使用**相同材质球**的情况下，Unity会在运行时对于**正在视野中**的符合条件的动态对象在一个Draw call内绘制，所以**会降低Draw Calls**的数量。

Dynamic batching的原理也很简单，在进行场景绘制之前将所有的共享同一材质的模型的顶点信息变换到世界空间中，然后通过一次Draw call绘制多个模型，达到合批的目的。模型顶点变换的操作是由CPU完成的，所以这会带来一些CPU的性能消耗。并且计算的模型顶点数量不宜太多，否则CPU串行计算耗费的时间太长会造成场景渲染卡顿，所以Dynamic batching只能处理一些小模型。

Dynamic batching在降低Draw call的同时会导致额外的CPU性能消耗，所以仅仅在合批操作的性能消耗小于不合批，Dynamic batching才会有意义。而新一代图形API（ Metal、Vulkan）在批次间的消耗降低了很多，所以在这种情况下使用Dynamic batching很可能不能获得性能提升。Dynamic batching相对于Static batching不需要预先复制模型顶点，所以在内存占用和发布的程序体积方面要优于Static batching。但是Dynamic batching会带来一些运行时CPU性能消耗，Static batching在这一点要比Dynamic batching更加高效。

- **无法参与批处理情况**

1. 物件Mesh大于等于900个面。
2. 代码动态改变材质变量后不算同一个材质，会不参与合批。
3. 如果你的着色器使用顶点位置，法线和UV值三种属性，那么你只能批处理300顶点以下的物体；如果你的着色器需要使用顶点位置，法线，UV0，UV1和切向量，那你只能批处理180顶点以下的物体，否则都无法参与合批。
4. 改变Renderer.material将会造成一份材质的拷贝，因此会打断批处理，你应该使用Renderer.sharedMaterial来保证材质的共享状态。

- **批处理中断情况**

1. 位置不相邻且中间夹杂着不同材质的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解。
2. 物体如果都符合条件会优先参与静态批处理，再是GPU Instancing，然后才到动态批处理，假如物体符合前两者，此次批处理都会被打断。
3. GameObject之间如果有镜像变换不能进行合批，例如，"GameObject A with +1 scale and GameObject B with –1 scale cannot be batched together"。
4. 拥有lightmap的物体含有额外（隐藏）的材质属性，比如：lightmap的偏移和缩放系数等。所以，拥有lightmap的物体将不会进行批处理（除非他们指向lightmap的同一部分）。
5. 使用[Multi-pass Shader](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Multi-pass+Shader&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJNdWx0aS1wYXNzIFNoYWRlciIsInpoaWRhX3NvdXJjZSI6ImVudGl0eSIsImNvbnRlbnRfaWQiOjExMDA1MTcxMiwiY29udGVudF90eXBlIjoiQXJ0aWNsZSIsIm1hdGNoX29yZGVyIjoxLCJ6ZF90b2tlbiI6bnVsbH0.82YxzrUXaxOYGDupuBnWWCd0uTopIJOdGQyWmG1oFmA&zhida_source=entity)的物体会禁用Dynamic batching，因为Multi-pass Shader通常会导致一个物体要连续绘制多次，并切换渲染状态。这会打破其跟其他物体进行Dynamic batching的机会。
6. 我们知道能够进行合批的前提是多个GameObject共享同一材质，但是对于[Shadow casters](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Shadow+casters&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJTaGFkb3cgY2FzdGVycyIsInpoaWRhX3NvdXJjZSI6ImVudGl0eSIsImNvbnRlbnRfaWQiOjExMDA1MTcxMiwiY29udGVudF90eXBlIjoiQXJ0aWNsZSIsIm1hdGNoX29yZGVyIjoxLCJ6ZF90b2tlbiI6bnVsbH0.SBJzwSo3Ib-YPXcPff2tPf8j2EF1XJcwmPRRXvwpYLw&zhida_source=entity)的渲染是个例外。仅管Shadow casters使用不同的材质，但是只要它们的材质中给Shadow Caster Pass使用的参数是相同的，他们也能够进行Dynamic batching。
7. Unity的[Forward Rendering Path](https://zhida.zhihu.com/search?content_id=110051712&content_type=Article&match_order=1&q=Forward+Rendering+Path&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NDI5MTQzOTcsInEiOiJGb3J3YXJkIFJlbmRlcmluZyBQYXRoIiwiemhpZGFfc291cmNlIjoiZW50aXR5IiwiY29udGVudF9pZCI6MTEwMDUxNzEyLCJjb250ZW50X3R5cGUiOiJBcnRpY2xlIiwibWF0Y2hfb3JkZXIiOjEsInpkX3Rva2VuIjpudWxsfQ.ZgUAkB7MLfQTgb-YnR7pKoEI7OzEZeOEtESCpiGW0Rg&zhida_source=entity)中如果一个GameObject接受多个光照会为每一个per-pixel light产生多余的模型提交和绘制，从而附加了多个Pass导致无法合批，如下图:

![](./关于静态批处理_动态批处理_GPU%20Instancing%20_SRP%20Batcher的详细剖析%20-%20知乎_files/v2-177f53a633d2eac753abe07805367d4d_1440w.jpg)

可以接收多个光源的shader，在受到多个光源是无法合批

- **流程原理**

![](HTML%20import/Attachments/v2-8c69d718432ba4045155c700fda6f6b6_1440w.jpg)

---

##   
GPU Instancing

- **定义**

在使用**相同材质球、相同Mesh(预设体的实例会自动地使用相同的网格模型和材质)**的情况下，Unity会在运行时对于**正在视野中**的符合要求的所有对象使用**Constant Buffer**[[5]](https://zhuanlan.zhihu.com/p/98642798#ref_5)将其位置、缩放、uv偏移、_lightmapindex_等相关信息保存在显存中的**“统一/常量缓冲器”**[[6]](https://zhuanlan.zhihu.com/p/98642798#ref_6)中，然后从中抽取一个对象作为实例送入渲染流程，当在执行DrawCall操作后，从显存中取出实例的部分共享信息与从GPU常量缓冲器中取出对应对象的相关信息一并传递到下一渲染阶段，与此同时，不同的着色器阶段可以从缓存区中直接获取到需要的常量，不用设置两次常量。比起以上两种批处理，GPU Instancing可以**规避合并Mesh导致的内存与性能上升**的问题，但是由于场景中所有符合该合批条件的渲染物体的信息每帧都要被重新创建，放入“统一/常量缓冲区”中，而碍于缓存区的大小限制，每一个Constant Buffer的大小要严格限制（不得大于64k）。详细请阅读：

[Testplus：U3D优化批处理-GPU Instancing了解一下215 赞同 · 4 评论文章![](HTML%20import/Attachments/v2-b06a0dbdf07544a4d0687a8917611afd_180x120.jpg)](https://zhuanlan.zhihu.com/p/34499251)

- **无法参与加速情况**

1. 缩放为负值的情况下，会不参与加速。
2. 代码动态改变材质变量后不算同一个材质，会不参与加速，但可以通过将颜色变化等变量加入常量缓冲器中实现[[7]](https://zhuanlan.zhihu.com/p/98642798#ref_7)。
3. 受限于常量缓冲区在不同设备上的大小的上限，移动端支持的个数可能较低。
4. 只支持一盏实时光，要在多个光源的情况下使用实例化，我们别无选择，只能切换到延迟渲染路径。为了能够让这套机制运作起来，请将所需的编译器指令添加到我们着色器的延迟渲染通道中。

![](HTML%20import/Attachments/v2-5c97567b099e9d98ca9d957282b1922e_1440w.jpg)

当在多个光源开启GPU Instancing

  

- **批处理中断情况**

1. 位置不相邻且中间夹杂着不同材质的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解。
2. 一个批次超过125个物体（受限于常量缓冲区在不同设备上的大小的上限，移动端数量有浮动）的时候会新建另一个加速流程。
3. 物体如果都符合条件会优先参与静态批处理，然后才到GPU Instancing，假如物体符合前者，此次加速都会被打断。

- **流程原理**

![](HTML%20import/Attachments/v2-0dde54b930bef9c768c10d3c79126e16_1440w.jpg)

---

## SRP Batcher[[8]](https://zhuanlan.zhihu.com/p/98642798#ref_8)

- **定义**

在使用LWRP或者HWRP时，开启SRP Batcher的情况下，只要物体的**Shader中变体**一致，就可以启用SRP Batcher加速。它与上文GPU Instancing实现的原理相近，Unity会在运行时对于正在视野中的符合要求的所有对象使用**“Per Object” GPU BUFFER（一个独立的Buffer）** 将其位置、缩放、uv偏移、_lightmapindex_等相关信息保存在GPU内存中，同时也会将正在视野中的符合要求的所有对象使用**Constant Buffer**[[5]](https://zhuanlan.zhihu.com/p/98642798#ref_5)将材质信息保存在保存在显存中的**“统一/常量缓冲器”**[[6]](https://zhuanlan.zhihu.com/p/98642798#ref_6)中。与GPU Instancing相比，因为数据不再每帧被重新创建，而且需要保存进“统一/常量缓冲区”的数据排除了各自的位置、缩放、uv偏移、_lightmapindex_等相关信息，所以缓冲区内有更多的空间可以**动态地**存储场景中所有渲染物体的材质信息。由于数据不再每帧被重新创建，而是动态更新，所以SRP Batcher的本质并不会降低Draw Calls的数量，它只会降低Draw Calls之间的GPU设置成本。

![](HTML%20import/Attachments/v2-7b93309c00f2866639a2f7c529495608_1440w.jpg)

因为不用重新创建Constant Buffer，所以本质上SRP Batcher不会降低Draw Calls的数量，它只会降低Draw Calls之间的GPU设置成本

- **无法参与加速情况**

1. 对象不可以是粒子或蒙皮网格。
2. Shader中**变体**不一致，如下图两个**相同Shader**的材质，但是因为Surface Options不一致，导致**变体不一样**而无法合并。

![](HTML%20import/Attachments/v2-b0599861b3304d19979816413cb13a43_1440w.jpg)

变体不同的不同材质

  

- **批处理中断情况**

1. 位置不相邻且中间夹杂着**不同Shader**，或者**不同变体**的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解。

- **流程原理**

![](HTML%20import/Attachments/v2-6125b513800939912bb07853ae0a1f90_1440w.jpg)

---

## _**2020年2月13日-更新： 更改对”统一/常量缓冲器“的描述，对SRP Batcher与GPU Instancing的实现原理进行了比较大的修改。**_

  

> _^ ^ 以上只是我工作中的一些小总结_  
> _有什么不正确的地方可以在评论告诉我_  
> _我的微信号是：sam2b2b_  
> _有想一起进步的小伙伴可以加微信逛逛圈_

## 参考

1. [^](https://zhuanlan.zhihu.com/p/98642798#ref_1_0)[https://gameinstitute.qq.com/community/detail/114323](https://gameinstitute.qq.com/community/detail/114323)
2. [^](https://zhuanlan.zhihu.com/p/98642798#ref_2_0)[https://forum.unity.com/threads/regression-feature-not-bug-static-dynamic-batching-combining-v-buffers-but-not-draw-calls.360143/](https://forum.unity.com/threads/regression-feature-not-bug-static-dynamic-batching-combining-v-buffers-but-not-draw-calls.360143/)
3. [^](https://zhuanlan.zhihu.com/p/98642798#ref_3_0)[https://docs.unity3d.com/Manual/DrawCallBatching.html](https://docs.unity3d.com/Manual/DrawCallBatching.html)
4. [^](https://zhuanlan.zhihu.com/p/98642798#ref_4_0)https://gameinstitute.qq.com/community/detail/114323
5. ^[a](https://zhuanlan.zhihu.com/p/98642798#ref_5_0)[b](https://zhuanlan.zhihu.com/p/98642798#ref_5_1)Constant Buffer [https://zhuanlan.zhihu.com/p/35830868](https://zhuanlan.zhihu.com/p/35830868)
6. ^[a](https://zhuanlan.zhihu.com/p/98642798#ref_6_0)[b](https://zhuanlan.zhihu.com/p/98642798#ref_6_1)unity将常量存储在4M的缓冲池里，并每帧循环池（这个池子被绑定到GPU上，可以在截帧工具比如XCode或者Snapdragon上看到）
7. [^](https://zhuanlan.zhihu.com/p/98642798#ref_7_0)[https://blog.csdn.net/lzhq1982/article/details/88119283](https://blog.csdn.net/lzhq1982/article/details/88119283)
8. [^](https://zhuanlan.zhihu.com/p/98642798#ref_8_0)SRP Batcher 官方文档： [https://mp.weixin.qq.com/s/-4Bhxtm_L5paFFAv8co4Xw](https://mp.weixin.qq.com/s/-4Bhxtm_L5paFFAv8co4Xw)

编辑于 2020-02-13 01:02

### 内容所属专栏

[

![游戏码农的自我修养](HTML%20import/Attachments/v2-b2604ae9b2f7bcfb15ce8f1459977961_l.jpg)

](https://www.zhihu.com/column/samuncle-haircut)

## [

游戏码农的自我修养

](https://www.zhihu.com/column/samuncle-haircut)

订阅专栏

[

![Unity Graphics](HTML%20import/Attachments/v2-c0dc059ab55a7d771745ba52f3824333_l.jpg)

](https://www.zhihu.com/column/UnityGraphics)

## [

Unity Graphics

](https://www.zhihu.com/column/UnityGraphics)

Shading & Rendering

订阅专栏

[

Unity（游戏引擎）

](https://www.zhihu.com/topic/19568806)

[

性能优化

](https://www.zhihu.com/topic/19633850)

[

图形处理器（GPU）

](https://www.zhihu.com/topic/19570894)

​赞同 416​​43 条评论

​分享

​喜欢​收藏​申请转载

​

写下你的评论...

  

43 条评论

默认

最新

[![moyu](./关于静态批处理_动态批处理_GPU%20Instancing%20_SRP%20Batcher的详细剖析%20-%20知乎_files/c1bb6a4abacecb1ff0bbf838ab3a4e08_l.jpg)](https://www.zhihu.com/people/a531e406be4ac05aa5685f36c26a3347)

[moyu](https://www.zhihu.com/people/a531e406be4ac05aa5685f36c26a3347)

srp batch是支持蒙皮网格的，The rendered object must be a mesh  
or skinned mesh. It cannot be a particle. [https://docs.unity3d.com/Manual/SRPBatcher.html?_ga=2.255217868.595454338.1617932596-2019903502.1587321278](http://link.zhihu.com/?target=https%3A//docs.unity3d.com/Manual/SRPBatcher.html%3F_ga%3D2.255217868.595454338.1617932596-2019903502.1587321278)

2021-04-09

​回复​4

[![游戏码农](HTML%20import/Attachments/v2-a8cb26f72f81cba0b0433c31274c5e85_l.jpg)](https://www.zhihu.com/people/725a0bdfeb7f8fcef5fe32cc96060f5d)

[游戏码农](https://www.zhihu.com/people/725a0bdfeb7f8fcef5fe32cc96060f5d)

实测是支持的，只是最早的关于srp batcher的unity blog说不支持，这块信息未更新。[https://blog.unity.com/technology/srp-batcher-speed-up-your-rendering](http://link.zhihu.com/?target=https%3A//blog.unity.com/technology/srp-batcher-speed-up-your-rendering)

2022-10-08

​回复​喜欢

[![kuma](HTML%20import/Attachments/v2-52ebf5494a11d34693a8365a2309e6a9_l.jpg)](https://www.zhihu.com/people/cec173496acab75dc347633394ac9f02)

[kuma](https://www.zhihu.com/people/cec173496acab75dc347633394ac9f02)

![](HTML%20import/Attachments/v2-4812630bc27d642f7cafcd6cdeca3d7a.jpg)

对 感觉楼主整理的资料可能有点旧了

2021-12-31

​回复​喜欢

[![辰月二十七](HTML%20import/Attachments/v2-6fb164d8f5c45e2ded7a3646f4a4791a_l.jpg)](https://www.zhihu.com/people/da52b85509dda85b6b0c7ff81aa4872f)

[辰月二十七](https://www.zhihu.com/people/da52b85509dda85b6b0c7ff81aa4872f)

我查看的官方文档中写着，不会减少DC，但是为了开发人员理解所以编辑器上显示减少了。

2020-11-05

​回复​2

[![kuma](HTML%20import/Attachments/v2-52ebf5494a11d34693a8365a2309e6a9_l.jpg)](https://www.zhihu.com/people/cec173496acab75dc347633394ac9f02)

[kuma](https://www.zhihu.com/people/cec173496acab75dc347633394ac9f02)

![](HTML%20import/Attachments/v2-4812630bc27d642f7cafcd6cdeca3d7a.jpg)

只支持一盏实时光，要在多个光源的情况下使用实例化，我们别无选择，只能切换到延迟渲染路径。为了能够让这套机制运作起来，请将所需的编译器指令添加到我们着色器的延迟渲染通道中。——— 在urp里面 选forward rendering 多个实时光的话 除了主光 其他的都作为additional light 这个情况下似乎instancing还是可用的

2021-12-31

​回复​1

[![无聊的活着](HTML%20import/Attachments/v2-1d9e312cde28805a6fb1cdfcdba6544d_l.jpg)](https://www.zhihu.com/people/c16557e388f958f2e51af6f0f9a80510)

[无聊的活着](https://www.zhihu.com/people/c16557e388f958f2e51af6f0f9a80510)

移动端点光就不行，不管是设置的baked还是realtime,只要激活状态，不走代码Draw的方式都会打断。

2023-02-27

​回复​喜欢

[![承影](HTML%20import/Attachments/v2-0a018307970f9cc3182d8ceda62e6a65_l.jpg)](https://www.zhihu.com/people/a771b137695ef51faea2b028a2f39fba)

[承影](https://www.zhihu.com/people/a771b137695ef51faea2b028a2f39fba)

静态合批是可以减少dc 的。至少unity2019 是可以的。在renderdoc 下 查看是一次，甚至说有go被剔除之后，依然是一次。

2022-08-05

​回复​1

[![早睡早起](HTML%20import/Attachments/v2-85a637198e777db8551b1d385d572c26_l.jpg)](https://www.zhihu.com/people/e4b15ba294795502a20c2c0a7f8f5b52)

[早睡早起](https://www.zhihu.com/people/e4b15ba294795502a20c2c0a7f8f5b52)

可能是2019之前的版本还是依次去调用相同次数的DC，但是，网格都合并在一起，材质球也相同，其实直接一次DC就可以了

2023-11-13

​回复​1

[![敖武](HTML%20import/Attachments/v2-c42b81314b82b3240459f3e82539cb48_l.jpg)](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

[敖武](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

请问批处理顺序的文章在哪里可以学习一下？![[可怜]](HTML%20import/Attachments/v2-aa15ce4a2bfe1ca54c8bb6cc3ea6627b.png)文中这句话提到了：“位置不相邻且中间夹杂着不同材质的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解”

2023-01-05

​回复​喜欢

[![敖武](HTML%20import/Attachments/v2-c42b81314b82b3240459f3e82539cb48_l.jpg)](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

[敖武](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

[xush fantic](https://www.zhihu.com/people/974d845de977906667f48cf7d8f9e68a)

没有，而且我发现UI的合批在层级间断时也会被打断合批，估计是硬件某些特殊原因造成的

2023-02-28

​回复​喜欢

[![xush fantic](HTML%20import/Attachments/v2-2f3e02a9ed14744fe6346d993fc2d7e7_l.jpg)](https://www.zhihu.com/people/974d845de977906667f48cf7d8f9e68a)

[xush fantic](https://www.zhihu.com/people/974d845de977906667f48cf7d8f9e68a)

同问,老兄你找到了吗

2023-02-27

​回复​喜欢

[![海贼猎人](HTML%20import/Attachments/v2-ffaf1fc12d3ceaaffaaea9344fc6849b_l.jpg)](https://www.zhihu.com/people/e50d2c438fc509c30d743ec424b16d73)

[海贼猎人](https://www.zhihu.com/people/e50d2c438fc509c30d743ec424b16d73)

![](HTML%20import/Attachments/v2-4812630bc27d642f7cafcd6cdeca3d7a.jpg)

“另外，在运行时所有的顶点位置处理不再需要进行计算，节约了计算资源。“

  

静态批次的时候只是把世界矩阵设成单位矩阵传给shader，并没有节省计算量吧......

2019-12-28

​回复​2

[![SamUncle](HTML%20import/Attachments/v2-1cdbfcf07644a98948a0daa8b96977f5_l(1).jpg)](https://www.zhihu.com/people/24523495c3f477dcf3e8bc78f5444835)

[SamUncle](https://www.zhihu.com/people/24523495c3f477dcf3e8bc78f5444835)

作者

谢谢提醒哈，这段表达不清，已更正

2019-12-30

​回复​喜欢

[![君籽](HTML%20import/Attachments/v2-f0a7d7b67349aadbd7a98025c917c561_l.jpg)](https://www.zhihu.com/people/793d0478dd2e1a469633a7d4f9fa3447)

[君籽](https://www.zhihu.com/people/793d0478dd2e1a469633a7d4f9fa3447)

请教个问题，为什么静态批处理需要复制顶点，而动态不需要

2023-08-23

​回复​喜欢

[![君籽](HTML%20import/Attachments/v2-f0a7d7b67349aadbd7a98025c917c561_l(1).jpg)](https://www.zhihu.com/people/793d0478dd2e1a469633a7d4f9fa3447)

[君籽](https://www.zhihu.com/people/793d0478dd2e1a469633a7d4f9fa3447)

为什么我看的shader入门精要里写静态批处理会减少drawcall呀

2023-08-23

​回复​喜欢

[![郑佳宇joe](HTML%20import/Attachments/v2-ae8dcdc8d1ba393b3a42e0ca182e89e8_l.jpg)](https://www.zhihu.com/people/012318207ea4ff7ed0e71d3b821f3ad6)

[郑佳宇joe](https://www.zhihu.com/people/012318207ea4ff7ed0e71d3b821f3ad6)

相同材质批处理断开情况  
位置不相邻且中间夹杂着不同材质的其他物体，不会进行同批处理，这种情况比较特殊，涉及到批处理的顺序，我的另一篇文章有详解  
请问这篇文章的链接在哪里呢

2021-11-17

​回复​喜欢

[![xush fantic](HTML%20import/Attachments/v2-2f3e02a9ed14744fe6346d993fc2d7e7_l.jpg)](https://www.zhihu.com/people/974d845de977906667f48cf7d8f9e68a)

[xush fantic](https://www.zhihu.com/people/974d845de977906667f48cf7d8f9e68a)

[啵啵啵](https://www.zhihu.com/people/90838dd57a74e33a2d7bd9ad2e041381)

同求,你找到了吗？

2023-02-27

​回复​喜欢

[![啵啵啵](HTML%20import/Attachments/v2-eddff773f01e3d407ee25d1b2175b685_l.jpg)](https://www.zhihu.com/people/90838dd57a74e33a2d7bd9ad2e041381)

[啵啵啵](https://www.zhihu.com/people/90838dd57a74e33a2d7bd9ad2e041381)

同求，你找到了吗？

2021-12-14

​回复​喜欢

[![八六](HTML%20import/Attachments/v2-abed1a8c04700ba7d72b45195223e0ff_l.jpg)](https://www.zhihu.com/people/c16a68e20dd406de25f5dff91fe50683)

[八六](https://www.zhihu.com/people/c16a68e20dd406de25f5dff91fe50683)

![](HTML%20import/Attachments/v2-4812630bc27d642f7cafcd6cdeca3d7a(1).jpg)

后面两种优化，顶点数据肯定不会进Buffer的吧。。

2021-11-05

​回复​喜欢

[![禾伞](HTML%20import/Attachments/0acde4acd_l.jpg)](https://www.zhihu.com/people/8d161b01679ced3b53fd575f885dd3f6)

[禾伞](https://www.zhihu.com/people/8d161b01679ced3b53fd575f885dd3f6)

动态合批为啥会受多PASS影响？想不明白这个逻辑，在Mesh合并后，提交了DC，然后在这一次Mesh的渲染中，进行多个PASS的渲染，多次更改了渲染状态。多PASS到底是在哪里影响了动态合批？望解惑。

2021-10-10

​回复​喜欢

[![敖武](HTML%20import/Attachments/v2-c42b81314b82b3240459f3e82539cb48_l(1).jpg)](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

[敖武](https://www.zhihu.com/people/7c1045818b7eae2b15d27abc75b161a2)

其实相同材质中的材质，指的是材质球的一个pass，所以多pass等于多个材质，个人理解

2023-01-05

​回复​喜欢

点击查看全部评论

写下你的评论...

  

### 推荐阅读

[

# JS中的原型和原型链详解

JS中的原型和原型链是大家彻底搞懂JS面向对象及JS中继承相关知识模块非常重要的一个模块，一旦突破这块知识点，相信大家对JS会有一个更新、更全面的认识。 一、 什么是原型？任何对象都有一…

游戏开发发表于cocos...



](https://zhuanlan.zhihu.com/p/93263239)[

![初识JS原型/原型链/原型继承](HTML%20import/Attachments/v2-6f8de0bda992d4fe1bc38ef6a54da10d_250x0.jpg)

# 初识JS原型/原型链/原型继承

pany发表于前端学习小...



](https://zhuanlan.zhihu.com/p/60223120)[

# SpringMVC 提交参数的方式和注解详述

一、四种接收提交参数的方式1. 方法参数直接接收表单域的值。简单的表单如下： &lt;form action=&#34;${pageContext.request.contextPath}/submit&#34; method=&#34;POST&#34;&gt; &lt;inpu…

zzzz



](https://zhuanlan.zhihu.com/p/435966782)[

# 1.spring系列之优雅的实现接口统一返回

好处现在公司开发基本上都是以前后分离模式为主，所以要有个统一的数据格式，这样有什么好处呢? 能够提高前后端对接的效率（特别重要）代码更加优雅和简洁对于前端和后端维护更方便容易实现…

杨大明



](https://zhuanlan.zhihu.com/p/451001166)

_想来知乎工作？请发送邮件到 jobs@zhihu.com_

![](HTML%20import/Attachments/liukanshan-peek.a71ecf3e.png)登录即可查看 超5亿 专业优质内容

超 5 千万创作者的优质提问、专业回答、深度文章和精彩视频尽在知乎。

立即登录/注册