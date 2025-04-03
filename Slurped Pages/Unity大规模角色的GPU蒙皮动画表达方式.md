---
source: https://zhuanlan.zhihu.com/p/108725072
tags:
  - Slurp/Unity/GPU-Animation
  - Slurp/Unity/GPU-Instancing
  - Slurp/Unity/动画烘焙
  - Slurp/Unity/骨骼动画
  - Slurp/Unity/动画蒙皮
---
书接上文，上回说道， 烘焙顶点的方法存在着两个缺陷以及一个致命弱点：

1. 信息密度低，顶点数往往要比骨骼节点数要大得多，导致烘焙出来的纹理尺寸大。
2. 无法复用，导致每模型每动作均需要烘焙。
3. 最重要的，做不到动画过渡（当然强行Lerp也可以，但肯定会有穿帮）。

这些都是由于烘焙顶点是一种针对“现象”而非“原因”的技术。驱动顶点运动的是骨骼的运动，因此信息密度最大的方法应该针对骨骼动画的信息而运作。

## 思路

要把骨骼动画烘焙到纹理上以驱动顶点动画。要实现这个目标首先要分拆里面的命题：

- 烘焙到纹理上的到底是骨骼动画的什么信息？
- 顶点如何得知它被什么骨骼所驱动，即如何获取顶点与骨骼的对应和权重？
- 顶点如何被已知的骨骼驱动？

此时，实现的思路就出来了：

- 将骨骼的矩阵烘焙到纹理上
- 将权重和索引写入Mesh中
- 在顶点着色器中读出矩阵做变换

## 烘焙矩阵

首先要解决的是烘焙的信息（即矩阵）如何计算的问题。这里涉及到蒙皮顶点和骨骼的关系问题。

这个问题换一个描述方法，蒙皮上的顶点要如何随骨骼移动而移动？这个问题就明了一些，能够关注本专栏的大手子们必然知道，就像相机渲染需要经过一系列的矩阵运算一样，骨骼的移动必然导致骨骼的变换矩阵发生了改变，而如果我们预先把一系列矩阵运算的结果计算出来，只需要在顶点着色器中读出矩阵然后mul一下，就能达到结果。

这一系列矩阵运算到底是啥呢？

首先肯定是模型空间下的顶点转换到该骨骼节点空间下的顶点；这一步Unity已经提供了，就是 Mesh.bindPoses 。我们来看看文档里咋写的：

> The bind pose is the inverse of the transformation matrix of the bone, when the bone is in the bind pose  
> BindPose是骨骼的转换矩阵的逆矩阵。

BindPose这个说法，可能来源于美术绑定骨骼的时候摆成了 T-Pose，我觉得暂时没有更好的中文称呼。文档下方是这样计算BindPose的：模型的局部转世界乘以骨骼的世界转局部矩阵。

所以使用这个矩阵变换顶点，相当于先把模型空间下的顶点转到世界空间，然后再从世界坐标空间转到骨骼空间。

```CSharp
bones[1] = new GameObject("Upper").transform;
        bones[1].parent = transform;
        // Set the position relative to the parent
        bones[1].localRotation = Quaternion.identity;
        bones[1].localPosition = new Vector3(0, 5, 0);
        // The bind pose is bone's inverse transformation matrix
        // In this case the matrix we also make this matrix relative to the root
        // So that we can move the root game object around freely
        bindPoses[1] = bones[1].worldToLocalMatrix * transform.localToWorldMatrix;
```

然而，骨骼在每帧都会发生平移、旋转、缩放，而骨骼空间的坐标描述不了这个变化。因此我们进行第二步，引入骨骼节点的在世界坐标下的变化信息。

【1】中的实现，是从骨骼节点上溯至根节点，不停的左乘变换矩阵。我觉得有更好的解决方法，就是直接用Transform.localToWorldMatrix。反正烘焙的时候基本上都是在空场景里做的，直接一步到位。这时候，顶点就从骨骼空间转换到了世界空间。

最后，我们实际要用的，还是模型空间内的坐标，因此再将世界空间内的节点变换回骨骼空间。

所以，蒙皮顶点的坐标空间变换是这样的：模型空间-骨骼空间-世界空间-模型空间。

> *开始的时候，我纳闷一件事情，特喵的，bindPose里用了worldToLocalMatrix，我后面再左乘一个localToWorldMatrix，不就白忙活了吗？*  
> *后来我意识到一个误区，就是bindPose，是Mesh静态的数据，是在T-pose下完成绑定时的数据，这里面计算所使用的那个worldToLocalMatrix，并不会随着每帧的运动而变化。因此为了引入时效性信息，自然要从每帧里额外左乘一个localToWorldMatrix进来。*

所以这一部分的代码如下：

```CSharp
Texture2D result = new Texture2D(width, lines, TextureFormat.RGBAFloat, false);
        result.filterMode = FilterMode.Point;
        result.wrapMode = TextureWrapMode.Clamp;
        Color[] colors = new Color[width * lines * 3];
        // 逐帧写入矩阵
        for (int i = 0; i < animFrameCount; i++)
        {
            float time = (float)i / (animFrameCount - 1);
            animation[clip.name].normalizedTime = time;
            animation.Sample();
            // 写入变换后的矩阵
            for (int j = 0; j < bonesCount; j++) 
            {
                System.Action<int, Color> callBack = (index, c) =>
                {
                    if (accuracy == 1)
                    {
                        colors[((i * bonesCount + j) * 3 + index) * accuracy] = c;
                    }
                    else if (accuracy == 2)
                    {
                        Color color1, color2;
                        Split(c, out color1, out color2);
                        colors[((i * bonesCount + j) * 3 + index) * accuracy] = color1;
                        colors[((i * bonesCount + j) * 3 + index) * accuracy + 1] = color2;
                    }
                    else
                    {
                        Color color1, color2, color3;
                        Split(c, out color1, out color2, out color3);
                        colors[((i * bonesCount + j) * 3 + index) * accuracy] = color1;
                        colors[((i * bonesCount + j) * 3 + index) * accuracy + 1] = color2;
                        colors[((i * bonesCount + j) * 3 + index) * accuracy + 2] = color3;
                    }
                };
                Color color = new Color();
                Matrix4x4 matrix = skinnedMeshRenderer.transform.worldToLocalMatrix * bones[j].localToWorldMatrix * bindPoses[j];
                callBack(0, new Color(matrix.m00, matrix.m01, matrix.m02, matrix.m03));
                callBack(1, new Color(matrix.m10, matrix.m11, matrix.m12, matrix.m13));
                callBack(2, new Color(matrix.m20, matrix.m21, matrix.m22, matrix.m23));
            }
        }
        result.SetPixels(colors);
        result.Apply();
        animTex = result;
        return true;
```

## 修改Mesh

虽然我们有了每帧每骨骼的变换信息，但是还有一点，就是一个顶点受哪些骨骼的影响及其程度如何，还没有实现。但是仔细一想就明白，这个索引跟权重是一个Mesh静态的数据。

既然是Mesh静态的，那就直接写到Mesh里，最常见的当然就是 UV通道了。UV是一个Vector2的向量，因此一次只能存一对权重索引数据。如果你对精度提出了更高的要求，那可以用2个UV通道或者4个UV通道。

本文的写法是用2个UV通道，也就是支持一个顶点受两个骨骼的影响。

划掉，Tangent还是不能改的。TANGENT\_SPACE\_ROTATION宏要用到它。

```csharp
private static bool MappingBoneWeightToMeshUV(Mesh mesh, UVChannel weightChannel, UVChannel indexChannel, bool overwrite)
    {
        var boneWeights = mesh.boneWeights;
        List<Vector2> wUV = new List<Vector2>(), iUV = new List<Vector2>();
        mesh.GetUVs((int)weightChannel, wUV);
        mesh.GetUVs((int)indexChannel, iUV);
        if (((wUV != null && wUV.Count != 0) || (iUV != null && iUV.Count != 0)) && !overwrite)
            return false;
        wUV = new List<Vector2>();
        iUV = new List<Vector2>();
        for (int i = 0; i < boneWeights.Length; i++)
        {
            var bw = boneWeights[i];
            iUV.Add(new Vector2(bw.boneIndex0,
                                bw.boneIndex1));
            wUV.Add(new Vector2(bw.weight0, bw.weight1));

        }
        mesh.SetUVs((int)weightChannel, wUV);
        mesh.SetUVs((int)indexChannel, iUV);
        return true;
    }
```

## Shader的工作

剩下的就是在Shader中完成了。先从预存数据的uv中拿出该顶点对应的骨骼和权重；随后在纹理中读出矩阵；最后拿蒙皮顶点做变换即可。

```c
float total = (y * _BoneCount + (int)(index.x)) * 3 * acc;
float4 line0 = readInBoneTex(total);
float4 line1 = readInBoneTex(total + acc);
float4 line2 = readInBoneTex(total + 2 * acc);
float4x4 mat1 = float4x4(line0, line1, line2, float4(0, 0, 0, 1));
total = (y * _BoneCount + (int)(index.y)) * 3 * acc;
line0 = readInBoneTex(total);
line1 = readInBoneTex(total + acc);
line2 = readInBoneTex(total + 2 * acc);
float4x4 mat2 = float4x4(line0, line1, line2, float4(0, 0, 0, 1));
float4 pos = mul(mat1, v.vertex) * weight.x + mul(mat2, v.vertex) * (1 - weight.x);
o.vertex = UnityObjectToClipPos(pos);
// 法线也如此操作
// o.worldNormal = UnityObjectToWorldNormal(mul(mat, float4(v.normal, 0)).xyz);
```

## 一些不得不说的弯路

这篇文章的主体，我已经在三天前就已经写好了，但是迟迟做不出来效果，为什么我会这么蠢呢？

总结了一下，有三个地方：

第一，主体部分沿用了上一篇文章中顶点纹理的代码。导致Texture2D的格式是RGB24，忽略了8位颜色分量不支持负数，需要手动压缩分量到01区间，这点忽略了，导致查了很久。

![RenderDoc里捕捉的数据](https://pica.zhimg.com/v2-54444d1c945e879398378b3f1db8f4ee_1440w.jpg)

![原本的矩阵第一行数据](https://pic4.zhimg.com/v2-40625777f027660f7414fe044b7a6827_1440w.jpg)

![结果就是这样](https://pic2.zhimg.com/v2-ccf602406c85ea389cbfaefcc9f466e7_1440w.jpg)

这一部分的问题，需要看Unity的文档，里头这么写的：

![没标着floating point的就只能到01区间](https://picx.zhimg.com/v2-faff244d345f6c72e1cb029ec08c4caf_1440w.jpg)

第二个，因为只支持两个骨骼，所以不能老老实实的按权重UV里得到的值来写，原本Unity支持的是一个顶点受4个骨骼影响，所以得出的uv值不能这么用：

```c
mul(mat1, v.vertex) * weight.x + mul(mat2, v.vertex) * weight.y;
```

而是应该：

```c
mul(mat1, v.vertex) * weight.x + mul(mat2, v.vertex) * (1 - weight.x);
```

第三个，搞这个东西，肯定要上移动端，移动端肯定还是用RGBA32这类的更加合适。UnityCG.cginc中提供了两个代码，可以把\[0,1)内的浮点数映射到8位颜色分量上：

```csharp
// Encoding/decoding [0..1) floats into 8 bit/channel RGBA. Note that 1.0 will not be encoded properly.
inline float4 EncodeFloatRGBA( float v )
{
    float4 kEncodeMul = float4(1.0, 255.0, 65025.0, 16581375.0);
    float kEncodeBit = 1.0/255.0;
    float4 enc = kEncodeMul * v;
    enc = frac (enc);
    enc -= enc.yzww * kEncodeBit;
    return enc;
}
inline float DecodeFloatRGBA( float4 enc )
{
    float4 kDecodeDot = float4(1.0, 1/255.0, 1/65025.0, 1/16581375.0);
    return dot( enc, kDecodeDot );
}
```

我选择在C#里Encode，Shader里Decode。因此烘焙相关的代码改成如下形式：

```csharp
private static Vector4 EncodeFloatRGBA(float v)
    {
        v = v * 0.01f + 0.5f;
        Vector4 kEncodeMul = new Vector4(1.0f, 255.0f, 65025.0f, 160581375.0f);
        float kEncodeBit = 1.0f / 255.0f;
        Vector4 enc = kEncodeMul * v;
        for (int i = 0; i < 4; i++)
            enc[i] = enc[i] - Mathf.Floor(enc[i]);
        enc = enc - new Vector4(enc.y, enc.z, enc.w, enc.w) * kEncodeBit;
        return enc;
    }

            // 写入变换后的矩阵
            for (int j = 0; j < bonesCount; j++) 
            {
                Matrix4x4 matrix = skinnedMeshRenderer.transform.worldToLocalMatrix * bones[j].localToWorldMatrix * bindPoses[j];
                colors[(i * bonesCount + j) * 12 + 0] = EncodeFloatRGBA(matrix.m00);
                colors[(i * bonesCount + j) * 12 + 1] = EncodeFloatRGBA(matrix.m01);
                colors[(i * bonesCount + j) * 12 + 2] = EncodeFloatRGBA(matrix.m02);
                colors[(i * bonesCount + j) * 12 + 3] = EncodeFloatRGBA(matrix.m03);
                colors[(i * bonesCount + j) * 12 + 4] = EncodeFloatRGBA(matrix.m10);
                colors[(i * bonesCount + j) * 12 + 5] = EncodeFloatRGBA(matrix.m11);
                colors[(i * bonesCount + j) * 12 + 6] = EncodeFloatRGBA(matrix.m12);
                colors[(i * bonesCount + j) * 12 + 7] = EncodeFloatRGBA(matrix.m13);
                colors[(i * bonesCount + j) * 12 + 8] = EncodeFloatRGBA(matrix.m20);
                colors[(i * bonesCount + j) * 12 + 9] = EncodeFloatRGBA(matrix.m21);
                colors[(i * bonesCount + j) * 12 + 10] = EncodeFloatRGBA(matrix.m22);
                colors[(i * bonesCount + j) * 12 + 11] = EncodeFloatRGBA(matrix.m23);
            }

//in shader
float4 readInBoneTex(float total)
{
    float2 newUv = uvConvert(total);
    float2 animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
    float r = DecodeFloatRGBA(tex2Dlod(_AnimTex, float4(animUv, 0, 0)));
    newUv = uvConvert(total + 1);
    animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
    float g = DecodeFloatRGBA(tex2Dlod(_AnimTex, float4(animUv, 0, 0)));
    newUv = uvConvert(total + 2);
    animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
    float b = DecodeFloatRGBA(tex2Dlod(_AnimTex, float4(animUv, 0, 0)));
    newUv = uvConvert(total + 3);
    animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
    float a = DecodeFloatRGBA(tex2Dlod(_AnimTex, float4(animUv, 0, 0)));
    return float4(r, g, b, a) * 100 - 50;
}
```

当然，这样不好，因为这意味着要构建一个矩阵，就要采样12次；支持两个骨骼，就要采样24次。如果要在移动端使用，可以选择用half映射而不是float映射，然后只支持一个骨骼。反正要用到这玩意儿的时候，基本也不太会在乎细节上的品质……

## 总结

本文实现了基于预计算矩阵和GPU的蒙皮动画，跟上文提到的基于预计算顶点纹理的蒙皮动画而言，各有优劣。有句话说，“政治是妥协的艺术”，游戏开发也是这样的，同等情况下没有十全十美的技术。

上文是用空间换效率，本文则是用效率换空间；当然，它们的诞生主要是为了解决大规模角色的批次问题——毕竟，在GC面前，这些消耗都显得可以接受了。
![](https://pica.zhimg.com/v2-7d507e03cbae1250da14eb790880ff22_1440w.jpg)

## Github地址：
[https://github.com/noobdawn/Unity\_GPU-Skinning\_Animation github.com/noobdawn/Unity\_GPU-Skinning\_Animation](https://link.zhihu.com/?target=https%3A//github.com/noobdawn/Unity_GPU-Skinning_Animation)

## 参考资料
【1】 [blog.csdn.net/lzhq1982/](https://link.zhihu.com/?target=https%3A//blog.csdn.net/lzhq1982/article/details/88121451)
【2】 [踏雪寻梅：\[Unity3d手游开发笔记\]骨骼蒙皮动画](https://zhuanlan.zhihu.com/p/87583171)
【3】 [Unity - Scripting API: TextureFormat](https://link.zhihu.com/?target=https%3A//docs.unity3d.com/ScriptReference/TextureFormat.html)
