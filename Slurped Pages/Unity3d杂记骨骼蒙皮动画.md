---
source: https://zhuanlan.zhihu.com/p/87583171
tags:
  - Slurp/Unity/GPU-Animation
  - Slurp/Unity/GPU-Instancing
  - Slurp/Unity/动画烘焙
  - Slurp/Unity/骨骼动画
  - Slurp/Unity/动画蒙皮
---
目前游戏开发中常用的两种动画：顶点动画和蒙皮动画
1. 顶点动画：通过在动画帧中直接修改mesh顶点的位置来实现，通常在mesh顶点数目较少，动画简单的情况下使用，如草的摆动，树的摆动，水的波动等
2. 蒙皮动画：通过在动画中直接修改bone的位置，让mesh的顶点随着bone的变化而变化，通常用于人形动画，如人物的跑动，跳跃等
下面主要来介绍蒙皮动画的实现原理
# 蒙皮是什么？
我们知道Mesh是由顶点和面组成的，如果不绑定蒙皮数据，称之为静态mesh，不具有动画效果的，如游戏中的房子，地面，桥，道路等。对于绑定蒙皮的mesh，我们称之为SkinMesh，在SkinMesh中每个mesh的顶点会受到若干个骨骼的影响，并配以一定的权重比例。就像我们真实的人一样，首先支撑并决定位置和运动的是一组骨骼，头+身体+四肢，而身上的肌肉是受到骨骼的影响而产生运动的，每一块肌肉的运动可能会受到多个骨骼的影响。

# 蒙皮需要的数据
在unity中主要是通过`SkinnedMeshRenderer`组件来实现蒙皮动画的计算
计算蒙皮动画所需要的数据：
1. `SkinnedMeshRenderer.bones`：所有引用到bone的列表，注意顺序是确定的，后续顶点的BoneWeight中bone的索引，就是基于这个数组顺序的索引
2. `SkinnedMeshRenderer.sharedMesh`：渲染所需的mesh数据，注意相比普通的MeshRender所需的顶点和面数据，还会有一些额外的计算蒙皮相关的数据
3. `Mesh.boneWeights`：每个顶点受到哪几根bone的影响的索引和权重（每个顶点最多受到四根骨骼的影响，详见结构体BoneWeight的定义）
4. `Mesh.bindposes`：每根bone从mesh空间到自己的bone空间的变换矩阵，也就是预定义的bone的bone空间到mesh空间的变换矩阵的逆矩阵，注意顶点受到bone影响所做的变换都是基于在bone空间做的变换
根据Unity文档, Unity中BindPose的算法如下:
```C#
OneBoneBindPose = bone.worldToLocalMatrix * transform.localToWorldMatrix;
```
骨骼的世界转局部坐标系矩阵乘上Mesh的局部转世界矩阵
注意：美术一般在绑定蒙皮时，会将骨骼摆成一个Tpose的样式，这个时候的bone的transform转换出矩阵也就是bindpose，所有的骨骼动画都是在这个基础上相对变换的，最终会作为mesh本身的静态数据保存下来。
# 蒙皮的计算过程
我们通常将计算Mesh的顶点受bone影响而产生的变化的过程称之为蒙皮，如果在代码中计算的话，称之为cpu蒙皮，如果在gpu也就是顶点着色器中计算的话，称之为gpu蒙皮。
注意：所有的计算并不包括世界坐标的变换，都是在mesh空间下进行的，Mesh中原始的顶点坐标也是定义在Mesh空间下的
1. 首先我们将顶点从mesh空间变换到bone空间：
```C#
v_bone = v_mesh * bindpose
```
2. 然后将bone空间下的顶点经过当前bone的变换矩阵，从bone空间变换到mesh空间
```C#
v_out = v_bone * boneToMeshMatrix
```
3. 当然一个顶点可能受到多根骨骼的影响，所以最终是对受影响的几根骨骼进行变换，乘以boneWeights中的权重相加混合得到
```
v_out0 =  boneToMeshMatrix0 * bindpose0 * v_mesh 
v_out1 =  boneToMeshMatrix1 * bindpose1 * v_mesh 
v_out2 =  boneToMeshMatrix2 * bindpose2 * v_mesh 
v_out3 =  boneToMeshMatrix03 * bindpose3 * v_mesh 
v_out = v_out0 * weight0 + v_out1 * weight1 + v_out2 * weight2 + v_out3 * weight3
```
# 示例工程
在代码中实现蒙皮的计算也是cpu蒙皮
1. 通过一个编辑器工具，对动画按照一定帧数采样，把每一帧的骨骼的localToWorldMatrix矩阵存储下来
![](https://pic2.zhimg.com/v2-0e780cd7b2c96b46c5bf46573d3eb165_1440w.jpg)
对于Animation组件来说采样很简单，通过修改 AnimationState.time，然后调用Animation.Sample()即可将动画固定在确定的时间，然后直接获取bone的transform的数据就可以了
```C#
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
2. 用MeshRender替换SkinnedMeshRenderer构造一个新的GameObject
![](https://pica.zhimg.com/v2-e5706d65a8b73875204db1a6f1a49fba_1440w.jpg)

3. 代码中实现通过每一帧的骨骼数据计算顶点位置来实现动画
```C#
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
4. 在update中根据时间计算当前动画应到哪一帧了，应用当前帧的骨骼数据修改顶点的数据，就实现动画的效果了
```C#
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
5. 最终实现用MeshRender来播放动画
![动图封面](https://pic1.zhimg.com/v2-0243270b5608a29e68ba4897c9d16308_b.jpg)
示例工程的地址：[https://github.com/oldzhang227/UnityDemos/tree/master/SkinAnimDemo](https://link.zhihu.com/?target=https%3A//github.com/oldzhang227/UnityDemos/tree/master/SkinAnimDemo)， 如有疑问，请评论留言，愿与你一起交流， 关注公众号 **old张** ，持续分享技术干活