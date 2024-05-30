---
link: https://huailiang.github.io/blog/2021/shader/
excerpt: 什么是变体
slurped: 2024-05-24T07:23:46.601Z
title: shader/Variant 的更新测试
---

### 什么是变体

引用Unity官方文档的解释: [ShaderVariant](https://docs.unity3d.com/ScriptReference/ShaderVariantCollection.ShaderVariant.html)

> In Unity, many shaders internally have multiple “variants”, to account for different light modes, lightmaps, shadows and so on. These variants are indentified by a shader pass type, and a set of shader keywords.

Unity的shader资源不仅含有GPU上执行的着色器代码，还包含了渲染状态，属性的定义，以及对应不同渲染管线不同渲染阶段用于的着色器代码，每一小段代码也可能会有不同的编译参数，以对应不同的渲染功能

在带有多个变体的shader代码片段中，最显著的特征就是拥有这些预编译开关如：

```
// unity 内置前向管线编译设置集合，控制光照，阴影等很多相关功能
#pragma multi_compile_fwdbase 
// 自定义功能开关
#pragma shader_feature _USE_FEATURE_A 
// 自定义多编译选项
#pragma multi_compile _USE_FUNCTION_A _USE_FUNCTION_B 
```

有了这些编译开关标记，我们就可以只写很少的shader代码，从而依附在这份骨架代码上，来实现含有细微差异功能的变种shader代码。当然功能越多，这些变体数量也成指数级增长，如何控制这些变体可能产生的数量，也需要较为丰富的经验和技巧。

### multi_compile与shader_feature

multi_compile与shader_feature可在shader中定义宏。两者区别如下图所示：

||multi_compile|shader_feature|
|---|---|---|
|定义方式|`#pragma multi_compile A`|`#pragma shader_feature A`|
|宏的适用范围|所有Shader|所有Shader|
|变体的生成|生成所有的变体|可自定义生成何种变体|
|默认定义的宏|默认定义首个宏|默认定义首个宏（只有一个宏定义时默认为nokeyword）|

##### 1. 定义方式

定义方式中值得注意的是，#pragma shader_feature A其实是 `#pragma shader_feature _ A`的简写，下划线表示未定义宏(nokeyword)。因此此时shader其实对应了两个变体，一个是nokeyword，一个是定义了宏A的。

而`#pragma multi_compile A`并不存在简写这一说，所以shader此时只对应A这个变体。若要表示未定义任何变体，则应写为` #pragma multi_compile __ A`。

##### 2. 宏的适用范围

两种定义方式可以使用在任何shader中，只是各自有一些建议使用情况。

multi_compile定义的宏，如`#pragma multi_compile_fog`，`#pragma multi_compile_fwdbase`等，基本上适用于大部分shader，与shader自身所带的属性无关。

shader_feature定义的宏多用于针对shader自身的属性。比如shader中有_NormalMap这个属性(Property)，便可通过`#pragma shader_feature _NormalMap`来定义宏，用来实现这个shader在material有无_NormalMap时可进行不同的处理。

##### 3. 变体的生成

multi_compile会默认生成所有的变体，因此应当谨慎适用multi_compile，否则将会导致变体数量激增。如：

```
#pragma multi_compile A B C
#pragma multi_compile D E
```

则此时会生成 A D、A E、B D、B E、C D、C E这6中变体。

shader_feature要生成何种变体可用shader variant collection进行自定义设置。

##### 4. 默认定义的宏

当material中的keywords无法对应shader所生成的变体时，Unity便会默认定义宏定义语句中的首个宏，并运行相应的变体来为这个material进行渲染。

multi_compile与shader_feature都默认定义首个宏，如下表所示:

| 宏定义语句                          | 默认定义的宏            |
| ------------------------------ | ----------------- |
| `#pragma shader_feature A`     | nokeyword(存在简写问题) |
| `#pragma shader_feature A B C` | A                 |
| `#pragma multi_compile A`      | A                 |
| `#pragma multi_compile A B C`  | A                 |

##### 项目中shader变体的生成方式主要有三种，其优缺点如下图所示：

|生成方式|优点|缺点|
|---|---|---|
|shader与material打在一个包中|变体根据material中的keywords自动生成|1. 多个不同的material包中可能存在相同的shader变体，造成资源冗余.  <br>2.若在程序运行时动态改变material的keyword，使用shader_feature定义的宏，其变体可能并没有被生成|
|Shader单独打包，使用multi_compile定义全部宏|全部变体都被生成，不会发生需要的变体未生成的情况|1.生成的变体数量庞大，严重浪费资源|
|Shader单独打包，shader_feature（需要使用ShaderVariantCollection生成变体）与multi_compile（还是会生成所有变体）结合使用|能够有效控制shader_feature变体数量|1.如何确定哪些变体需要生成  <br>2.容易遗漏需要生成的变体，特别是需要动态替换的变体|

#### Shader中有多个Pass时变体的生成规则

a.读取ShaderVariantCollection中已存在的变体，获取它们的Keywords。

b. 将这些Keywords分别与每个Pass的多组Keywords列表求交集，取交集中Keywords数量最多得那组。

c. 用得到的Keywords与对应的PassType生成ShaderVariant，并添加到ShaderVariantCollection中。

d. 若得到得交集中有新的Keywords，则回到b。

上述过程类似递归。例如：  
Shader 中有 ForwardBase、ForwardAdd、Normal 三种PassType(以下为了方便简称Base、Add、 Normal)。定义的宏如下：

| Base                                                                                       | Add                                                        | Normal                                                                                    |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `#pragma shader_feature A`  <br>`#pragma shader_feature B`  <br>`#pragma shader_feature C` | `#pragma shader_feature A`  <br>`#pragma shader_feature E` | `#pragma shader_feature A` <br>`#pragma shader_feature B`  <br>`#pragma shader_feature E` |

  此时若ShaderVariantCollection中包含的变体是 Base ABC，Add AE。则此时生成的变体为：这三种PassType的默认定义的宏(nokeyword)所对应的变体(3个)以及原先直接包含的Base ABC、Add AE。除此之外Unity还会额外生成Add A、Base A、Normal A、Normal AB、 Base AB、Normal AE这6个变体。

```
ABC ∩ Add AE -> Add A (A is NewKeyword)
  A ∩ Base ABC -> Base A
  A ∩ Normal ABE -> Normal A
ABC ∩ Normal ABE -> Normal AB (AB is NewKeyword)
  AB ∩ Base ABC -> Base AB
AE ∩ Normal ABE -> Normal AE
```

#### 变体的调用规则

  当collection将变体准确生成后，便能在运行时通过修改material中的keywords来实现对不同变体的调用。

  假设某collection生成的变体只有Forward ABC，Forward ABE，Forward nokeyword这三种，则此时调用关系如下：

|Material中的Keywords|调用的变体|解释|
|---|---|---|
|A B C|Forward A B C|正常匹配|
|A B|Forward nokeyword|没有匹配的变体，调用首个被定义的宏 所对应的变体|
|A B C D|Forward A B C|调用交集中keyword数量多的变体  <br>ABCD ∩ ABC = ABC  <br>ABCD ∩ ABE = AB|
|A B C E|Forward A B C|交集中keyword数量相同，在collection中谁在前就调用谁|
|A B E C|Forward A B C|与在material中的定义顺序无关|

### 着色器变种的筛选

添加过多的特性使我们的着色器变得臃肿，导致最后生成大量的着色器变种。我们可以尝试使用shader-feature编译指令，但是这样的话，在发布时只会包含当前使用的材质中开启的关键字。而 multi_compile 指令不会有这种限制。

Unity在发布时会基于场景设置自动帮我们剔除一些关键字keywords，比如LIGHTMAP_ON,DYNAMICLIGHTMAP_ON, INSTANCING_ON等。但即使这样，在发布时还是会剩下很多我们不会用到的关键字。所以Unity提供了一个方法，允许我们在发布时自己选择跳过部分着色器变种。

#### Preprocessing Shaders

发布时，Unity编辑器会寻找实现了IPreprocessShaders接口的类（定义在UnityEditor.Build中）。Unity会为这个类创造一个实例，接着将着色器变种传给它用于剔除。所以我们在Editor文件夹中定义这样一个类。

```
using UnityEditor.Build;
 
public class MyPipelineShaderPreprocessor : IPreprocessShaders { }
```

这个接口要求我们实现两件事，首先是一个叫做callbackOrder的只读属性，它返回一个整型，表示该预处理的调用序号，以防存在多个实现该接口的类，而调用顺序不确定。我们返回0就可以了。

```
public int callbackOrder { get { return 0; } }
```

然后是方法，它传入shader、 ShaderSnippetData、和一列表的shadercompilerData，其中包含了着色器变种的设置，我们先打印一下看看着色器的名字。

```
using UnityEditor.Rendering;
using UnityEngine;
 
public class MyPipelineShaderPreprocessor : IPreprocessShaders 
{
    public void OnProcessShader(Shader shader, 
    ShaderSnippetData snippet, IList<ShaderCompilerData> data) 
    {
        Debug.Log(shader.name);
    }
}
```

现在如果我们发布项目就看到一大串的着色器名字被打印出来。有些是我们自己的shader，有些则是默认的着色器，你可以在project settings的Graphic面板里对这些进行管理。另外还有许多的重复，那是因为编译程序分离了shader变种，但是我们不需要担心他的实际顺序和分组。

#### 只在自己的pipeline下处理

发布时，所有定义的预处理程序都会被调用。所以我们前面在项目中写的预处理总是会被调用，即使项目并没有使用我们的pipeline。为了防止干涉其他的pipeline，我们需要判断当前使用的pipeline是否是我们自己写的。我们可以通过GraphicsSettings.renderPipelineAsset来获取当前的pipeline，然后来判断它是不是MyPipelineAsset类型的。

```
using UnityEngine.Rendering;
 
public class MyPipelineShaderPreprocessor : IPreprocessShaders {
	
    public void OnProcessShader(Shader shader, 
    ShaderSnippetData snippet, IList<ShaderCompilerData> data)
    {
        if (!(GraphicsSettings.renderPipelineAsset is MyPipelineAsset)) 
        {
            return;
        }
        Debug.Log(shader.name);
    }
}
```

### Variants 更新

#### 测试案例一：

使用ShaderVariantCollection（后续简称为 SVC），记录所有用到的variant。

将SVC和shader打入一个Shader AssetBundle。将材质打成Material AssetBundle.

运行时加载Shader AssetBundle，取SVC，WarmUp，再加载Material AssetBundle。

对应到 [例子](https://github.com/huailiang/Variants_Proj) 中 variants 的场景中， 先选中两个 prefab 和 material， 右键 点击生成 BuildBundle - Mat Sep,在 StreamingAssets 目录下，可以看见生成的 bundle.

![](https://huailiang.github.io/img/post-unity/var1.jpg)

<上面两个是直接从 prefab 中加载出来， 下面两个使用的是从 Assetbundle 中加载而来. 左边使用的是shader_feature, 右边使用的是 multi_compile>

SVC 中 只开启了 绿色

![](https://huailiang.github.io/img/post-unity/var2.jpg)

从 Bundle 中加载从来的 cube 变成红色（即默认_CL_R）， 说明使用 shader_feature 在没有对应的 Variant打进bundle 的时候会退变使用第一个， 而 multi_compile 则不受影响。 而 当 shader_feature 存在对应的 Varaiant 的时候， 则表现是正常的。

![](https://huailiang.github.io/img/post-unity/var3.jpg)

使用如下代码加载对应的 SVC:

```
void OnGUI()
{
    if (GUI.Button(new Rect(20, 140, 200, 100), "LoadVariants - Mat"))
    {
        Profiler.BeginSample("LoadVariants");
        LoadVariants();
        LoadMat("mat_shaderfeature");
        LoadMat("mat_multicompile");
        LoadCube("cubemulticompile", new Vector3(2, 0, 0));
        LoadCube("cubefeature", new Vector3(-2, 0, 0));
        Profiler.EndSample();
    }
}

private void LoadVariants()
{
    var pat = Path.Combine(prefix, "shader");
    var b = AssetBundle.LoadFromFile(pat);
    var svc = b.LoadAsset<ShaderVariantCollection>("MultiShaderVariants");
    svc.WarmUp();
    // svc的WarmUp就会触发相关Shader的预编译，触发预编译之后再加载Shader Asset即可
    // b.LoadAllAssets<Shader>();
    b.LoadAllAssets<Material>();
}

private void LoadMat(string mat)
{
    var pat = Path.Combine(prefix, mat);
    var b = AssetBundle.LoadFromFile(pat);
    b.LoadAllAssets<Material>();
}

private void LoadCube(string name, Vector3 pos)
{
    var pat = Path.Combine(prefix, name);
    var b = AssetBundle.LoadFromFile(pat);
    var obj = b.LoadAsset<GameObject>(name);
    var go = GameObject.Instantiate(obj);
    go.name = name + "...";
    go.transform.position = pos;
    b.Unload(false);
}
```

#### 测试案例二：

SVC、shader和Material打成一个包。

依旧是 [例子](https://github.com/huailiang/Variants_Proj) 中 variants 的场景中， 此次只选中两个 prefab， 右键 点击生成 BuildBundle - Mat Join, Material 就会和 shader/SVC 打到一个 Bundle 中。运行时我们不再单独加载 Material：

```
Profiler.BeginSample("LoadVariants");
LoadVariants();
LoadCube("cubemulticompile", new Vector3(2, 0, 0));
LoadCube("cubefeature", new Vector3(-2, 0, 0));
Profiler.EndSample();
```

此次我们看到 无论 shader_feature 对应的 variant 是否对应在 svc中， 则表现都正确。坏处就是所有的资源都关联在一个 bundle 中了。

![](https://huailiang.github.io/img/post-unity/var3.jpg)

##### 三个原则：

　1.如果shader没有与使用它的材质打在一个AB中,那么shader_feature的所有宏相关的代码都不会被包含进AB包中(有一种例外,就是当shader_feature _A这种形式的时候是可以的),这个shader最终被程序从AB包中拿出来使用也会是错误的(粉红色).

　　2.把shader和使用它的材质放到一个AB包中,但是材质中没有保存任何的keyword信息(你再编辑器中也是这种情况),shader_feature会默认的把第一个keyword也就是上面的_A和_C(即每个shader_feature的第一个)作为你的选择。而不会把_A _D,_B _C,_B _D这三种组合的代码编译到AB包中。

　　3.把shader和使用它的材质放到一个AB包中,并且材质保存了keyword信息(_A _C)为例,那么这个AB包就只包含_A _C的shaderVariant.

### 关于Shader.Find

关于Shader.Find，个人猜测如下：

Unity内部使用一个字典或者HashSet来支持Shader.Find，这里暂且叫它ShaderMap。ShaderMap的键是ShaderLab语法中的名字；值是Shader文件的GUID。

ShaderMap生成于Build项目时，保存了来自三个地方的shader cache引用关系：

1. Resources中的shader或Resources其中其他资源引用到的shader
    
2. 任意场景中引用到的shader
    
3. StreamingAssets中Asset Bundle内的Shader。 运行时使用ShaderFind，只能找到这些Shader，如果对应GUID的shader不存在，查找就会失败，即使热更新后加入了新的Asset Bundle中含有同名Shader（即ShaderLab语法同名）。
    
4. 目前没有办法在发布以后动态更新ShaderMap。
    

![](https://huailiang.github.io/img/post-unity/var5.png)

### 性能测试

写一个uber shader, 最终出包时不要有 Material, 通过自己定义的 bytes 文件来记录材质参数（贴图路径、颜色等），Shader 和 SVC 打包到同一个Assetsbundle 中。

运行时 new 一个使用uber shader的Material（或者 MaterialPropertyBlock), 读取 bytes 文件里参数初始化 Material， 然后通过 keyword 来开启不同的效果和算法。

![](https://huailiang.github.io/img/post-unity/var4.jpg)

使用ShaderVariantCollection来WarmUp，而不是全部WarmUp，是为了优化Shader.CreateGpuProgram(创建CPU执行程序片段)

使用ClearCurrentShaderVariantCollection和SaveCurrentShaderVariantCollection来计算生成多个ShaderVariantCollection，多帧进行WarmUp

变种太多会导致ShaderLab内存占用变大，Shader.Parse(编译Shader)和Shader.CreateGpuProgram(创建CPU执行程序片段)占用CPU时间变长

## 参考

- [Unity中Shader是否可以热更新的测试](https://www.pianshen.com/article/92971003031/)
- [Unity的Shader加载编译优化](https://blog.csdn.net/Rhett_Yuan/article/details/90483236)
- [一种Shader变体收集和打包编译优化的思路](https://github.com/lujian101/ShaderVariantCollector)
- [Unity的Shader加载解析和ShaderVariantCollection的warmup](https://answer.uwa4d.com/question/5ce5467ad1d3d045c846d769)
- [UnityShaderVariant的一些探究心得](https://blog.csdn.net/long0801/article/details/77413453?utm_source=blogxgwz8)
- [Unity Doc IPreprocessShaders](https://docs.unity3d.com/cn/2019.3/ScriptReference/Build.IPreprocessShaders.html)
- [PCSSLight 中使用ShaderVariantCollection的 Demo](https://github.com/TheMasonX/UnityPCSS/blob/7ebf495e0366cdb8805af1cf6c692455d06493c9/Assets/PCSS/Scripts/PCSSLight.cs)