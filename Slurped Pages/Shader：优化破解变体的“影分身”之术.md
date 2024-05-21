---
link: https://zhuanlan.zhihu.com/p/337308829
site: 知乎专栏
excerpt: 本期我们将剖析刚上新的 Shader
  Analyzer中和Shader变体相关的规则：“Build后生成变体数过多的Shader”、“项目中可能生成变体数过多的Shader”和“项目中全局关键字过多的Shader”。我们将力图以浅显易懂的表达…
tags:
  - slurp/着色器
  - slurp/Unity（桌面环境）
  - slurp/Unity（游戏引擎）
slurped: 2024-05-21T10:15:05.132Z
title: Shader：优化破解变体的“影分身”之术
---

本期我们将剖析刚上新的**[Shader Analyzer中和Shader变体相关的规则](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/%2520UWA_Pipeline28%2520.html)：“Build后生成变体数过多的Shader”、“项目中可能生成变体数过多的Shader”和“项目中全局关键字过多的Shader”**。我们将力图以浅显易懂的表达，让职场萌新或优化萌新能够深入理解。

首先我们来了解下相关的概念与意义。

---

### 1、什么是Shader 和 变体（Variant）？

Shader从字面意义来讲就是“着色器”；功能上来讲就是用以实现图形渲染的一种技术，更直白地说就是一段实现特定功能的代码程序。Unity工程中可以说所有物体的颜色、光照效果或质感等等，都和Shader有千丝万缕的关联。如图，Unity 2019.3.7中在Project界面可以创建多种预设的不同类型的Shader。

![](https://pic3.zhimg.com/v2-9d5e2b54beeb1976eb2b7666de826aaa_b.jpg)

很多时候，不同效果之间只有一些微小的差距，为每一种渲染效果去专门写一个Shader是很不现实的。从设计原则的角度讲，我们应当尽可能共用重复的代码，而Shader的关键字（Keyword）就为我们提供了这个功能。

开发人员在写Shader时，可以在Shader的代码段中去定义一些关键字，然后在代码中根据关键字开启与否，去控制物体的渲染过程。如此一来同一份Shader源码就可以具备多种不同的功能。另外，我们可以在Runtime通过开启或关闭关键字的方式动态改变渲染效果。

这样在项目最终编译的时候，引擎就会根据不同的关键字组合去生成多份Shader程序片段。每一种关键字组合对应生成的程序就是这个原始Shader的一个变体（Variant）。

### 2、什么是关键字（Keyword）?

通俗地说，Shader中的关键字就是一个个标签，方便材质在渲染时绑定不同的Shader变体，实现不同的效果。我们可以在Shader片段中使用编译指令（compile directives）来定义Shader关键字。从变体生成特点上可分为“multi_compile”和“shader_feature”两类，从作用范围角度可分为局部关键字和全局关键字。

在Unity中multi_compile类型的关键字定义方式如下：

![](https://pic1.zhimg.com/v2-b253aa106b2da0130e65978af14d0008_b.jpg)

该编译指令会导致编译时生成所有关键字组合的的变体，如下图：

![](https://pic4.zhimg.com/v2-c6c794fddf3c66dc9d5b0d3d0457933f_b.jpg)

而shader_feature类关键字定义方法如下：

![](https://pic1.zhimg.com/v2-cedbd7e55bf423d9eeb8f99e9e8fd4e4_b.jpg)

一般来讲，带有multi_compile类关键字的Shader，在Build时会把所有可能的关键字排列组合的变体全部生成，由此导致不必要的冗余和包体体积增大；但好处是方便动态选择Shader变体；

而对shader_feature而言，Unity在Build时，不会将未使用的shader_feature关键字生成的变体 包含入内，只有实际被材质使用到的关键字对应的变体才会被Build和打入包中，从而减少了内存占用，精简了包体体积。

但代价是自己要做额外的工作，举例来说，有些shader_feature关键字对应的变体在Build时没有被材质使用到，但是在运行时可能会通过代码开启。这类变体实际需要使用，却没有被打入包中 ，就会导致理想中的效果无法生成。这时，就需要使用Shader Variant Collection，手动将这些体加入到变体收集器里面。

需要说明的是，shader_feature 预编译指令行至少有两个关键字。如果只定义了一个关键字KW_X，则会默认生成一个下划线关键字。以下两行指令等价：

![](https://pic2.zhimg.com/v2-91d1d6d65fd2e5e8c889dcb598f81b81_b.jpg)

一般Shader片段中multi_compile类关键字每增加一个，或者启用的shader_feature类关键字增加一个，该Shader的变体数量就会增加一份。而对于变体数与内存、显存的关系，UWA曾做过以下实验：

使用#pragma multi_compile定义的一行关键字为一组，每组包含两个关键字，对产生的内存进行统计，结果如下：

![](https://pic1.zhimg.com/v2-3ee0c585d8630f6f7489e3e6baeb332c_b.jpg)

由此可见变体数和ShaderLab的内存占用基本成正比。而由于没有使用Shader进行渲染，GfxDriver内存不会增加，没有参与渲染的Shader变体是不会经历CreateGPUProgram传入GfxDriver内存中的。

**然后我们来结合这次新功能中的相关规则进行具体说明变体对项目优化的意义。**

### 3、可能生成变体数过多的Shader

![](https://pic3.zhimg.com/v2-097f8536670b759b9382a82927a94772_b.jpg)

对Unity项目而言，Shader变体有其存在的积极意义。除了代码的共用与运行时渲染效果的动态改变之外，还增加了Shader程序在GPU上的执行效率。

对GPU来说，处理类似于“if-else”结构的分支语句不是它的强项，GPU的特点和功能决定了它更适合去并列地“执行”重复性的任务，而不是去“选择”。所以Shader变体的存在就很好地解决了这个问题，GPU只需要根据关键字去执行对应的Variant内容就可以，避免了性能下降的可能。同时，项目在运行时，可以通过在代码中选择不同的Shader变体，从而动态地改变着色器功能。

但是Shader变体是一把双刃剑。在带来以上便利的同时，也存在着各种问题：

**1）在Build阶段，过多的Shader变体数量会使得Build耗时明显上升，而最终的项目包体体积也会变得臃肿。**

**2）在项目运行阶段，Shader变体会以其庞大的数量产生可观的内存占用，同时也会导致项目加载时间的增加，也就是俗说的“卡顿”。**

所以本条规则会扫描项目中的Shader脚本，根据项目中Material上开启的关键字情况去计算可能生成的变体数。开发团队可以在找出这些可能生成过多变体数的Shader后，结合项目实际情况去进行相应的修改。

### 4、全局关键字过多的Shader

![](https://pic1.zhimg.com/v2-b721b2ccfcc85bb1a3f32f152db5e34c_b.jpg)

由于Unity支持的全局关键字的总数有限（256个全局关键字，64个局部关键字），而Unity内部关键字已经占用了约60个“名额”，所以我们建议开发团队尽可能使用局部关键字（shader_feature_local和multi_compile_local）。本条规则会对所有预编译指令定义的关键字进行识别，找出那些全局关键字过多的Shader以方便开发团队进行进一步的检查与修改。

### 5、Build后生成变体数过多的Shader

![](https://pic3.zhimg.com/v2-b4b6ac29f386130d5653a2f071df3a92_b.jpg)

项目进行打包（Build）的时候，会将项目实际使用的资源封装到包里面（如Scenes In Build中的场景依赖的所有资源等）。因此，并非所有的Shader资源都会被带入包中。另外，本文介绍的第一条规则，仅会检测目标路径下的Shader脚本文件，对于项目使用的一些内置的（Built-in）Shader则无法检测到。**所以本条规则的意义，就在于统计打包后实实在在使用的Shader资源对应的变体。**

我们模拟了项目的Build流程，将那些在Build后生成变体数过多的Shader统计出来，方便开发团队根据项目的实际需求去进行进一步的检查和修改。（此外需要说明的是，本规则只支持Unity2018.2及其以上的版本。）

希望以上这些知识点能伴随本次的功能更新而在实际的开发过程中为大家带来帮助。需要说明的是，每一项检测规则的阈值都可以由开发团队依据自身项目的实际需求去设置合适的阈值范围，这也是本地资源检测的一大特点。同时，[也欢迎大家来使用UWA推出的本地资源检测服务，可帮助大家尽早对项目建立科学的美术规范。](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/pipelinesummary.html)

**往期优化规则，我们也将持续更新。**  
[《动画优化：关于AnimationClip的三两事》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline22.html)  
[《材质优化：如何正确处理纹理和材质的关系》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline21.html)  
[《纹理优化：让你的纹理也“瘦”下来》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline20.html)  
[《纹理优化：不仅仅是一张图片那么简单》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline19.html)

万行代码屹立不倒，全靠基础掌握得好！

**性能黑榜相关阅读**

[《那些年给性能埋过的坑，你跳了吗？》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline12.html)  
[《那些年给性能埋过的坑，你跳了吗？（第二弹）》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline13.html)  
[《掌握了这些规则，你已经战胜了80%的对手！》](https://link.zhihu.com/?target=https%3A//blog.uwa4d.com/archives/UWA_Pipeline14.html)