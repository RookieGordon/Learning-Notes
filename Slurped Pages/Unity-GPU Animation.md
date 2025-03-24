---
source: https://zhuanlan.zhihu.com/p/413815001
tags:
  - clippings
  - Unity
  - GPU-Instancing
---
目录收起序言原理数据构建动画采样播放驱动拓展

## 序言

> 项目有遇到由大量角色的组合,依此情况由Animation导致的CPU骨骼计算以及GPU 的Batch数量 带来了不可忽视的性能压力.于是总结并整理了一套GPU Animation框架,在动画需求不复杂的情况下由离线计算的贴图数据驱动并在 vertex shader采样,通过降低复杂度与时间换空间的方法降低计算量,同时支持GPU Instance降低Batch压力.

![2位动画角色 1152个实例 实时阴影 各自播放不同的动画 GPU Instance开启](https://picx.zhimg.com/v2-a59bcfd87d4e497db3818e2da9862159_r.jpg)

整个系统工程量较大,重新实现了一套简单的Animation系统,同时有其他方向的细节( EditorWindow,Shader Keywords等)没有在本文列出，若有需求可以在本人持续维护的开源工具库进行调整与测试。也可直接私信作者：
[https://github.com/striter/Unity3D-ToolChain\_StriteR github.com/striter/Unity3D-ToolChain\_StriteR](https://link.zhihu.com/?target=https%3A//github.com/striter/Unity3D-ToolChain_StriteR)
- 参考场景:GPUAnimationSample

---
## 原理
**动画数据与采样:**

通常由一个二维数据组成,第一维度为时间 第二维度为当前帧的数据
采样则由时间换算到的帧数(float) 换算到前后帧索引 并把获取的数据进行插值

- **顶点动画 (Vertex)**

每帧采样前后帧的所有数据(positionOS,normalOS,tangentOS等),进行插值.

最原始的做法,只需要顶点索引(index)即可获取需要的所有信息,效率最高同时体积最大.

```
//伪代码
struct FrameData
{
    float3 positionOS;
    float3 normalOS;
    //ETC
}

float m_Frame;
FrameData[][] m_Frames;    //第一维:动画帧 第二维:顶点索引
void SampleAnimation(int _vertIndex)
{
   int curFrame=floor(m_Frame);
   int nextFrame= (m_Frame+ 1);
   float interpolate=m_Frame-curFrame;
   var curData=m_Frames[curFrame][_vertIndex];
   var nextData=m_Frames[nextFrame];
   float3 positionOS=lerp(curData.positionOS,nextData.positionOS,interpolate);
   float3 normalOS=lerp(curData.normalOS,nextData.normalOS,interpolate);
   //ETC
}
```
- **矩阵动画 (Transform)**

基于骨骼动画数据重建.

顶点数据新加矩阵索引( transformIndexes)以及矩阵权重(transformWeights),根据每帧前后的插值构建对应顶点的矩阵,并对顶点数据进行矩阵操作处理.

相较于顶点动画更为复杂,同时离散的计算并会增加GPU计算量,可以很大程度降低数据体积.

```
//伪代码
float m_Frame;
float3x3[][] m_FrameData;   //第一维度:动画帧 第二维:骨骼索引
float3x3 SampleMatrix(uint _frame,uint4 _indexes,float4 _weights)
{
    return m_FrameData[_frame][_indexes.x]*_weights.x+
    m_FrameData[_frame][_indexes.y]*_weights.y+    //可选屏蔽进行优化
    m_FrameData[_frame][_indexes.z]*_weights.z+
    m_FrameData[_frame][_indexes.w]*_weights.w;
}

void SampleAnimation(uint4 _transformIndexes,float4 _transformWeights,
    float3 _positionOS,float3 _normalOS)
{
   int curFrame=floor(m_Frame);
   int nextFrame= (m_Frame+ 1);
   float interpolate=m_Frame-curFrame;
   float3x3 transformMatrix=lerp(SampleMatrix(curFrame,_transformIndexes,_transformWeights),
    SampleMatrix(nextFrame,_transformIndexes,_transformWeights),
    interpolate );
   float3 postitionOS=transformMatrix*_positionOS;
   float3 normalOS=transformMatrix*_normalOS;
    //ETC
}
```

**数据索引:**

通常涉及到GPU顶点数据读取时,常用的做法是将数据制作成一张贴图,通过texture2d\_lod的方式读取数据.所以把所有动画数据烘在一张图内,并指定前后关键帧与插值,即可在vertex shader阶段采样动画.

同时由于图片是二维格式,所以在vertex阶段需要换算来获取真正的数据位置.

- **顶点动画**

顶点输入:顶点索引

索引方式：X轴: 顶点索引与对应数据 Y轴:关键帧

```
//索引关系的伪代码
uint2 PositionIndex(uint _vertexID,uint _frame){
    return uint2 ((_vertexID * 3) _frame);
}

uint2 NormalIndex(uint _vertexID,uint _frame){
    return  uint2 ((_vertexID * 3 + 1), _frame);
}

uint2 TangentIndex(uint _vertexID,uint _frame){
    return  uint2 ((_vertexID * 3 + 2), _frame);
}
```
- **矩阵动画**

顶点输入:矩阵索引

索引方式: X轴骨骼索引与对应矩阵的3列,Y轴:关键帧

```
//索引关系的伪代码
uint2 Row0Index(uint _transformIndex,uint _frame){
    return uint2 ((_transformIndex* 3) _frame);
}

uint2 Row1Index(uint _transformIndex,uint _frame){
    return  uint2 ((_transformIndex* 3 + 1), _frame);
}

uint2 Row2Index(uint _transformIndex,uint _frame){
    return  uint2 ((_transformIndex* 3 + 2), _frame);
}

float3x3 GetMatrix(uint _transformIndex,uint _frame)
{
    return float3x3(Row0Index(_transformIndex,_frame),
                    Row1Index(_transformIndex,_frame),
                    Row2Index(_transformIndex,_frame));
}
```

动画驱动:

记录每个动画的起始帧,帧长度以及帧率.

```
public struct AnimationTickerClip
{
    public string name;
    public int frameBegin;
    public int frameCount;
    public bool loop;
    public float frameRate;
}
```

累计时间,并通过换算获取对应的动画起始帧/结束帧以及插值

```
float m_TimeElapsed;
AnimationTickerClip m_Clip;
public void TickAnimation(float _deltaTime)
{ 
    m_TimeElapsed += _deltaTime;

    int curFrame;
    int nextFrame;
    float framePassed;
    if (param.loop)
    {
        framePassed = (m_TimeElapsed % m_Clip.length) * m_Clip.frameRate;
        curFrame = floor(framePassed) % m_Clip.frameCount;
        nextFrame = (curFrame + 1) % m_Clip.frameCount;
     }
     else
     {
         framePassed = min(m_Clip.length, m_TimeElapsed) * m_Clip.frameRate;
         curFrame = min(floor(framePassed), m_Clip.frameCount - 1);
         nextFrame = min(curFrame + 1, m_Clip.frameCount - 1);
      }

      curFrame += m_Clip.frameBegin;
      nextFrame += m_Clip.frameBegin;
      framePassed %= 1;
}
```

---

## 数据构建

在编辑器窗口设置,通过原数据生成新数据.

- 模型需要打开Read/Write,如果是矩阵动画需要关闭Optimize GameObject勾选
- 在新系统内不会对原模型及动画进行引用.
![GPU动画烘焙窗口,需要设置原FBX,动画数据以及数据类型](https://picx.zhimg.com/v2-731a42fe38ea73e5bab2c12b8f251e2d_r.jpg)

![生成的数据集合(Scriptable Object),包含烘焙模型,动画贴图及动画驱动数据](https://pic3.zhimg.com/v2-66f49e321fe1cca430ffe41351d03a7c_1440w.jpg)

通过 ***Texture2D*** 与 ***Mesh*** 两个内置库构建模型贴图.

而所有必要的数据信息则可以通过这两个API获取.

- ***AnimationClip.SampleAnimation*** 采样每帧的动画骨骼.
- ***[SkinnedMeshRenderer](https://zhida.zhihu.com/search?content_id=180089362&content_type=Article&match_order=1&q=SkinnedMeshRenderer&zhida_source=entity).BakeMesh*** 构建当前帧Mesh信息.

**顶点动画**

1.对于贴图:只需要获取到对应帧Mesh的所有vertices/normals/tangents等,并按照索引格式写入贴图即可.

2.对于模型:要做的是把所有normals/tangents数据清除(节省体积),只保留vertices与indexes,uvs以及bounds.

![1720个顶点,135个关键帧,有位置以及法线信息](https://pic3.zhimg.com/v2-768d22d72c8cacf45ff700ffe4ccc794_1440w.png)

![对应的输入Mesh, 由于Mesh构建必要Position.否则体积可以更小.](https://pica.zhimg.com/v2-5e049b291927c9a7f0ae557c88a7b9e2_1440w.jpg)

**矩阵动画:**

1.对于贴图:在采样骨骼后获取的所有Transform转换矩阵并记录,需要初始位置( **bindPoses** )

对应index的转换矩阵计算( **bones\[index\].localToWorldMatrix\*bindPoses\[index\])**

计算出转换矩阵后依照索引将列内容填入贴图即可.

2.对于模型:需要记录原模型的Position/Normal/Tangents,以及索引TransformIndexes,权重TransformWeights,目前放在了uv1与uv2内,可以根据需求动态调整.

TransformIndexes即Mesh.BoneIndexes,TransformWeights即Mesh.BoneWeights.

![矩阵动画贴图,体积显著降低](https://pic1.zhimg.com/v2-abd56ef5a53bdda7599c4d5abe30b3be_1440w.jpg)

![矩阵动画模型,多了UV1与UV2 用于矩阵动画采样](https://pic3.zhimg.com/v2-e64cf78d79396eaf2cfd37fbeafbf534_1440w.jpg)

**\*数据存储形式**

个人的做法是把Data做成了MainAsset, Mesh和Texture做成了SubAsset的形式,也可以做成纯数据然后Runtime调用构建的方式.

**\*包围盒判定**

由于GPU端采样模型,所以在构建数据时包围盒将采样所有动画顶点.亦或者根据不同的动画设置不同的包围盒.

**相关脚本:**

- EWGPUAnimationBaker (数据编辑窗口)
- GPUAnimationData (数据格式)
- Window 对应的MenuItem入口：Work Flow/Art/(Optimize) GPU Animation Baker

---

## 动画采样

通过Tex2Dlod (Built-in管线)或 SAMPLE\_TEXTURE2D\_LOD(URP管线)即可在vertex阶段采样贴图数据,同时对于特定uint2数据位置可以通过乘xxxx\_TexelSize.xy的方式对应贴图uv.

对应需要数据驱动\_FrameStart,\_FrameEnd*,\_* FrameInterpolate由cpu端计算与发送,同时为了方便测试/检视逻辑在Properties栏填上对应的栏目.

- **顶点动画**

通过SV\_VertexID,即可知道对应的顶点索引(需要target 3.5及以上)或者可以把顶点id写入顶点数据(uv1等).

```
float3 SamplePosition(uint vertexID,uint frame)
{
    return SAMPLE_TEXTURE2D_LOD(_AnimTex,sampler_AnimTex, float2((vertexID * 2 + .5) * _AnimTex_TexelSize.x, frame * _AnimTex_TexelSize.y), 0).xyz;
}

float3 SampleNormal(uint vertexID,uint frame)
{
    return SAMPLE_TEXTURE2D_LOD(_AnimTex,sampler_AnimTex, float2((vertexID * 2 + 1 + .5) * _AnimTex_TexelSize.x, frame * _AnimTex_TexelSize.y), 0).xyz;
}
            
void SampleVertex(uint vertexID,inout float3 positionOS,inout float3 normalOS)
{
    positionOS = lerp(SamplePosition(vertexID, _FrameBegin), SamplePosition(vertexID, _FrameEnd), _FrameInterpolate);
    normalOS = lerp(SampleNormal(vertexID, _FrameBegin), SampleNormal(vertexID, _FrameEnd), _FrameInterpolate);
}
```
- **矩阵动画**

通过传入的transformIndexes与transformWeights即可插值出对应的矩阵,并与原向量数据做一次矩阵乘法即为当前帧动画的向量.

```
float4x4 SampleTransformMatrix(uint sampleFrame,uint transformIndex)
{
    float2 index=float2(.5h+transformIndex*3,.5h+sampleFrame);
    return float4x4(SAMPLE_TEXTURE2D_LOD(_AnimTex,sampler_AnimTex, index * _AnimTex_TexelSize.xy, 0)
    , SAMPLE_TEXTURE2D_LOD(_AnimTex,sampler_AnimTex, (index + float2(1, 0)) * _AnimTex_TexelSize.xy, 0)
    , SAMPLE_TEXTURE2D_LOD(_AnimTex,sampler_AnimTex,  (index + float2(2, 0)) * _AnimTex_TexelSize.xy, 0)
    ,float4(0,0,0,1));
}

float4x4 SampleTransformMatrix(uint sampleFrame,uint4 transformIndex,float4 transformWeights)
{
        return SampleTransformMatrix(sampleFrame, transformIndex.x) * transformWeights.x
            + SampleTransformMatrix(sampleFrame, transformIndex.y) * transformWeights.y
            + SampleTransformMatrix(sampleFrame, transformIndex.z) * transformWeights.z
            + SampleTransformMatrix(sampleFrame, transformIndex.w) * transformWeights.w;
}

void SampleTransform(uint4 transformIndexes,float4 transformWeights,inout float3 positionOS,inout float3 normalOS)
{
    float4x4 sampleMatrix = lerp(SampleTransformMatrix(_FrameBegin, transformIndexes, transformWeights), SampleTransformMatrix(_FrameEnd, transformIndexes, transformWeights), _FrameInterpolate);
    normalOS=mul((float3x3)sampleMatrix,normalOS);
    positionOS=mul(sampleMatrix,float4(positionOS,1)).xyz;
}
```

**GPU接入后:**

**相关脚本**

- GPUAnimation.hlsl (GPU采样的函数库)
- GPUAnimation\_Example.shader (GPU采样的示例)

---

## 播放驱动

在基于上文构建的GPU动画基类播放完数据后,在Monobehaviour通过实现生命周期与驱动.

通过 **Material.SetPropertyBlock** 设置数据,可以避免材质实例化,同时支持GPU Instance.

  

**\*动画事件**

在原生Animation窗口设置的关键帧可以通过AnimationClip.events直接访问,在动画关键帧数据的基础上记录所有事件信息每帧累计时间时检查是否超过

```
public struct AnimationTickerEvent
{
    public float keyFrame;
    public string identity;
}
//通过Queue制作事件队列亦可
void TickEvents(AnimationTickerClip _tickerClip, float _timeElapsed, float _deltaTime,Action<string> _onEvents)
{
    float lastFrame = _timeElapsed * _tickerClip.frameRate;
    float nextFrame = lastFrame + _deltaTime * _tickerClip.frameRate;

    float checkOffset = _tickerClip.loop ? _tickerClip.frameCount * Mathf.Floor((nextFrame / _tickerClip.frameCount)) : 0;
    foreach (AnimationTickerEvent animEvent in _tickerClip.m_Events)
    {
        float frameCheck = checkOffset + animEvent.keyFrame;
        if (lastFrame < frameCheck && frameCheck <= nextFrame)
            _onEvents(animEvent.identity);
    }
}
```

**\*Transform暴露**

记录需要构建的骨骼与起始位置旋转.

```
public struct GPUAnimationExposeBone
{
    public string name;
    public int index;
    public Vector3 position;
    public Vector3 direction;
}
```

CPU端同步构建一个Transform,并通过Texture.ReadPixel函数采样贴图并设置Transform.

```
Vector4 ReadAnimationTexture(int boneIndex, int row, int frame)
{
     return m_Data.m_BakeTexture.GetPixel(boneIndex * 3 + row, frame);
}

void TickExposeBones(AnimationTickerOutput _output)
{
    if (m_Data.m_ExposeTransforms.Length <= 0)
        return;
    for (int i = 0; i < m_Data.m_ExposeTransforms.Length; i++)
    {
        int boneIndex = m_Data.m_ExposeTransforms[i].index;
        Matrix4x4 recordMatrix = new Matrix4x4();
        recordMatrix.SetRow(0, Vector4.Lerp(ReadAnimationTexture(boneIndex, 0, _output.cur), ReadAnimationTexture(boneIndex, 0, _output.next), _output.interpolate));
        recordMatrix.SetRow(1, Vector4.Lerp(ReadAnimationTexture(boneIndex, 1, _output.cur), ReadAnimationTexture(boneIndex, 1, _output.next), _output.interpolate));
        recordMatrix.SetRow(2, Vector4.Lerp(ReadAnimationTexture(boneIndex, 2, _output.cur), ReadAnimationTexture(boneIndex, 2, _output.next), _output.interpolate));
        recordMatrix.SetRow(3, new Vector4(0, 0, 0, 1));
        m_ExposeBones[i].transform.localPosition = recordMatrix.MultiplyPoint(m_Data.m_ExposeTransforms[i].position);
        m_ExposeBones[i].transform.localRotation = Quaternion.LookRotation(recordMatrix.MultiplyVector(m_Data.m_ExposeTransforms[i].direction));
    }
}
```

**相关脚本**

- AnimationTicker (动画驱动类)
- AnimationTickData (帧动画数据)
- GPUAnimationController (动画驱动类引擎交互,对应数据设置,Transform暴露,动画事件等)
- GPUAnimationInstanceSample(通过Graphics.DrawMeshInstanced绘制的示例)

---

## 拓展

**\*数据压缩**

在顶点动画的坐标处理上,可以加一些新的数据来帮助压缩纹理大小.比如将必须传入的POSITION处理成动画内坐标最大值,同时动画记录0-1的归一化值 **\[0,1\]-\[-1,1\]区间转换**.或者通过 **RGBM** 方式处理贴图,将纹理格式控制到RGBA32内.

**\*矩阵计算精度**

在矩阵计算这块,由于GPU的计算导致多个顶点需要多次采样,则可以通过Keyword对采样范围限制.例如最高精度需要采样所有矩阵并插值,则最低精度只采样第一个矩阵且不插值.

\* **CPU端动画**

渲染压力较大的情况下可以考虑使用顶点动画,借助Mesh函数在CPU端动态构建.

编辑于 2022-11-27 16:09・IP 属地上海 [Unity（游戏引擎）](https://www.zhihu.com/topic/19568806)