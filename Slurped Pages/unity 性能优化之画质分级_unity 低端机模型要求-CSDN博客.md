---
link: https://blog.csdn.net/qq_30100043/article/details/130464256?spm=1001.2101.3001.6650.8&utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ERate-8-130464256-blog-136141327.235%5Ev43%5Epc_blog_bottom_relevance_base2&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromBaidu%7ERate-8-130464256-blog-136141327.235%5Ev43%5Epc_blog_bottom_relevance_base2
byline: 成就一亿技术人!
excerpt: 文章浏览阅读3.8k次。当游戏需要兼容多平台或面对不同硬件性能时，可以使用Unity的QualitySettings进行画质分级。这包括调整渲染管线、纹理质量、帧率限制、阴影质量等，以确保在低端设备上也能流畅运行。例如，降低渲染分辨率、关闭动态反射、限制帧率到30fps以及使用低模和性能更好的着色器，可以显著提升移动端游戏的运行效率。
tags:
  - slurp/unity
slurped: 2025-07-15T17:37
title: unity 性能优化之画质分级_unity 低端机模型要求-CSDN博客
---

如果你的游戏兼容多平台，或者当前平台的设备也有硬件差距，比如低端设备就是带不动你的画质，无论如何你如何优化就是带不动。这种情况下，我们可以考虑对画质进行分级，减少一些特性，来提高运行质量。接下来我们来学习一下unity内置的Quality来实现一下质量分级：  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f4c64a79851b073e782b6d46f3840bb5.png)  
有了这个，我们可以在面板上面，根据需求，去控制每个平台的质量，而不需要非得在代码中去设置，并且可以直观的在编辑器中查看设置的质量的效果。  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0f1a1245928e7bdb2a604f77cdac1300.png)  
这里就是unity默认给设置的分级。  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f948bc48279d2950ff9e3147c214c15c.png)  
Name 是可以修改当前的分级的名称  
Render Pipeline Asset 是当前应用的渲染管线文件，那里也有一些渲染相关的设置，如果没有设置的话，将会默认使用你在Graphics的设置  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2d4c28818f8556c3ece30a9909f247e3.png)  
我们在Render Pipeline Asset里面也可以对一些性能进行设置，还可以设置多份，根据质量不同，选择不同的设置  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1425e371d75638ea88185fee8eaa9d18.png)  
Realtime Reflection Probes 则是是否启用动态反射探针  
Resolution Scaling Fixed DPI Factor 基于当前的分辨率设置缩放，1是默认，如果你设置0.5,1920_1080的分辨率则为当前的一半，960_540  
Vsync Count 垂直同步 手游一般不需要开启

![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8dcaa7c532fac965c9cc56c169982c56.png)  
纹理相关  
Texture Quality 设置纹理分辨率，默认全分辨率，可以根据项目需求直接修改全部纹理的分辨率。  
Anisotropic Textures 各向异性纹理，推荐在纹理上设置，上一节也说到过  
Texture Streaming 纹理是否支持流式加载  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ecbcd9c394d058c24087aeae91ad8f83.png)  
Particle Raycast Budget 关于每帧可执行多少次射线投射以进行近似碰撞测试的预算  
Billboards Face Camera Position 广告牌的朝向是否平行于水平面，开启则朝向相机不平行于水平面，但会增加计算性能。  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/40c2f05f26e58eb3ac618d9c061e45db.png)  
之前在GI系统说过，对Shadowmask的设置，距离阴影遮罩就是实时阴影和烘焙Shadowmask有一个混合，shadowmask则是有烘焙就用烘焙，没有就实时。  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/457c67e79107e114a9d2213c5334d10c.png)  
以上设置是cpu上传网格和纹理到gpu的设置  
Time Slice 是每帧上传的可用时间 单位是毫秒  
Buffer Size 上传缓冲区的尺寸 单位是M  
Persistent Buffer 即使没有交互内容，缓冲区是否保存  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d8d8432b8793710f2eeedfc0a377bd93.png)  
这个是对LOD一些设置  
LOD Bias 是LOD的计算会乘以这个值，比如LOD是基于模型的高度占用场景相机的高度来计算的，切换点比如0.7，模型高度占用0.5 Bias设置2 那它的结果为1，将显示0.7高的那一层LOD。  
Maximum LOD Level 最高可以使用的LOD层级，比如移动端可以设置为1，不显示最高层级的。  
![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/b9e5f04116069940159a33568e2c129c.png)  
用于蒙皮顶点计算当前位置可以使用的骨骼数量。

## 分级

1. 渲染分辨率 是最主要影响影响性能的地方，尤其是移动端，现在手机的分辨率都要比电脑显示屏高，所以一定要设置好分辨率。
2. 帧率限制 pc推荐60+ 移动端推荐 30
3. 垂直同步 移动端建议关闭没有撕裂感就直接用，pc建议开启
4. 后处理 移动端建议不使用，用的话最多用一个bloom
5. 抗锯齿 移动端不建议使用
6. 阴影质量 移动端调低，最低端的建议关闭
7. 动态反射 建议不使用
8. SSAO 不建议移动端使用
9. 纹理质量 unity内置各平台的质量压缩，可以根据要求设置质量
10. 模型精度 对于低端机，推荐制作低模 比如加后缀_low来表示，运行时加载低模
11. shader质量，可以根据shaderlod设置，使用性能好的兼容低端机

## 性能推荐

批次保持在 500以下  
SetPassCall 200以下  
移动端贴图尺寸不大于1024  
面数50W左右