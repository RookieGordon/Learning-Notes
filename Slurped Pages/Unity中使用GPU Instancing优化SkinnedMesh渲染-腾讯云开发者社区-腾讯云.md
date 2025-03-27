---
link: https://cloud.tencent.com/developer/article/1393261
tags:
  - Slurp/Unity/SkinnedMesh
  - Slurp/Unity/GPU-Animation
  - Slurp/Unity/GPU-Instancing
---
有这么个需求: 一堆不会动的SkinnedMesh, 通过物理模拟出死亡姿势后, 需要优化性能, 不然才10FPS

![](https://ask.qcloudimg.com/http-save/yehe-1128068/i0ove9ig89.png)

首先想到的做法是转成StaticMesh. 试了一下直接超出了Unity的顶点Index数量限制, 所以放弃, 再说转换完后也不方便编辑. 

另一个思路就是使用Instanced Skinned Mesh Rendering, 找到两个参考:

- [https://github.com/Unity-Technologies/Animation-Instancing](https://cloud.tencent.com/developer/tools/blog-entry?target=https%3A%2F%2Fgithub.com%2FUnity-Technologies%2FAnimation-Instancing&objectId=1393261&objectType=1&isNewArticle=undefined)
- [https://github.com/chengkehan/GPUSkinning](https://cloud.tencent.com/developer/tools/blog-entry?target=https%3A%2F%2Fgithub.com%2Fchengkehan%2FGPUSkinning&objectId=1393261&objectType=1&isNewArticle=undefined)

不过这两个实现都是考虑了Animation的, 会采样AnimationClip的Transform序列帧写入纹理. 直接拿来是没法用的, 所以就参考他们的做法自己也实现了个Instancing的优化. 

大家做SkinnedMeshInstancing的思路都差不多, 所以整个优化的流程就比较容易理清了:

- 把SkinnedMesh转换成StaticMesh, 把每个顶点的蒙皮混合权重和骨骼索引写到顶点的color/uv1/uv2, 通常情况下都是4个bone index加上4个blend weight.
- 每个SkinnedMesh的Pose都是一系列的变换矩阵, 去掉一行后做为3个Color写入RGBAHalf纹理
- Shader中加个INSTANCED_PROP的PoseIndex参数, 用于索引PoseMatrix的起始像素(matrix), 再根据顶点里的bone index和weight查到4个matrix乘到顶点的位置和法线上. 其实跟常见的skin shader的写法差别不大, 区域在于bone transforms不是从constant buffer里取出来
- 为生成的Mesh再生成InstancingShader的Material, 拷贝原材质参数过来, 并写入我们计算PoseOffset需要的参数(如骨骼数), 另外需要勾选Enable Instancing

做完这些, 不出错的情况下其实就可以用MeshRenderer把模型画出来了, 但实现过程中也遇到一些问题:

![](https://ask.qcloudimg.com/http-save/yehe-1128068/mb1aekhq3w.png)

- 每个角色的SkinnedMesh是分成3个Mesh的, 每个SkinnedMesh引用的骨骼还不一样. 所以直接取SkinnedMesh的bones数据是没法跟其它Mesh共用的. 所以需要从根节点开始遍历, 生成一张共用的PoseTexture.
- 使用MeshRenderer来绘制是有问题的, 因为顶点在shader中改变了位置, 但是Bounds没有变化, 导致Culling出问题. 所以需要使用CullingGroup自己做可见性检测, 然后通过DrawMeshInstanced去绘制. 也就是说完全不需要MeshRenderer了, 也不需要为每个Mesh创建GameObject
- Texture的FilterMode需要改成Point采样, 不然相邻像素之间会插值, 导致读取的matrix值是错误的. 如下图, 左边是Point采样, 右边是Linear采样, 可以看到颜色都被平均掉了:

![](https://ask.qcloudimg.com/http-save/yehe-1128068/cfcourmgcr.png)

![](https://ask.qcloudimg.com/http-save/yehe-1128068/sg11onf6m6.png)

- 写入纹理的Transform矩阵应该是root.worldToLocalMatrix * bone.localToWorldMatrix * bone.bindpose. 不然肢体Transform会计算错误

![](https://ask.qcloudimg.com/http-save/yehe-1128068/h1jzbegyd1.png)

- 之前为了省性能每个顶点只计算了两个骨骼的影响, 结果会发现部分蒙皮错误的情况, 改成4个骨骼就好了:

![](https://ask.qcloudimg.com/http-save/yehe-1128068/9mut9jw0xc.png)

最终的优化效果还是挺不错的, 从10FPS提升到80FPS左右:

![](https://ask.qcloudimg.com/http-save/yehe-1128068/sf3gxfxfbc.png)

本文参与 [腾讯云自媒体同步曝光计划](https://cloud.tencent.com/developer/support-plan)，分享自作者个人站点/博客。

原始发表：2018年07月10日，

如有侵权请联系 [cloudcommunity@tencent.com](mailto:cloudcommunity@tencent.com) 删除