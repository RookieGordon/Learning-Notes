---
source: https://zhuanlan.zhihu.com/p/108367119
author:
  - "[[知乎专栏]]"
---
项目中要求某场景中实现数十人奔跑，如果用 骨骼动画，那CPU计算蒙皮的开销可太大了。依稀记得 [@陈嘉栋](https://www.zhihu.com/people/2a771414e440d398c4fb925948e5e830) 之前实现过一版，不过当时没细看。于是就拿这个思路继续写了。
# 思路
众所周知的是，因为要在CPU端计算骨骼动画信息，因此 蒙皮网格是不能合批的。反过来说，计算骨骼动画实际也就是在计算蒙皮网格各顶点的位置。假如我们把一段动画中各顶点的位置记录下来，放在静态的网格上进行次序的播放，那么应当是等效的。
拿AnimationClip驱动SkinnedMeshRenderer，在每一帧下都Bake一次，把得到的Mesh的顶点都保存在一张纹理上。这样就完成了将动画烘焙成纹理的任务。
当我们要使用纹理的时候，就从纹理中读出某顶点对应像素的颜色值，并转换成空间位置。如何确定顶点和像素的对应关系呢？这就要用到SV\_VertexID这个语义了。
# 实现
这里我做了一个小小的改进，假如动画长度很短，而模型顶点数又多的话，就会烘出3000\*30这样的图，委实不美。因此只要在Shader中稍加改进，便可以指定烘出的纹理的尺寸了。
```C#
using UnityEngine;
using UnityEditor;
using Sirenix.OdinInspector;
using Sirenix.OdinInspector.Editor;
using System.IO;

public class AnimClip2Tex : OdinEditorWindow {

    const string OutPutDir = "Assets/RoleAssets/clip";

    public static bool UseMsg = true;

    [MenuItem("Tools/动画渲染到纹理")]
    private static void OpenWindow()
    {
        GetWindow<AnimClip2Tex>().Show();
        if (!Directory.Exists(OutPutDir))
            Directory.CreateDirectory(OutPutDir);
    }

    private static void Msg(string info)
    {
        if (!UseMsg) return;
        EditorUtility.DisplayDialog("动画渲染到纹理", info, "确定");
    }

    [Title("欲渲染之蒙皮模型")]
    public SkinnedMeshRenderer skinnedRenderer;
    [Title("播放动画之组件")]
    public Animation animation;
    [Title("欲渲染之动画")]
    public AnimationClip clip;
    [Title("欲渲染之尺寸")]
    [Range(64, 4096)]
    public int width;
    [Title("最大空间长度")]
    [Range(0.1f, 10f)]
    public float maxSpaceSize;
    [Title("信息")]
    [ReadOnly]
    public int vertexCount;
    [ReadOnly]
    public int animFrameCount;
    [ReadOnly]
    public int height;

    public Texture2D tex;

    [Button("采样")]
    private void Build()
    {
        if (!CreateAnimTex(animation, skinnedRenderer, clip, width, vertexCount, animFrameCount, maxSpaceSize, out tex))
        {
            Msg("无法渲染，请检查！");
            return;
        }
        var bytes = tex.EncodeToPNG();
        var name = string.Format("{0}/{1}_{2}.png", OutPutDir, animation.gameObject.name, clip.name);
        File.WriteAllBytes(name, bytes);
        Msg(string.Format("已保存到{0}", name));
        AssetDatabase.Refresh();
        // 修改下导入设置
        TextureImporter timporter = TextureImporter.GetAtPath(name) as TextureImporter;
        if (timporter)
        {
            timporter.filterMode = FilterMode.Point;
            timporter.wrapMode = TextureWrapMode.Clamp;
            timporter.mipmapEnabled = false;
            timporter.textureCompression = TextureImporterCompression.Uncompressed;
            timporter.npotScale = TextureImporterNPOTScale.None;
            timporter.sRGBTexture = true;
        }
        AssetDatabase.Refresh();
    }

    protected override void OnGUI()
    {
        base.OnGUI();
        if (clip != null && animation != null && skinnedRenderer != null && skinnedRenderer.sharedMesh != null)
        {
            vertexCount = skinnedRenderer.sharedMesh.vertexCount;
            animFrameCount = (int)(clip.length * clip.frameRate);
            height = Mathf.CeilToInt((float)vertexCount * animFrameCount / width);
        }
    }

    protected override void Initialize()
    {
        base.Initialize();
    }

    public static bool CreateAnimTex(Animation animation, SkinnedMeshRenderer skinnedMeshRenderer, AnimationClip clip,
        int width, int vertexCount, int animFrameCount, float maxSize, out Texture2D animTex)
    {
        if (vertexCount == 0 || animFrameCount == 0)
        {
            animTex = null;
            return false;
        }
        if (animation.GetClip(clip.name) != null)
            animation.RemoveClip(clip.name);
        animation.AddClip(clip, clip.name);
        animation.Play(clip.name);
        // 开始采样
        int lines = Mathf.CeilToInt((float)vertexCount * animFrameCount / width);
        Texture2D result = new Texture2D(width, lines, TextureFormat.RGBAHalf, false);
        result.filterMode = FilterMode.Point;
        result.wrapMode = TextureWrapMode.Clamp;
        Color[] colors = new Color[width * lines];
        for (int i = 0; i < animFrameCount; i++)
        {
            float time = (float)i / (animFrameCount - 1);
            animation[clip.name].normalizedTime = time;
            animation.Sample();
            Mesh mesh = new Mesh();
            skinnedMeshRenderer.BakeMesh(mesh);
            var vertices = mesh.vertices;
            for(int j = 0; j < vertexCount; j++)
            {
                Color color = new Color();
                var v = vertices[j];
                color.r = v.x / maxSize * 0.5f + 0.5f;
                color.g = v.y / maxSize * 0.5f + 0.5f;
                color.b = v.z / maxSize * 0.5f + 0.5f;
                color.a = 1;
                colors[i * vertexCount + j] = color;
            }
        }
        result.SetPixels(colors);
        result.Apply();
        animTex = result;
        return true;
    }
}
```
这里需要注意两个地方。
首先是需要指定一个采样空间的尺寸，毕竟输出成纹理之后，分量的范围上是\[0,1\]，需要指定采样空间的尺寸$\vec{r}$，这样模型坐标空间中的范围 $[−r,r]$就映射到了颜色空间中的$[0,1]$ 。
第二个就是需要重新导入一次纹理，sRGB和点过滤器是必须要开的，以保证采样结果和计算结果吻合。

Shader没啥说的，就是将uv变换一次：
```c
Shader "Unlit/VertexAnim_Improved"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _AnimTex ("Animation", 2D) = "black" {}
        _VertexCount("Vertex Count", int) = 50
        _FrameCount("Frame Count", int) = 50
        _Interval("Interval", Range(0.001, 1)) = 0.03333
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            sampler2D _AnimTex;
            float4 _AnimTex_TexelSize;
            int _VertexCount, _FrameCount;
            float _Interval;
            
            v2f vert (appdata v, uint vid : SV_VertexID)
            {
                UNITY_SETUP_INSTANCE_ID(v);
                v2f o;
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                float y = _Time.y / _Interval;
                y = floor(y - floor(y / _FrameCount) * _FrameCount);
                float x = vid;

                float total = y * _VertexCount + x;
                float new_y = total / _AnimTex_TexelSize.z;
                float new_x = floor(fmod(new_y, 1.0) * _AnimTex_TexelSize.z);
                new_y = floor(new_y);

                float2 animUv = float2((new_x + 0.5) * _AnimTex_TexelSize.x, (new_y + 0.5) * _AnimTex_TexelSize.y);
                float4 modelPos = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                                // 归零到空间的原点
                modelPos.xyz -= 0.5;
                o.vertex = UnityObjectToClipPos(modelPos);
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv);
                return col;
            }
            ENDCG
        }
    }
}
```

## 精度修正
当然这样做的话还是有不足之处，就是由于在Unity中即便是RGBA32的图像，精度仍然显得不够。精度不够，导致细节处的顶点已经出现了合并和穿插
![](https://pica.zhimg.com/v2-a156dee3b36ae4a7bd900f9f714f7858_1440w.jpg)

为了弥补8位分量精度带来的损失，有必要使用多个分量来进行表达。已知float类型有23位用于有效数字，则我们可以使用两个8位分量或者3个8位分量来进一步修正。一般情况下，两个8位分量已经足够了。
```C#
using UnityEngine;
using UnityEditor;
using Sirenix.OdinInspector;
using Sirenix.OdinInspector.Editor;
using System.IO;

public class AnimClip2Tex : OdinEditorWindow {

    const string OutPutDir = "Assets/RoleAssets/clip";

    public static bool UseMsg = true;

    [MenuItem("Tools/动画渲染到纹理")]
    private static void OpenWindow()
    {
        GetWindow<AnimClip2Tex>().Show();
        if (!Directory.Exists(OutPutDir))
            Directory.CreateDirectory(OutPutDir);
    }

    private static void Msg(string info)
    {
        if (!UseMsg) return;
        EditorUtility.DisplayDialog("动画渲染到纹理", info, "确定");
    }

    [Title("欲渲染之蒙皮模型")]
    public SkinnedMeshRenderer skinnedRenderer;
    [Title("播放动画之组件")]
    public Animation animation;
    [Title("欲渲染之动画")]
    public AnimationClip clip;
    [Title("欲渲染之尺寸")]
    [Range(64, 4096)]
    public int width;
    [Title("最大空间长度")]
    [Range(0.1f, 10f)]
    public float maxSpaceSize;
    [Title("精度")]
    [Range(1, 3)]
    public int accuracy;
    [Title("信息")]
    [ReadOnly]
    public int vertexCount;
    [ReadOnly]
    public int animFrameCount;
    [ReadOnly]
    public int height;

    public Texture2D tex;

    [Button("采样")]
    private void Build()
    {
        if (!CreateAnimTex(animation, skinnedRenderer, clip, width, vertexCount, animFrameCount, maxSpaceSize, accuracy, out tex))
        {
            Msg("无法渲染，请检查！");
            return;
        }
        var bytes = tex.EncodeToPNG();
        var name = string.Format("{0}/{1}_{2}.png", OutPutDir, animation.gameObject.name, clip.name);
        File.WriteAllBytes(name, bytes);
        Msg(string.Format("已保存到{0}", name));
        AssetDatabase.Refresh();
        // 修改下导入设置
        TextureImporter timporter = TextureImporter.GetAtPath(name) as TextureImporter;
        if (timporter)
        {
            timporter.filterMode = FilterMode.Point;
            timporter.wrapMode = TextureWrapMode.Clamp;
            timporter.mipmapEnabled = false;
            timporter.textureCompression = TextureImporterCompression.Uncompressed;
            timporter.npotScale = TextureImporterNPOTScale.None;
            timporter.sRGBTexture = true;
            timporter.alphaIsTransparency = false;
        }
        AssetDatabase.Refresh();
    }

    protected override void OnGUI()
    {
        base.OnGUI();
        if (clip != null && animation != null && skinnedRenderer != null && skinnedRenderer.sharedMesh != null)
        {
            vertexCount = skinnedRenderer.sharedMesh.vertexCount;
            animFrameCount = (int)(clip.length * clip.frameRate);
            height = Mathf.CeilToInt((float)vertexCount * animFrameCount / width);
        }
    }

    protected override void Initialize()
    {
        base.Initialize();
    }

    public static bool CreateAnimTex(Animation animation, SkinnedMeshRenderer skinnedMeshRenderer, AnimationClip clip,
        int width, int vertexCount, int animFrameCount, float maxSize, int accuracy, out Texture2D animTex)
    {
        if (vertexCount == 0 || animFrameCount == 0)
        {
            animTex = null;
            return false;
        }
        if (animation.GetClip(clip.name) != null)
            animation.RemoveClip(clip.name);
        animation.AddClip(clip, clip.name);
        animation.Play(clip.name);
        // 开始采样
        int lines = Mathf.CeilToInt((float)vertexCount * animFrameCount * accuracy / width);
        Texture2D result = new Texture2D(width, lines, TextureFormat.RGB24, false);
        result.filterMode = FilterMode.Point;
        result.wrapMode = TextureWrapMode.Clamp;
        Color[] colors = new Color[width * lines];
        for (int i = 0; i < animFrameCount; i++)
        {
            float time = (float)i / (animFrameCount - 1);
            animation[clip.name].normalizedTime = time;
            animation.Sample();
            Mesh mesh = new Mesh();
            skinnedMeshRenderer.BakeMesh(mesh);
            var vertices = mesh.vertices;
            for(int j = 0; j < vertexCount; j++)
            {
                Color color = new Color();
                var v = vertices[j];
                color.r = v.x / maxSize * 0.5f + 0.5f;
                color.g = v.y / maxSize * 0.5f + 0.5f;
                color.b = v.z / maxSize * 0.5f + 0.5f;
                if (accuracy == 1)
                    colors[i * vertexCount + j] = color;
                else if (accuracy == 2)
                {
                    Color color1, color2;
                    Split(color, out color1, out color2);
                    colors[(i * vertexCount + j) * 2] = color1;
                    colors[(i * vertexCount + j) * 2 + 1] = color2;
                }
                else
                {
                    Color color1, color2, color3;
                    Split(color, out color1, out color2, out color3);
                    colors[(i * vertexCount + j) * accuracy] = color1;
                    colors[(i * vertexCount + j) * accuracy + 1] = color2;
                    colors[(i * vertexCount + j) * accuracy + 2] = color3;
                }
            }
        }
        result.SetPixels(colors);
        result.Apply();
        animTex = result;
        return true;
    }

    private static void Split(Color s, out Color r1, out Color r2)
    {
        r1 = new Color();
        r2 = new Color();
        for (int i = 0; i < 3; i++)
        {
            float t = s[i];
            r1[i] = Mathf.Floor(t * 256) / 256;
            r2[i] = t * 256 - Mathf.Floor(t * 256);
        }
    }

    private static void Split(Color s, out Color r1, out Color r2, out Color r3)
    {
        r1 = new Color();
        r2 = new Color();
        r3 = new Color();
        for (int i = 0; i < 3; i++)
        {
            float t = s[i];
            r1[i] = Mathf.Floor(t * 256) / 256;
            r2[i] = t * 256 - Mathf.Floor(t * 256);
            r3[i] = t * 65536 - Mathf.Floor(t * 65536);
        }
    }
}
```
因为使用了RGB24的纹理，因此无论是Shader还是C#部分均修改了对纹理的接口。Shader这边使用变体，更方便操作。
```C
Shader "Unlit/VertexAnim_Improved"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _AnimTex ("Animation", 2D) = "black" {}
        _VertexCount("Vertex Count", int) = 50
        _FrameCount("Frame Count", int) = 50
        _Interval("Interval", Range(0.001, 1)) = 0.03333
        [KeywordEnum(_1, _2, _3)]_Accuracy("Accuracy", float) = 0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ACCURACY__1 _ACCURACY__2 _ACCURACY__3
            
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            sampler2D _AnimTex;
            float4 _AnimTex_TexelSize;
            int _VertexCount, _FrameCount;
            float _Interval;

            float2 uvConvert(float total)
            {
                float new_y = total / _AnimTex_TexelSize.z;
                float new_x = floor(fmod(new_y, 1.0) * _AnimTex_TexelSize.z);
                new_y = floor(new_y);
                return float2(new_x, new_y);
            }
            
            v2f vert (appdata v, uint vid : SV_VertexID)
            {
                UNITY_SETUP_INSTANCE_ID(v);
                v2f o;
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                float y = _Time.y / _Interval;
                y = floor(y - floor(y / _FrameCount) * _FrameCount);

#if _ACCURACY__1
                float total = y * _VertexCount + vid;
                float2 newUv = uvConvert(total);
                float2 animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                float4 modelPos = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
#endif

#if _ACCURACY__2
                float total = y * _VertexCount * 2 + vid * 2;
                float2 newUv = uvConvert(total);
                float2 animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                fixed4 original = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                newUv = uvConvert(total + 1);
                animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                fixed4 addon = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                float4 modelPos = float4(original.xyz + addon.xyz * 0.00390625, 1);
#endif

#if _ACCURACY__3
                float total = y * _VertexCount * 3 + vid * 3;
                float2 newUv = uvConvert(total);
                float2 animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                fixed4 original = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                newUv = uvConvert(total + 1);
                animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                fixed4 addon = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                float4 modelPos = float4(original.xyz + addon.xyz * 0.00390625, 1);
                newUv = uvConvert(total + 2);
                animUv = float2((newUv.x + 0.5) * _AnimTex_TexelSize.x, (newUv.y + 0.5) * _AnimTex_TexelSize.y);
                addon = tex2Dlod(_AnimTex, float4(animUv, 0, 0));
                modelPos.xyz += addon.xyz / 65536;
#endif

                modelPos.xyz -= 0.5;
                o.vertex = UnityObjectToClipPos(modelPos);
                return o;
            }
            
            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv);
                return col;
            }
            ENDCG
        }
    }
}
```
在使用16位精度的情况下，动画的表现已经足够支撑特写镜头时数十人狂奔而过的考量了，而不会出现五官抖动的情况：
![](https://pic4.zhimg.com/v2-662201cf210172adf3c0c3f5273b4ea9_1440w.jpg)
要更进一步使用24位也不是不可以，但是那样的话以内存和包体换执行效率的性价比就低了。不建议使用。
# 总结
本文立足于之前文章的思路，并在尺寸定制和精度修正上做出了一定的改进。但是从信息的角度考虑还有不足之处。
该方法最大的缺陷在于每个模型对每个动作都要烘焙一次，因为顶点众多，烘焙出来的纹理相当大，这是因为记录的是计算后的信息。从信息的角度考虑，顶点的信息都来自于骨骼动画的信息，因此如果能烘焙骨骼动画信息到纹理，信息密度必然更大更好。
# 参考资料
【1】 [利用GPU实现大规模动画角色的渲染 - 陈嘉栋 - 博客园](https://link.zhihu.com/?target=https%3A//www.cnblogs.com/murongxiaopifu/p/7250772.html)
