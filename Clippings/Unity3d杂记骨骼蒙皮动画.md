---
source: https://zhuanlan.zhihu.com/p/87583171
tags:
  - clippings
---
目前游戏开发中常用的两种动画：顶点动画和蒙皮动画
## **1\. 顶点动画**

通过在动画帧中直接修改mesh顶点的位置来实现，通常在mesh顶点数目较少，动画简单的情况下使用，如草的摆动，树的摆动，水的波动等

## **2\. 蒙皮动画**

通过在动画中直接修改bone的位置，让mesh的顶点随着bone的变化而变化，通常用于人形动画，如人物的跑动，跳跃等

下面主要来介绍蒙皮动画的实现原理

### **1\. 蒙皮是什么？**

我们知道Mesh是由顶点和面组成的，如果不绑定蒙皮数据，称之为静态mesh，不具有动画效果的，如游戏中的房子，地面，桥，道路等；

对于绑定蒙皮的mesh，我们称之为SkinMesh，在SkinMesh中每个mesh的顶点会受到若干个骨骼的影响，并配以一定的权重比例；

就像我们真实的人一样，首先支撑并决定位置和运动的是一组骨骼，头+身体+四肢，而身上的肌肉是受到骨骼的影响而产生运动的，每一块肌肉的运动可能会受到多个骨骼的影响；

### **2\. 蒙皮需要的数据**

在unity中主要是通过`SkinnedMeshRenderer`组件来实现蒙皮动画的计算

计算蒙皮动画所需要的数据：
1. `SkinnedMeshRenderer.bones`：所有引用到bone的列表，注意顺序是确定的，后续顶点的BoneWeight中bone的索引，就是基于这个数组顺序的索引
2. `SkinnedMeshRenderer.sharedMesh`：渲染所需的mesh数据，注意相比普通的MeshRender所需的顶点和面数据，还会有一些额外的计算蒙皮相关的数据
3. `Mesh.boneWeights`：每个顶点受到哪几根bone的影响的索引和权重（每个顶点最多受到四根骨骼的影响，详见结构体BoneWeight的定义）
4. `Mesh.bindposes`：每根bone从mesh空间到自己的bone空间的变换矩阵，也就是预定义的bone的bone空间到mesh空间的变换矩阵的逆矩阵，注意顶点受到bone影响所做的变换都是基于在bone空间做的变换

根据Unity文档, Unity中BindPose的算法如下:

```
OneBoneBindPose = bone.worldToLocalMatrix * transform.localToWorldMatrix;
```

骨骼的世界转局部坐标系矩阵乘上Mesh的局部转世界矩阵

注意：美术一般在绑定蒙皮时，会将骨骼摆成一个Tpose的样式，这个时候的bone的transform转换出矩阵也就是bindpose，所有的骨骼动画都是在这个基础上相对变换的，最终会作为mesh本身的静态数据保存下来。

### **3\. 蒙皮的计算过程**

我们通常将计算Mesh的顶点受bone影响而产生的变化的过程称之为蒙皮，如果在代码中计算的话，称之为cpu蒙皮，如果在gpu也就是顶点着色器中计算的话，称之为gpu蒙皮。

注意：所有的计算并不包括世界坐标的变换，都是在mesh空间下进行的，Mesh中原始的顶点坐标也是定义在Mesh空间下的

1: 首先我们将顶点从mesh空间变换到bone空间：

```
v_bone = v_mesh * bindpose
```

2: 然后将bone空间下的顶点经过当前bone的变换矩阵，从bone空间变换到mesh空间

```
v_out = v_bone * boneToMeshMatrix
```

3: 当然一个顶点可能受到多根骨骼的影响，所以最终是对受影响的几根骨骼进行变换，乘以boneWeights中的权重相加混合得到

```
v_out0 =  boneToMeshMatrix0 * bindpose0 * v_mesh 
v_out1 =  boneToMeshMatrix1 * bindpose1 * v_mesh 
v_out2 =  boneToMeshMatrix2 * bindpose2 * v_mesh 
v_out3 =  boneToMeshMatrix03 * bindpose3 * v_mesh 
v_out = v_out0 * weight0 + v_out1 * weight1 + v_out2 * weight2 + v_out3 * weight3
```

### **4\. 示例工程**

在代码中实现蒙皮的计算也是cpu蒙皮

1: 通过一个编辑器工具，对动画按照一定帧数采样，把每一帧的骨骼的localToWorldMatrix矩阵存储下来
![](https://pic2.zhimg.com/v2-0e780cd7b2c96b46c5bf46573d3eb165_1440w.jpg)

对于Animation组件来说采样很简单，通过修改 AnimationState.time，然后调用Animation.Sample()即可将动画固定在确定的时间，然后直接获取bone的transform的数据就可以了

```
private AnimData.FrameData GetFrameData(AnimationState animationState, float time)
{
    animationState.enabled = true;
    animationState.weight = 1.0f;
    animationState.time = time;
    _sampleAnimation.Sample();
    AnimData.FrameData frameData = new AnimData.FrameData();
    frameData.time = time;
    List<Matrix4x4> matrix4X4s = new List<Matrix4x4>();
    foreach(Transform bone in _bones)
    {
        matrix4X4s.Add(bone.localToWorldMatrix);
    }
    frameData.matrix4X4s = matrix4X4s.ToArray();

    return frameData;
}
```

2: 用MeshRender替换SkinnedMeshRenderer构造一个新的GameObject
![](https://pica.zhimg.com/v2-e5706d65a8b73875204db1a6f1a49fba_1440w.jpg)

3: 代码中实现通过每一帧的骨骼数据计算顶点位置来实现动画

```
void ApplyFrame(int f)
{
    _frame = f;

    AnimData.FrameData frameData = _animData.frameDatas[_frame];
    for (int i = 0; i < _srcPoints.Count; ++i)
    {
        Vector3 point = _srcPoints[i];
        BoneWeight weight = _mesh.boneWeights[i];
        Matrix4x4 tempMat0 = frameData.matrix4X4s[weight.boneIndex0] * _bindPoses[weight.boneIndex0];
        Matrix4x4 tempMat1 = frameData.matrix4X4s[weight.boneIndex1] * _bindPoses[weight.boneIndex1];
        Matrix4x4 tempMat2 = frameData.matrix4X4s[weight.boneIndex2] * _bindPoses[weight.boneIndex2];
        Matrix4x4 tempMat3 = frameData.matrix4X4s[weight.boneIndex3] * _bindPoses[weight.boneIndex3];

        Vector3 temp = tempMat0.MultiplyPoint(point) * weight.weight0 +
                               tempMat1.MultiplyPoint(point) * weight.weight1 +
                               tempMat2.MultiplyPoint(point) * weight.weight2 +
                               tempMat3.MultiplyPoint(point) * weight.weight3;

        _newPoints[i] = temp;
    }

    _mesh.SetVertices(_newPoints);
}
```

4: 在update中根据时间计算当前动画应到哪一帧了，应用当前帧的骨骼数据修改顶点的数据，就实现动画的效果了

```
void Update()
{
    if (_animData == null) return;
    if (_frame < 0)
    {
        ApplyFrame(0);
        return;
    }
    _time += Time.deltaTime;
    _time %= _animData.animLen;
    int f = (int)(_time / (1.0f / _animData.frame));

    if (f != _frame)
    {
        ApplyFrame(f);
    }
}
```

5: 最终实现用MeshRender来播放动画

![动图封面](https://pic1.zhimg.com/v2-0243270b5608a29e68ba4897c9d16308_b.jpg)


6: \[示例工程的地址\] [https://github.com/oldzhang227/UnityDemos/tree/master/SkinAnimDemo](https://link.zhihu.com/?target=https%3A//github.com/oldzhang227/UnityDemos/tree/master/SkinAnimDemo)， 如有疑问，请评论留言，愿与你一起交流， 关注公众号 **old张** ，持续分享技术干活

编辑于 2021-04-10 18:07

还没有人送礼物，鼓励一下作者吧

### 内容所属专栏

[

![Unity3d杂记](https://picx.zhimg.com/v2-f111d7ee1c41944859e975a712c0883b_l.jpg?source=172ae18b)

](https://www.zhihu.com/column/c_1362512995579400192)

## [

Unity3d杂记

](https://www.zhihu.com/column/c_1362512995579400192)

公号：old张

[

Unity（游戏引擎）

](https://www.zhihu.com/topic/19568806)

![](https://pic1.zhimg.com/v2-edd442cdc4156e8ee496cf6467d2b1a2_l.jpg?source=32738c0c&needBackground=1)

理性发言，友善互动

  

9 条评论

默认

最新

[![飞飞](https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/d7d2ba47a71424bfebb4538047f08345)

[飞飞](https://www.zhihu.com/people/d7d2ba47a71424bfebb4538047f08345)

Unity的SkinnedMeshRenderer使用多线程优化了么？动画复制十几个运行起来还是很流程。

2022-09-18

[![卞谨慎](https://picx.zhimg.com/a1906858a372381349ea079424de57a7_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/ad8117e0bd156d470a5cea80925a336e)

[卞谨慎](https://www.zhihu.com/people/ad8117e0bd156d470a5cea80925a336e)

Unity新的SkinnedMeshRenderer都是在GPU处理的

2023-05-17

[![知乎用户uDTQ2N](https://pic1.zhimg.com/v2-f1be5ed24936a7311e75da3884b2bd6d_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/302812e1319312e554c7cddb31880d23)

[知乎用户uDTQ2N](https://www.zhihu.com/people/302812e1319312e554c7cddb31880d23)

发现初始姿势和开始播放动画后不在一个方向上，另外我们旋转物体，灯光效果没有变化，都是在一个面上亮

2022-08-27

[![闫晓文](https://picx.zhimg.com/v2-8f4ee1da361f8f4059ddc719be4514a3_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/3eca265e3d942be898d48ce4c9c675a1)

[闫晓文](https://www.zhihu.com/people/3eca265e3d942be898d48ce4c9c675a1)

想看具体绑定的过程，有没有视频

2020-07-17

[![哈里路秋秋](https://picx.zhimg.com/v2-abed1a8c04700ba7d72b45195223e0ff_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/adb449ae7058a7345e8918c744a957ed)

[哈里路秋秋](https://www.zhihu.com/people/adb449ae7058a7345e8918c744a957ed)

那是美术小伙伴的工作,cgjoy网站上有教程

2023-02-10

[![菜鸟一个](https://pic1.zhimg.com/v2-3ced2127d412b2e022b50039bfef1ebc_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/9a89fc775d3fcd623063df56a3fe6ebe)

[菜鸟一个](https://www.zhihu.com/people/9a89fc775d3fcd623063df56a3fe6ebe)

👍🏻

2019-10-20

[![姓甚名谁](https://picx.zhimg.com/886e2cc148f72ff87eac2ef414ba1e97_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/9cf8964009bdbf993f07b9d45c2182c4)

[姓甚名谁](https://www.zhihu.com/people/9cf8964009bdbf993f07b9d45c2182c4)

很有用，项目实战详解有吗？

2019-10-20

[![诸葛玄机](https://picx.zhimg.com/v2-bf8bb98063397d48fcecc444207f5008_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/65f632c0f8f4c2e2cda0e4680756ae88)

[诸葛玄机](https://www.zhihu.com/people/65f632c0f8f4c2e2cda0e4680756ae88)

[old张](https://www.zhihu.com/people/c03bace62aba78824ef1ab4cddd4a59b)

你这个最后少一个世界到mesh的转换吧。

2023-06-28

[![old张](https://picx.zhimg.com/v2-357a0ef1f48ad1bd72f349a0893fae0f_l.jpg?source=06d4cd63)](https://www.zhihu.com/people/c03bace62aba78824ef1ab4cddd4a59b)

[old张](https://www.zhihu.com/people/c03bace62aba78824ef1ab4cddd4a59b)

作者

后面会陆续讲到，有兴趣关注下。

2019-10-20

查看被折叠评论

### 推荐阅读

[

![在 Unity 中让卡通人物变得更可爱](https://picx.zhimg.com/v2-4b89c7f708add938b9e046b176eed036_250x0.jpg?source=172ae18b)

# 在 Unity 中让卡通人物变得更可爱

冯侃

](https://zhuanlan.zhihu.com/p/98074313)[

![Unity实现GPU动画](https://pic1.zhimg.com/v2-77cf97c80d752d84a58399a304382034_250x0.jpg?source=172ae18b)

# Unity实现GPU动画

傻头傻脑亚...发表于Unity...

](https://zhuanlan.zhihu.com/p/690695496)[

![如何让动作在Unity中更加流畅](https://pic1.zhimg.com/v2-7b95f4a1fda1a7eba70fe7f722564fad_250x0.jpg?source=172ae18b)

# 如何让动作在Unity中更加流畅

PublicFaith

](https://zhuanlan.zhihu.com/p/32655668)[

# Unity动画TA：以UE4动画重定向为灵感，炮制自己的万能动画重定向

更新于2024.3.30： 测试工程公开： ZXT\_Unity\_Projects / AnimationRetargeting · GitLab本来在Unity里制作自己的重定向算法的目的是，有朝一日告别Unity人形Avatar的限制，可以方便地把蜘…

土土的张小土

](https://zhuanlan.zhihu.com/p/438307272)