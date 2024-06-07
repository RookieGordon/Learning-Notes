---
link: https://blog.csdn.net/linxinfa/article/details/122390621
byline: 成就一亿技术人!
excerpt: 文章浏览阅读6.3w次，点赞503次，收藏885次。【游戏开发探究】Unity
  Addressables资源管理方式用起来太爽了，资源打包、加载、热更变得如此轻松（Addressable Asset System |
  简称AA）_unity aa
tags:
  - slurp/unity-aa
slurped: 2024-06-07T09:32:27.031Z
title: 【游戏开发探究】Unity Addressables资源管理方式用起来太爽了，资源打包、加载、热更变得如此轻松（Addressable Asset
  System | 简称AA）_unity aa-CSDN博客
---

#### 文章目录

- - - [一、前言](https://blog.csdn.net/linxinfa/article/details/122390621#_2)
        - [二、为什么推荐使用Addressables](https://blog.csdn.net/linxinfa/article/details/122390621#Addressables_5)
        - [三、Addressables基础操作教程](https://blog.csdn.net/linxinfa/article/details/122390621#Addressables_13)
        - - [1、下载Addressables插件](https://blog.csdn.net/linxinfa/article/details/122390621#1Addressables_14)
            - [2、创建Addressables Settings](https://blog.csdn.net/linxinfa/article/details/122390621#2Addressables_Settings_29)
            - [3、给Group添加资源](https://blog.csdn.net/linxinfa/article/details/122390621#3Group_39)
            - [4、创建新的Group](https://blog.csdn.net/linxinfa/article/details/122390621#4Group_53)
            - [5、设置Build Path与Load Path](https://blog.csdn.net/linxinfa/article/details/122390621#5Build_PathLoad_Path_72)
            - [6、修改RemoteBuildPath和RemoteLoadPath](https://blog.csdn.net/linxinfa/article/details/122390621#6RemoteBuildPathRemoteLoadPath_82)
            - [7、打Addressable资源包](https://blog.csdn.net/linxinfa/article/details/122390621#7Addressable_91)
            - [8、打Android APK](https://blog.csdn.net/linxinfa/article/details/122390621#8Android_APK_113)
            - [9、加载Addressable资源](https://blog.csdn.net/linxinfa/article/details/122390621#9Addressable_127)
            - - [9.1、方式一：通过Addressable Name来加载资源](https://blog.csdn.net/linxinfa/article/details/122390621#91Addressable_Name_130)
                - [9.2、方式二：通过AssetReference来加载资源](https://blog.csdn.net/linxinfa/article/details/122390621#92AssetReference_208)
            - [10、Addressable资源三个加载模式](https://blog.csdn.net/linxinfa/article/details/122390621#10Addressable_248)
            - - [10.1、Use Asset Database (fastest)](https://blog.csdn.net/linxinfa/article/details/122390621#101Use_Asset_Database_fastest_255)
                - [10.2、Simulate Groups (advanced)](https://blog.csdn.net/linxinfa/article/details/122390621#102Simulate_Groups_advanced_257)
                - [10.3、Use Exising Build(requires built groups)](https://blog.csdn.net/linxinfa/article/details/122390621#103Use_Exising_Buildrequires_built_groups_269)
            - [11、加载远程Addressable资源](https://blog.csdn.net/linxinfa/article/details/122390621#11Addressable_296)
            - - [11.1、启用Hosting Services](https://blog.csdn.net/linxinfa/article/details/122390621#111Hosting_Services_298)
                - [11.2、加载远程包的柯南图片](https://blog.csdn.net/linxinfa/article/details/122390621#112_308)
                - [11.3、Addressables是如何知道去哪里加载资源的](https://blog.csdn.net/linxinfa/article/details/122390621#113Addressables_339)
                - [11.4、打个APK包瞧瞧](https://blog.csdn.net/linxinfa/article/details/122390621#114APK_364)
            - [12、如何把Group里的资源打成多个bundle文件](https://blog.csdn.net/linxinfa/article/details/122390621#12Groupbundle_374)
            - [13、使用Labels对Group内的资源进行二级分组](https://blog.csdn.net/linxinfa/article/details/122390621#13LabelsGroup_389)
            - - [13.1、新建Label](https://blog.csdn.net/linxinfa/article/details/122390621#131Label_392)
                - [13.2、给资源设置Label](https://blog.csdn.net/linxinfa/article/details/122390621#132Label_399)
                - [13.3、修改Bundle Mode为Pack Together By Label](https://blog.csdn.net/linxinfa/article/details/122390621#133Bundle_ModePack_Together_By_Label_406)
                - [13.3、一个资源标记多个Label](https://blog.csdn.net/linxinfa/article/details/122390621#133Label_411)
            - [14、批量加载同一个Label的所有资源（AssetLabelReference）](https://blog.csdn.net/linxinfa/article/details/122390621#14LabelAssetLabelReference_416)
            - [15、打资源热更包](https://blog.csdn.net/linxinfa/article/details/122390621#15_442)
            - - [15.1、开启Build Remote Catalog](https://blog.csdn.net/linxinfa/article/details/122390621#151Build_Remote_Catalog_443)
                - [15.2、打包Addressable资源包](https://blog.csdn.net/linxinfa/article/details/122390621#152Addressable_446)
                - [15.3、加载小兰的图片](https://blog.csdn.net/linxinfa/article/details/122390621#153_452)
                - [15.4、打成APK](https://blog.csdn.net/linxinfa/article/details/122390621#154APK_477)
                - [15.5、替换小兰的图片](https://blog.csdn.net/linxinfa/article/details/122390621#155_480)
                - [15.6、打热更包，Update a Previous Build](https://blog.csdn.net/linxinfa/article/details/122390621#156Update_a_Previous_Build_485)
                - [15.7、上传热更包](https://blog.csdn.net/linxinfa/article/details/122390621#157_494)
                - [15.8、热更测试](https://blog.csdn.net/linxinfa/article/details/122390621#158_497)
            - [16、提前检测更新并下载（预下载）](https://blog.csdn.net/linxinfa/article/details/122390621#16_500)
            - [17、Addressable资源释放](https://blog.csdn.net/linxinfa/article/details/122390621#17Addressable_633)
            - [18、打包工具集成Addressable打包流程](https://blog.csdn.net/linxinfa/article/details/122390621#18Addressable_770)
        - [四、答疑补充（Q&A）](https://blog.csdn.net/linxinfa/article/details/122390621#QA_869)
        - - [1、Addressables加载场景进度监听](https://blog.csdn.net/linxinfa/article/details/122390621#1Addressables_871)
        - [五、完毕](https://blog.csdn.net/linxinfa/article/details/122390621#_910)

#### 一、前言

嗨，大家好，我是新发。  
之前就有看过`Unity`的`Addressable Asset System`，简称`AA`，但那时候这个功能刚出来，出于稳定性考虑，所以暂时没有去使用它。现在，它已经迭代到`1.16.19 Release`版本了（中国版是`1.19.16`），经过了时间考验，可以拿出来讲讲啦，网上其实已经有不少讲`Addressables`系统的文章，不过很多不是最新版的教程，今天我就来写一下最新版的`Addressables`系统的使用教程吧~

#### 二、为什么推荐使用Addressables

我在之前的好几篇文章中都介绍过`Unity`加载资源的几种方式，我还画过一个图，详细可以看我之前写的这篇文章：[《Unity游戏开发——新发教你做游戏（三）：3种资源加载方式》](https://blog.csdn.net/linxinfa/article/details/108894280)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a9c72f2491b043b19c9fdbdde1c7b76f.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
可以看出来，资源的加载方式要根据应用场景进行区分，要注意资源存放的文件夹，要注意不同平台下的差异，如果使用`AssetBundle`形式，加载的时候要小心`AB`包之间的依赖关系，我之前也写了一篇文章讲如何去加载`AB`的依赖资源，[《Unity 打包与加载AssetBundle（加载对应的依赖）》](https://blog.csdn.net/linxinfa/article/details/100143530)  
如果要做资源热更新，也要自己去写工具实现增量资源包的打包，然后自己实现热更检测、资源下载、`MD5`比对，解压等等逻辑，我之前还专门写了一篇文章讲了热更新的流程，[《【游戏开发高阶】从零到一教你Unity使用ToLua实现热更新（含Demo工程 | LuaFramework | 增量 | HotUpdate）》](https://blog.csdn.net/linxinfa/article/details/119493890)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/dde20ad0eec247f4ab0b54d22204bd88.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
相信你看完我的这些文章，就会吐槽，哇，好麻烦啊，对于新手来说，可能就是劝退，现在呢，不用怕了，`Addressables`系统统统搞定，用起来实在是太香了，本博主强烈推荐！

#### 三、Addressables基础操作教程

##### 1、下载Addressables插件

点击菜单`Window / Package Manager`，打开插件包管理界面，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/959c32d2696f4e259811a34943dd8597.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_18,color_FFFFFF,t_70,g_se,x_16)  
搜索`addressables`，可以看到有两个插件包，带`.CN`结尾的是中国增强版，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/470551554a6246cd89e59146e9b238a4.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这里要补充说一下，`Addressables`的打包方式其实也是`AssetBundle`格式，只是在此基础上做了一层封装，方便进行管理（比如打包、加载、依赖等）。而我们知道，没有加密的`AssetBundle`是可以使用`AssetStudio`等工具轻易进行资源逆向的，

> 注：`AssetStudio`资源逆向工具开源地址：[https://github.com/Perfare/AssetStudio](https://github.com/Perfare/AssetStudio)

`Addressables.CN`版本会对`AssetBundle`做加密处理，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8a17686ecb1c4863b102f24dc75d4a28.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
为了方便下文演示`资源逆向`，我这里就先下载`不带.CN`结尾的版本，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5e7b8b42d97845d8b35f5f260e2b882a.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

> 注：实际项目中，建议大家下载`Addressables.CN`版本。

安装成功后，可以看到多出了一个`Window / Asset Management / Addressables`菜单，![在这里插入图片描述](https://img-blog.csdnimg.cn/9f18796e21f54548aa3ea953e826590b.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 2、创建Addressables Settings

点击`Groups`菜单，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ee95186b4d314612838504fdcdd8cdef.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
点击`Create Addressables Settings`按钮，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/29446222d60a4e34872034ac10bfddd1.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
此时工程目录中会生成一个`AddressableAssetsData`文件夹，里面有很多设置文件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0d42da47eab14d0f939fc95dcb31c5b3.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们看回`Addressables Groups`窗口，可以看到它默认创建了一个组：`Default Local Group （Default）`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c9272615412b4dc3bb72ef8d7293a054.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
`Addressables` 默认是按`Group`为颗粒进行`AssetBundle`打包的，比如我把资源`A、B、C`都放在这个`Default Local Group`组里，那么它们会被打在同一个`AssetBundle`中（我们也可以修改成按单独的资源文件为颗粒进行打包，下文我会讲如何设置），下面我演示一下如何给`Group`添加资源。

##### 3、给Group添加资源

我这里先随便制作两个预设，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3547297bd8fb4f5eaea1ae9b4a3e9883.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f5a22ef2d0454da19cab26059d545745.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
放在`Prefabs`文件夹中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5a731df63b724733a9652d6ee7db6f01.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
文件名字可以任意起，注意不要跟`Unity`默认的文件系统文件夹名字相同，比如`Resources`、`StreamingAssets`等，除非你真的是想使用这些特定目录的功能，

接着我们把预设文件直接拖到对应的`Group`中即可，如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/1dbe4655e4244bce8c00a282cc596380.gif)

> 注：我演示的是预设资源，你也可以是其他任意的资源，比如声音、图集、动画、材质等等）

选中资源文件，在`Inspector`窗口中勾选`Addressable`，它也会自动添加到默认的`Group`中，如下  
![请添加图片描述](https://img-blog.csdnimg.cn/62423c0308f748e2b0e283b686a8e6c5.gif)

##### 4、创建新的Group

上面的默认`Group`一般是作为`包内资源`，现在我们创建一个新的`Group`作为`包外资源`的组（通过远程加载资源）。  
如下，在`Addressables Groups`窗口中，点击左上角的`Create`按钮，点击`Group / Packed Assets`菜单，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/507e82739d6a4dc497f727b4aba32473.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
此时会创建一个新的`Group`，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2da10e93356544e1a845324f8d138c17.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们右键它，可以对它重命名，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a3e49f525d7a4744b1f9536daec7d1e0.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这里我就将其重命名为`RemoteGroup`吧，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/cbe5683259ef470ba117bb63db9aee67.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
其实每个`Group`都是一个配置文件，可以在`AddressableAssetsData / AssetGroups`目录中找到对应的文件，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0c6678367ed34b67ac5bde100ac9a44b.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
如果你用文本编辑器打开它，就会看到它里面是`YAML`格式的配置，比如打开`Default Local Group`，可以看到它里面记录了包含的资源文件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7901aca19c734c06ae7c4dcd50bf01d3.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
继续我们的操作，下面我们给这个`RemoteGroup`添加资源，我找了一张柯南的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6130e70ef0cd4cd588096cfc2b73b722.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
把柯南图片拖到`RemoteGroup`中，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6fc163e9375d48739549ea7ae0686aa7.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
现在`RemoteGroup`如何打成一个包体外的资源包呢？又如何去加载这些`Group`资源包呢？请继续往下看~

##### 5、设置Build Path与Load Path

我们选中`RemoteGroup`，在`Inspector`窗口中，将`Build Path`改为`RemoteBuildPath`，将`Load Path`改为`RemoteLoadPath`，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e0c73c27446e4a6393741b1442bf4c52.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这样子，`RemoteGroup`打出来的资源就不会在包体内了，它会被打到工程目录的`ServerData/Android`目录中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7c830e6cc51f44f48387ab6e0565af14.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
而加载的时候，会去远程`http://localhost/Android`这个地址加载（这里是`localhost`，我们可以改成别的`IP`或域名地址）  
![在这里插入图片描述](https://img-blog.csdnimg.cn/27691bb0ac034868a5f45ef6ccba26ca.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_19,color_FFFFFF,t_70,g_se,x_16)  
画个图  
![在这里插入图片描述](https://img-blog.csdnimg.cn/637755904ca94478b21e3c83f21e0809.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 6、修改RemoteBuildPath和RemoteLoadPath

如果你想修改`RemoteBuildPath`和`RemoteLoadPath`，可以在`Addressables Groups`窗口中点击`Manage Profiles`菜单，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ba427049bea24da1a80c4610bc645027.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
也可以点`Window / Asset Management /Addressables / Profiles`菜单，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7263c9b4f39446f180eed15821ddb229.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
此时会打开`Addressables Profiles`窗口，我们可以修改修改`RemoteBuildPath`和`RemoteLoadPath`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2f75311bbc574e00ad90b287df294e7f.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这里我先不修改，下文搭建`Web`服务器后再来改`RemoteLoadPath`。

##### 7、打Addressable资源包

在`Addressables Groups`窗口中，点击`Build / New Build / Default Build Script`，就会开始打`Addressable`资源包了，等它打包完毕即可，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1029e3898f1f449d9ba5d6a4cb006575.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
上文中我们建了两个`Group`，其中`Default Local Group`作为包体内的资源包，`RemoteGroup`作为包体外的资源包，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/41612243b6624c6ab6160732b4872ad2.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
现在我们去看看它们分别`Build`到哪里去了吧~  
首先看下`Default Local Group`，可以看到它的`Build Path`是在`Library/com.unity.addressables/aa/Android/Android`中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8e8e6a1631d040a7b479528c155517c1.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们进如到这个目录中，可以看到对应的`.bundle`文件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/10c84c925c3b40e7a384e2d72c32f3d4.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
其实它就是一个`AssetBundle`格式的文件，我们可以使用`AssetStudio`对它进行逆向，可以看到逆向后，里面正是我们上文中添加的两个预设文件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/725c96ae1ae54a599c1065585f4f9595.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
接着我们看下`Remote Group`打出来的资源包，它是在`ServerData/Android`目录中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/72feb0a1469741a78a1ebc62e8ce2ade.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我进入工程目录的`ServerData/Android`目录中，可以看到`RemoteGroup`的资源包，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b7ad75ef4da04bc28139dbae18116256.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)画个图  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c2123c53f00242bd904509d559b9ab06.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

同样使用`AssetStudio`对它进行逆向，可以看到我们的柯南就在里面~  
![在这里插入图片描述](https://img-blog.csdnimg.cn/804ecc2351834175bed9a5b61fbac356.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 8、打Android APK

现在，我们打个`Android`的`APK`包看看，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8fdd6a3696144df8a1b13013a35fa11c.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
正常打出`APK`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d4d9b135d445438289170a6fe18b2778.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们把`.apk`改为`.zip`，然后使用`7z`等解压工具解压它，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b162835b49de43c495df22fe2cf33998.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
进入文件夹里面`asset/aa/Android`目录，可以看到我们的`Default Local Group`资源包就在里面，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/60def9278c324a45b3829e070a2f9ddd.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
没错，其实`Unity`就是把整个`Library/com.unity.addressables/aa/Android`目录塞到包内的`assets/aa`目录中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4bdc7d4481d1462bb2f1ffd64fe672e0.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们的`RemoteGroup`因为是远程资源包，它被留在了工程目录的`ServerData/Android`中，没有进入包体内，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ec0d9f738da3491a92edda096fcd4e24.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
好了，现在`Addressable`包也打了，`APK`包也打了，还没讲如何加载资源，接下来就来讲讲如何加载`Addressable`资源吧~

##### 9、加载Addressable资源

我们创建一个`C#`脚本，我这里就创建一个`Main.cs`脚本吧，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8d6ad325c785468eae1706c99014fed4.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 9.1、方式一：通过Addressable Name来加载资源

我们加载资源的时候，并不需要知道目标资源到底是在哪个`Group`中，也不需要知道这个`Group`到底是本地资源包还是远程资源包，统一通过资源的`Addressable Name`来加载，资源的`Addressable Name`在哪里看呢？  
比如`Cube`预设，在`Inspector`窗口中，可以看到它的`Addressable Name`为`Assets/Prefabs/Cube.prefab`，这个`Addressable Name`默认是资源被加入`Group`时的相对路径，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9581b1b04006469b9cf936a600e2b2c3.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们可以修改`Addressable Name`，比如我改成`HelloCube`也是可以的，它仅仅是作为一个索引的字符串，当我们把`Cube`预设移动到其他的目录中，这个`Addressable`地址并不会变，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/91befbdfc69f48389b9fcf4926a244e6.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这里我们还是保持为`Assets/Prefabs/Cube.prefab`吧，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f41c2949bb3c4c6c9b3975bea48fc3d9.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
开始写代码，首先引入命名空间

```
using UnityEngine.AddressableAssets;
```

然后使用`Addressables.LoadAssetAsync`方法加载资源，监听`Completed` 回调，在回调中拿到资源然后进行操作，示例：

```
using UnityEngine;
using UnityEngine.AddressableAssets;

public class Main : MonoBehaviour
{
    void Start()
    {
        Addressables.LoadAssetAsync<GameObject>("Assets/Prefabs/Cube.prefab").Completed += (handle) =>
        {
            // 预设物体
            GameObject prefabObj = handle.Result;
            // 实例化
            GameObject cubeObj = Instantiate(prefabObj);
        };
    }
}
```

`Addressables`还提供了`InstantiateAsync`接口，方便直接一步到位实例化，示例：

```
Addressables.InstantiateAsync("Assets/Prefabs/Cube.prefab").Completed += (handle) =>
{
    // 已实例化的物体
    GameObject cubeObj = handle.Result;
};
```

有些人可能不喜欢使用回调的方式，喜欢使用`async`、`await`的方式，示例：

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using System.Threading.Tasks;

public class Main : MonoBehaviour
{
    void Start()
    {
        InstantiateCube();
    }
	
	private async void InstantiateCube()
	{
		// 虽然这里使用了Task，但并没有使用多线程
		GameObject prefabObj = await Addressables.LoadAssetAsync<GameObject>("Assets/Prefabs/Cube.prefab").Task;
		// 实例化
		GameObject cubeObj = Instantiate(prefabObj);
		
		// 也可直接使用InstantiateAsync方法
		// GameObject cubeObj = await Addressables.InstantiateAsync("Assets/Prefabs/Cube.prefab").Task;
	}
}
```

我们把`Main.cs`脚本挂到`Main Camera`相机上，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b3f5a55905094dca8162e51f45a5bbf3.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行`Unity`，可以看到，正常加载了`Cube`并实例化了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1ebfdba2f27c4a85a38f695eeae94127.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们顺便测试一下把`Cube`的`Addressable Name`改为`HelloCube`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/50aa7bcdf75f4ffab4bd65c63d4243fa.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
加载的代码也改下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/afc19c6657274d00a6314579ed36dfc9.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行测试，可以看到，依然可以正常加载`Cube`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3d8fc03fbdea4f3b9299cf1de13f37d2.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这个时候，应该有同学会疑惑了，我改了`Addressable Name`，但我都没有重新`Build`资源包，怎么可以正常加载到资源呢？其实`Addressables`系统为了方便我们在`Editor`环境下方便测试，默认都是直接从`Asset Database`加载的，我们可以在`Addressables Groups`窗口的`Play Mode Script`中进行切换，建议编辑器环境下使用`Use Asset Database (fastest)`即可，下面两个选项下文我会讲具体使用，这里先维持原样~  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1caff7be8d774bf891d116f46c8c1046.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 9.2、方式二：通过AssetReference来加载资源

我们知道，脚本中如果声明了一个`public`变量，默认会进行序列化，可以在`Inspector`窗口中对它进行设置，我们声明一个`public`的`AssetReference` 成员，如下，

```
// Asset弱引用
public AssetReference spherePrefabRef;
```

我们把`Sphere`预设拖给这个`spherePrefabRef`成员，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8e7c96e81d034b5297b95ce92b789d75.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
如果我们声明的不是`AssetReference` 类型，而是`GameObject`类型，那么场景就直接依赖了`Sphere`预设，这个`Sphere`预设会被打到场景中，但我们这里用的是`AssetReference` ，场景并不会真的依赖`Sphere`预设，它是一个弱引用。  
好了我们继续，我们使用`AssetReference` 的`LoadAssetAsync`方法进行异步加载，监听`Completed` 回调，如下

```
using UnityEngine;
using UnityEngine.AddressableAssets;

public class Main : MonoBehaviour
{
    public AssetReference spherePrefabRef;

    void Start()
    {
        spherePrefabRef.LoadAssetAsync<GameObject>().Completed += (obj) =>
        {
            // 预设
            GameObject spherePrefab = obj.Result;
            // 实例化
            GameObject sphereObj = Instantiate(spherePrefab);
        };
    }
}
```

同样，`AssetReference` 也提供了`InstantiateAsync`方法，方便一步到位进行实例化，例，

```
spherePrefabRef.InstantiateAsync().Completed += (obj) =>
{
    // 已实例化的物体
    GameObject sphereObj = obj.Result;
};
```

我们运行`Unity`，测试效果如下，可以看到球体预设正常被加载并实例化了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/280b91b829874cf7b716350d0e295842.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 10、Addressable资源三个加载模式

`Addressables`资源加载模式有三个，如下，默认情况下是`Use Asset Database (fastest)`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/eadfeeb7566b4a4e900309d99ae9a6c0.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

> Use Asset Database (fastest) 直接加载文件而不打包，快速但Profiler获取的信息较少  
> Simulate Groups (advanced) 在不打包的情况下模拟AssetBundle的操作  
> Use Exising Build(requires built groups) 实际上是从AssetBundle打包和加载

###### 10.1、Use Asset Database (fastest)

在这个模式下，`Addressables`系统会直接从`AssetDatabase`加载资源，我们 ==不需要== `Build`打`Addressable`资源包，这个加载速度最快，建议在项目开发阶段使用这个模式，加载速度快。

###### 10.2、Simulate Groups (advanced)

这个模式下，也是 ==不需要== `Build`打`Addressable`资源包的，那它与`Use Asset Database (fastest)`有什么区别呢？  
让我先来操作一波，首先，我们选中`AddressableAssetSettings`，然后勾选`Send Profiler Events`，勾选之后，我们可以在`Addressable`的分析面板中查看到一些调试信息，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b7453b18e29d44e893ce74d44ceae17d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们点击菜单`Window / Asset Management / Addressables / Event Viewer`，打开分析器，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e73e362ccf534389a1e1f338bbbb7793.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们运行`Unity`，在分析器中可以看到我们实例化出来的预设所依赖的资源，还可以看到引用计数等信息，虽然我们没有打出`AssetBundle`包，但却模拟了类似从`AssetBundle`包中加载资源的效果，这样可以方便我们快速分析加载策略，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/749804ecee694436ab5c442cc6476c6a.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们对比一下，如果我切换为`Use Asset Database (fastest)`模式，看，资源加载、依赖、引用等相关信息都没有了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9a218f40f6d949c2bc5aa3021aff2c7a.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
结论就是`Simulate Groups (advanced)`会进行`AssetBundle`加载的模拟，并统计分析数据，方便我们进行快速分析，它并不是真的去加载`AssetBundle`，所以我们不需要执行`Build`操作。

###### 10.3、Use Exising Build(requires built groups)

这个模式下，需要先执行`Build`打出`Addressable`资源包，它会根据`Load Path`去加载真正的`AssetBundle`文件并读取资源。如果不先`Build`，运行时会报错，

```
Player content must be built before entering play mode with packed data.  
This can be done from the Addressables window in the Build->Build Player Content menu command.
UnityEngine.GUIUtility:ProcessEvent (int,intptr,bool&)
```

如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6d78dd162fa2444380c91cba8103e8e6.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
如果执行了`Build`打出了`Addressable`资源包，但是把`.bundle`包手动删掉，运行`Unity`也会报错，

```
Exception encountered in operation
Resource<IAssetBundleResource>(xxxxxxxxxxxxx.bundle), status=Failed, result= : Invalid path in AssetBundleProvider:
...
```

如下：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d8b2fb0e8ce144e1bd23bfdace4c1a56.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们执行一下`Build / New Build / Default Build Script`，打出`Addressable`资源包，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a7665c54b3f94f8f91dd6159a776a776.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行`Unity`，可以正常从`Addressable`的`.bundle`资源包中加载资源，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4f3c167542d94ee684ba467d5d53af90.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
在这个模式下，我们也是可以在`Event Viewer`窗口中对资源加载进行分析的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5d595a95b2a84c53a7e11dcd6612bbf5.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 11、加载远程Addressable资源

我们上面的`Remote Group`是打成包外资源的，我们想要在`Editor`环境下测试远程加载，这个时候就需要先搭建一个`Web`服务器了，支持通过`http`请求来获取资源。`Addressable`系统已经帮我们做了一个`Hosting Services`工具，方便我们快速启动一个`Web`服务器。

###### 11.1、启用Hosting Services

点击菜单`Window / Asset Management / Addressables / Hosting`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/abc22319c7c94e6db775dae123af8971.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
接着点击`Create / Local Hosting`，创建一个本地`Web`服务器，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/43166ae540d64315be6d8ca34f4f5054.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
然后勾选`Enable`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ce1bcb11fe3e4087b6b05447fcb4cb4d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这样我们就开启了一个本地的服务器了，`IP`地址是我本机的局域网`IP`，我可以通过`localhost`进行访问，注意这里的端口号是`62762`。  
我们可以看到，它对我们上文中提到的两个文件夹目录进行了`Hosting`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/bb48d2519726465f97086c81bfdc1ff7.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 11.2、加载远程包的柯南图片

因为我们上面已经指向过`Build`打了资源包，所以这里我们就直接写加载资源的代码吧。  
我们改一下`Main.cs`脚本，让它去加载柯南的图片，我们知道，柯南图片在`Remote Group`组里，它是在包外的，但我们代码上并不用管它到底是包内还是包外，我们使用`Addressable Name`来加载，柯南图片的`Addressable Name`为`Assets/Textures/kenan.jpg`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/970ba02c106e4ca9b1e3eb61e3b4b97f.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
上代码，

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public RawImage img;
    void Start()
    {
       	Addressables.LoadAssetAsync<Texture2D>("Assets/Textures/kenan.jpg").Completed += (obj) =>
        {
            // 图片
            Texture2D tex2D = obj.Result;
            img.texture = tex2D;
            img.GetComponent<RectTransform>().sizeDelta = new Vector2(tex2D.width, tex2D.height);
        };
    }
}
```

使用`UGUI`创建一张`RawImage`，并赋值给`Main`脚本的`img`成员，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f4304c5203514e44985b1e5f3f1c40da.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行`Unity`，效果如下，可以看到，成功加载了远程资源，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c88eadb4097b46dd9bf133322802191e.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

> 注：如果你是`win11`系统，可能使用`Hosting Services`会无法访问，具体原因不明，`win11`各种恶心的问题，放弃治疗，把资源放到`https`服务器可以正常加载。

###### 11.3、Addressables是如何知道去哪里加载资源的

假设我现在把资源托管到`GitCode`上，我把`RemoteLoadPath`改为`GitCode`的地址，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0d2e461b0dc74f7bae22cca7c9918658.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
然后我执行`Addressables`的`Build`打出资源包，如下是`RemoteGroup`资源包，里面包含了柯南的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/bd2fd6fa8f59461bb74092464226c38d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们把它丢到`GitCode`上，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9874b6ebbff5477bba4671e96adec48d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我运行`Unity`，可以看到，它从`GitCode`上正常加载了柯南的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6098c8d5ed2c4b569b077ddf75167440.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
如何证明它是从`GitCode`上下载下来的呢？我们把工程里的柯南图片删了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/45e17897a2d4422c8e9d6f5f20de52ba.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
把`ServerData/Android`目录中的`RemoteGroup`的`.bundle`包也删了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b5b11818217f4a80be06955586264c3f.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
由于我们已经运行过一次，远程的资源会在本地缓存，我们使用`Everythine`搜索一下`.bundle`文件的那串哈希值，可以看到一个同名的文件夹，我们进入里面，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c117646921a84094b2b620435d2a0fb7.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
可以看到有个`__data`文件，它就是`.bundle`的缓存文件，柯南就在里面，我们可以使用`AssetStudio`对`__data`进行逆向，看到了吗，我们的柯南又出现了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/783348d6e67a43e8b1d68f0a50d757d0.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
好，我们把缓存也干掉，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/21948cc1351047d5815d1ef699577e48.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这个时候，我们再运行一下`Unity`，柯南又重新加载出来了，并且刚刚的缓存目录又出现了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/39a04420f9344008bc18623adf452111.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)它是从`GitCode`上加载并缓存到本地的。  
我们通过`Assets/Textures/kenan.jpg`这个`Addressable Name`就可以加载到`GitCode`的柯南图片，这个对应关系是记录在哪里的呢？答案就在`catalog.json`文件中，这个文件我们在上文中解`APK`包的时候也有看到，事实上整个`aa/Android`目录下的文件都会塞入`APK`的`assets`目录中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/49315a6db32848bc8b39ef1d55b52592.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们打开它，可以看到我们配置的`GitCode`地址就在里面，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/658e031d720141848e74c5d9fc44b755.png)

###### 11.4、打个APK包瞧瞧

我们发布成`APK`，在`Android`模拟器中去看看效果，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e156553e26654c138b0f788920b1d5ae.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行，效果如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/faa15a692fd7490aab57ba95dbf194e6.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们打开文件管理器，进入`Android/data/包名/files`目录中，可以看到有个`UnityCache`文件夹，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/fbc88aa050d34a108a27799041416705.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
继续往里走，那串熟悉的哈希值又出现了，它就是我们放在`GitCode`上的`RemoteGroup`的`.bundle`文件的哈希值，它被下载到本地缓存在这个目录中，![在这里插入图片描述](https://img-blog.csdnimg.cn/1e18ef67d54d4f6eaef4a5f2594e302a.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们继续进入，里面的`__data`文件就是`.bundle`文件本君，柯南就在里面，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5ec8ae881f544b0aa4d9f1b5c5ddb64b.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 12、如何把Group里的资源打成多个bundle文件

我们如果继续给`RemoteGroup`添加资源，比如我们再放一张小兰的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/aa0dee667f994df3b4b6fdad0055e6d9.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
把柯南小兰都放在`RemoteGroup`组里，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8aac05010f5149babb1502ee64748774.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这个时候我们执行`Addressable`资源打包，柯南和小兰是在同一个`.bundle`文件中的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ece80fae42f045458283eeb1e5939c18.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
用`AssetStudio`逆向验证一下，嗯，他们是在一起的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a287b7bfb81846b68948e9e39314ea7d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
假设这个`.bundle`文件还包含了好多好多其他的资源，导致这个`.bundle`包有几十`M`那么大，而我们只是想要加载柯南的图片，这个时候它会先去下载整个`.bundle`到本地，然后再去这个`.bundle`文件中去加载柯南的图片，时间耗在了下载大文件上了，能不能将颗粒度细化到以单独的资源文件为颗粒呢？  
答案是可以的，选中`RemoteGroup`，然后将``Bundle` Mode``改为`Pack Separately`，这样就是以每个独立的资源文件为颗粒打成`.bundle`文件了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e16d397bae67444cb65f71435aabd47e.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

我们重新执行`Build`，可以看到目录根据资源类型进行细化了，`.bundle`文件也细分成了两个，柯南和小兰分开了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/23962f71265649bbacb918ce3e79aa2e.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 13、使用Labels对Group内的资源进行二级分组

实际项目中，不会真的细到这么细的颗粒，会使用`Labels`来对`Group`内的资源进行二级分组，默认只有一个`default`的`Label`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/66f5cf08cf324283a69abd005029e04a.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 13.1、新建Label

我们可以点击`Tools / Labels`菜单，新建一个`Label`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/aba57f8674b74746b1a7b518b3186579.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_19,color_FFFFFF,t_70,g_se,x_16)  
点击`+`号，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/49f408572c0e4beb95a9f8af00d5adfc.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_15,color_FFFFFF,t_70,g_se,x_16)  
新建一个`texture`吧，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9bae2345bc184a119cc6b12163472d01.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_15,color_FFFFFF,t_70,g_se,x_16)

###### 13.2、给资源设置Label

接着我们把柯南和小兰的`Label`都设置为`texture`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0d7ccbebbed244e48be967a3e4758557.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7bea0b12c2704fa685b896e9a543a2b5.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
为了演示，我再加一个柯南主题曲，并标记它的`Label`为`audio`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/820fdd36731749a3bcaf24c6456cf944.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 13.3、修改Bundle Mode为Pack Together By Label

接着，我们把`RemoteGroup`的`Bundle Mode`改为`Pack Together By Label`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/69a227b19cd1416cb2f4ee014a1a575b.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
这样，一个`Group`就会以`Label`为颗粒细分成多个`.bundle`，组织是更加灵活，我们执行`Addressable`资源打包，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/be39d29e7d844663bcf5bf29153f3358.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 13.3、一个资源标记多个Label

事实上，一个资源可以同时标记多个`Label`，比如我把柯南同时标记为`default`和`texture`，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/458569f9a4bc43abb0ae20477a73e332.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
我们执行`Addressable`资源打包，如下，他们又分开了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ae562b132ab04f00a727e684875a360c.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 14、批量加载同一个Label的所有资源（AssetLabelReference）

我们给资源标记了`Label`之后，就可以批量加载指定了同一个`Label`的所有资源了，比如我想加载标记了`texture`的所有资源，就可以这样加载，

```
using System.Linq.Expressions;
using UnityEngine;
using UnityEngine.AddressableAssets;


public class Main : MonoBehaviour
{
    public AssetLabelReference textureLabel;

    void Start()
    {
        Addressables.LoadAssetsAsync<Texture2D>(textureLabel, (texture) =>
        {
            // 没加载完一个资源，就回调一次
            Debug.Log("加载了一个资源： " + texture.name);
        });
    }
}
```

把`Main.cs`脚本的`Texture Label`成员设置为`texture`，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c197a812e14f4c79b6b73483476825f2.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
运行`Unity`，可以看到，回调了两次，分别加载了柯南和小兰的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7bbf29139a6f449b8a8668518421736c.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 15、打资源热更包

###### 15.1、开启Build Remote Catalog

想要支持热更新，需要先开启`Catalog`，选中`AddressableAssetSettings`，然后勾选`Build Remote Catalog`，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/94d02d740e214c30baadfffbd4362c88.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.2、打包Addressable资源包

然后执行`Build`打包`Addressable`资源包，  
此时除了生成`.bundle`包，还生成了`catalog`的`.hash`和`.json`文件，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1cabcf5c12e84f0e9897e20ed4e79cdb.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
有了`catalog`的这两个文件，我们后续打增量包的时候它才能对比出哪些文件发生了变化，把变化的资源文件打成热更的`.bundle`包，我们先把打出来的`catalog`和`.bundle`包丢到服务器上，如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/856d1dbf27c44b72b1d3327dff05c1cc.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.3、加载小兰的图片

我们先写段代码去加载小兰的图片，

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public RawImage img;
    void Start()
    {
        Addressables.LoadAssetAsync<Texture2D>("Assets/Textures/xiaolan.png").Completed += (obj) =>
          {
                // 图片
                Texture2D tex2D = obj.Result;
              img.texture = tex2D;
              img.GetComponent<RectTransform>().sizeDelta = new Vector2(tex2D.width, tex2D.height);
          };
    }
}
```

运行`Unity`，可以正常加载，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b6b5645b148c415e94724b879514c4d5.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.4、打成APK

我们打成`APK`包，在`Android`模拟器上运行，可以正常加载到小兰的图片，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/99c85dc31a824ec191710f6bc448f83b.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.5、替换小兰的图片

现在，我们想热更小兰的图片，换成这张，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/96e94d33fca441c785cc36f815740c1d.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
现在`RemoteGroup`组里小兰的图片被我们换成了新的了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/38cf933488a94d77a92f728f802b32f3.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.6、打热更包，Update a Previous Build

我们点击`Update a Previous Build`菜单，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e37577c9e5f44bccbaefbb99181aa2ff.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
此时会打开一个窗口，然你选择`.bin`文件，因为我是`Android`平台，所以进入`Android`目录中，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/647f10154726411aaefec7813880ac2c.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
选择`addressables_content_state.bin`文件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1c8769976cf640fb80b9f49ff80f5ee1.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)  
它会解析`catalog`文件然后进行差异对比，发现小兰的图片资源发生了变化，就会把它打成一个热更的`.bundle`包了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0dc66832e4ce4409ae97383f7a46dfc5.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.7、上传热更包

我们把热更包丢到服务器上，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/be5fef0253194eb5952f835ef0e47e17.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

###### 15.8、热更测试

现在，我们在`Android`模拟器上重新运行`APP`，可以看到，小兰的图片自动热更成新的图片了，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4325a370109c4a498622dfc183910c39.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)

##### 16、提前检测更新并下载（预下载）

有时候我们希望启动后执行更新检测并下载所有资源后再进入游戏，可以使用`CheckForCatalogUpdates -> UpdateCatalogs -> GetDownloadSizeAsync -> DownloadDependenciesAsync`这个工作流。  
这个过程中可能有强退、断网等异常，我们可以判断`AsyncOperationHandle`的`Status`状态码然后进行处理，并提示重试。

示例：

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using UnityEngine.AddressableAssets.ResourceLocators;
using UnityEngine.UI;

// 检测更新并下载资源
public class CheckUpdateAndDownload : MonoBehaviour
{
    /// <summary>
    /// 显示下载状态和进度
    /// </summary>
    public Text updateText;

    /// <summary>
    /// 重试按钮
    /// </summary>
    public Button retryBtn;

    void Start()
    {
        retryBtn.gameObject.SetActive(false);
        retryBtn.onClick.AddListener(() =>
        {
            StartCoroutine(DoUpdateAddressadble());
        });

        // 默认自动执行一次更新检测
        StartCoroutine(DoUpdateAddressadble());
    }

    IEnumerator DoUpdateAddressadble()
    {
        AsyncOperationHandle<IResourceLocator> initHandle = Addressables.InitializeAsync();
        yield return initHandle;

        // 检测更新
        var checkHandle = Addressables.CheckForCatalogUpdates(true);
        yield return checkHandle;
        if (checkHandle.Status != AsyncOperationStatus.Succeeded)
        {
            OnError("CheckForCatalogUpdates Error\n" +  checkHandle.OperationException.ToString());
            yield break;
        }

        if (checkHandle.Result.Count > 0)
        {
            var updateHandle = Addressables.UpdateCatalogs(checkHandle.Result, true);
            yield return updateHandle;

            if (updateHandle.Status != AsyncOperationStatus.Succeeded)
            {
                OnError("UpdateCatalogs Error\n" + updateHandle.OperationException.ToString());
                yield break;
            }

            // 更新列表迭代器
            List<IResourceLocator> locators = updateHandle.Result;
            foreach (var locator in locators)
            {
                List<object> keys = new List<object>();
                keys.AddRange(locator.Keys);
                // 获取待下载的文件总大小
                var sizeHandle = Addressables.GetDownloadSizeAsync(keys.GetEnumerator());
                yield return sizeHandle;
                if (sizeHandle.Status != AsyncOperationStatus.Succeeded)
                {
                    OnError("GetDownloadSizeAsync Error\n" + sizeHandle.OperationException.ToString());
                    yield break;
                }

                long totalDownloadSize = sizeHandle.Result;
                updateText.text = updateText.text + "\ndownload size : " + totalDownloadSize;
                Debug.Log("download size : " + totalDownloadSize);
                if (totalDownloadSize > 0)
                {
                    // 下载
                    var downloadHandle = Addressables.DownloadDependenciesAsync(keys, true);
                    while (!downloadHandle.IsDone)
                    {
                        if (downloadHandle.Status == AsyncOperationStatus.Failed)
                        {
                            OnError("DownloadDependenciesAsync Error\n"  + downloadHandle.OperationException.ToString());
                            yield break;
                        }
                        // 下载进度
                        float percentage = downloadHandle.PercentComplete;
                        Debug.Log($"已下载: {percentage}");
                        updateText.text = updateText.text + $"\n已下载: {percentage}";
                        yield return null;
                    }
                    if (downloadHandle.Status == AsyncOperationStatus.Succeeded)
                    {
                        Debug.Log("下载完毕!");
                        updateText.text = updateText.text + "\n下载完毕";
                    }
                }
            }
        }
        else
        {
            updateText.text = updateText.text + "\n没有检测到更新";
        }

        // 进入游戏
        EnterGame();
    }

    // 异常提示
    private void OnError(string msg)
    {
        updateText.text = updateText.text + $"\n{msg}\n请重试! ";
        // 显示重试按钮
        retryBtn.gameObject.SetActive(true);
    }


    // 进入游戏
    void EnterGame()
    {
        // TODO
    }
}
```

##### 17、Addressable资源释放

最后补充一下`Addressable`的资源释放。  
就以加载小兰图片为例，我们加载完毕后，把`RawImage`销毁，并不会释放内存中的`Texture2D`对象，比如这样子

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public RawImage img;
    public Button freeResBtn;

    void Start()
    {
        Addressables.LoadAssetAsync<Texture2D>("Assets/Textures/xiaolan.png").Completed += (obj) =>
          {
              // 图片
              var tex2D = obj.Result;
              img.texture = tex2D;
              img.GetComponent<RectTransform>().sizeDelta = new Vector2(tex2D.width, tex2D.height);
          };

        freeResBtn.onClick.AddListener(() =>
        {
            // 销毁RawImage
            if(null != img)
	            Destroy(img.gameObject);
        });
    }
}
```

我们通过`Event Viewer`可以看到，虽然我们销毁了`RawImage`，但是`Texture2D`还在内存中，  
![请添加图片描述](https://img-blog.csdnimg.cn/9a01ce1910d743f7b9950f4b53d8f001.gif)  
我们需要通过`Addressables.Release`去释放资源，如下，

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public RawImage img;
    public Button freeResBtn;
    private Texture2D tex2D;

    void Start()
    {
        Addressables.LoadAssetAsync<Texture2D>("Assets/Textures/xiaolan.png").Completed += (obj) =>
          {
              // 图片
              tex2D = obj.Result;
              img.texture = tex2D;
              img.GetComponent<RectTransform>().sizeDelta = new Vector2(tex2D.width, tex2D.height);
          };

        freeResBtn.onClick.AddListener(() =>
        {
            // 销毁RawImage
            if(null != img)
                Destroy(img.gameObject);
            // 释放资源
            if (null != tex2D)
                Addressables.Release(tex2D);

        });
    }
}
```

再次运行，可以看到，小兰的`Texture2D`在内存中释放了，  
![请添加图片描述](https://img-blog.csdnimg.cn/320524bbb5fc49a5b9e95c6b6377f4e0.gif)  
我们也可以使用`Addressables.Release`去释放`handle`，效果是一样的，例，

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public RawImage img;
    public Button freeResBtn;

    void Start()
    {
        var handle = Addressables.LoadAssetAsync<Texture2D>("Assets/Textures/xiaolan.png");
        handle.Completed += (obj) =>
        {
            // 图片
            Texture2D tex2D = obj.Result;
            img.texture = tex2D;
            img.GetComponent<RectTransform>().sizeDelta = new Vector2(tex2D.width, tex2D.height);
        };

        freeResBtn.onClick.AddListener(() =>
        {
            // 销毁RawImage
            if (null != img)
                Destroy(img.gameObject);
            // 释放资源
            Addressables.Release(handle);
        });
    }
}
```

同理，释放预设资源也一样，如下

```
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.UI;

public class Main : MonoBehaviour
{
    public Button freeResBtn;
    private GameObject cubeObj;


    void Start()
    {
        var handle = Addressables.LoadAssetAsync<GameObject>("Assets/Prefabs/Cube.prefab");
        handle.Completed += (obj) =>
         {
            // 实例化Cube
            cubeObj = Instantiate(obj.Result);
         };

        freeResBtn.onClick.AddListener(() =>
        {
            if (null != cubeObj)
                Destroy(cubeObj);

            // 释放资源
            Addressables.Release(handle);
        });
    }
}
```

##### 18、打包工具集成Addressable打包流程

实际项目中我们一般都会自己写一套打包工具，我们可以在打包工具中集成`Addressable`的打包流程，官方给出了示例，如下  
详细参见官方文档：[https://docs.unity.cn/cn/current/Manual/com.unity.addressables.html](https://docs.unity.cn/cn/current/Manual/com.unity.addressables.html)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8ead2e751fc4462daba8aab0d826dc46.png?x-oss-process=/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5p6X5paw5Y-R,size_20,color_FFFFFF,t_70,g_se,x_16)官方示例：

```
#if UNITY_EDITOR
    using UnityEditor;
    using UnityEditor.AddressableAssets.Build;
    using UnityEditor.AddressableAssets.Settings;
    using System;
    using UnityEngine;

    internal class BuildLauncher
    {
        public static string build_script 
            = "Assets/AddressableAssetsData/DataBuilders/BuildScriptPackedMode.asset";
        public static string settings_asset 
            = "Assets/AddressableAssetsData/AddressableAssetSettings.asset";
        public static string profile_name = "Default";
        private static AddressableAssetSettings settings;

        static void getSettingsObject(string settingsAsset) {
            // This step is optional, you can also use the default settings:
            //settings = AddressableAssetSettingsDefaultObject.Settings;

            settings
                = AssetDatabase.LoadAssetAtPath<ScriptableObject>(settingsAsset)
                    as AddressableAssetSettings;

            if (settings == null)
                Debug.LogError($"{settingsAsset} couldn't be found or isn't " +
                               $"a settings object.");
        }

        static void setProfile(string profile) {
            string profileId = settings.profileSettings.GetProfileId(profile);
            if (String.IsNullOrEmpty(profileId))
                Debug.LogWarning($"Couldn't find a profile named, {profile}, " +
                                 $"using current profile instead.");
            else
                settings.activeProfileId = profileId;
        }

        static void setBuilder(IDataBuilder builder) {
            int index = settings.DataBuilders.IndexOf((ScriptableObject)builder);

            if (index > 0)
                settings.ActivePlayerDataBuilderIndex = index;
            else
                Debug.LogWarning($"{builder} must be added to the " +
                                 $"DataBuilders list before it can be made " +
                                 $"active. Using last run builder instead.");
        }

        static bool buildAddressableContent() {
            AddressableAssetSettings
                .BuildPlayerContent(out AddressablesPlayerBuildResult result);
            bool success = string.IsNullOrEmpty(result.Error);

            if (!success) {
                Debug.LogError("Addressables build error encountered: " + result.Error);
            }
            return success;
        }

        [MenuItem("Window/Asset Management/Addressables/Build Addressables only")]
        public static bool BuildAddressables() {
            getSettingsObject(settings_asset);
            setProfile(profile_name);
            IDataBuilder builderScript
              = AssetDatabase.LoadAssetAtPath<ScriptableObject>(build_script) as IDataBuilder;

            if (builderScript == null) {
                Debug.LogError(build_script + " couldn't be found or isn't a build script.");
                return false;
            }

            setBuilder(builderScript);

            return buildAddressableContent();
        }

        [MenuItem("Window/Asset Management/Addressables/Build Addressables and Player")]
        public static void BuildAddressablesAndPlayer() {
            bool contentBuildSucceeded = BuildAddressables();

            if (contentBuildSucceeded) {
                var options = new BuildPlayerOptions();
                BuildPlayerOptions playerSettings
                    = BuildPlayerWindow.DefaultBuildMethods.GetBuildPlayerOptions(options);

                BuildPipeline.BuildPlayer(playerSettings);
            }
        }
    }
#endif

```

#### 四、答疑补充（Q&A）

评论区有一些同学的提问，我补充到这里统一进行答疑。

##### 1、Addressables加载场景进度监听

![在这里插入图片描述](https://img-blog.csdnimg.cn/0bc8daa892f741dca7ee47ecd0750bd3.png)  
示例：

```
using System.Collections;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class SceneLoader : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(LoadScene());
    }

    IEnumerator LoadScene()
    {
        // 异步加载场景(如果场景资源没有下载，会自动下载)，
        var handle = Addressables.LoadSceneAsync("Assets/Scenes/GameScene.unity");
        if (handle.Status == AsyncOperationStatus.Failed)
        {
            Debug.LogError("场景加载异常: " + handle.OperationException.ToString());
            yield break;
        }
        while (!handle.IsDone)
        {
            // 进度（0~1）
            float percentage = handle.PercentComplete;
            Debug.Log("进度: " + percentage);
            yield return null;
        }

        Debug.Log("场景加载完毕");
    }
}

```

#### 五、完毕

好了，就写到这里吧。  
我是新发，[https://blog.csdn.net/linxinfa](https://blog.csdn.net/linxinfa)  
一个在小公司默默奋斗的Unity开发者，希望可以帮助更多想学Unity的人，共勉~