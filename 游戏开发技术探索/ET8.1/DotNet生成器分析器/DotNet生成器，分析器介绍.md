---
tags:
  - ET8.1/.Net分析器 
  - ET8.1/.Net源码生成器
  - mytodo
type: Study
course: ET8.1
courseType: Section
fileDirPath: 游戏开发技术探索/ET8.1/DotNet生成器分析器
dateStart: 2025-06-03
dateFinish: 2025-06-06
finished: false
banner: Study
displayIcon: pixel-banner-images/章节任务.png
---

```cardlink
url: https://www.cnblogs.com/InCerry/p/writing-a-net-profiler-in-c-sharp-part-4.html
title: "使用C#编写.NET分析器（完结） - InCerry - 博客园"
description: "## 译者注 这是在Datadog公司任职的Kevin Gosse大佬使用C#编写.NET分析器的系列文章之一，在国内只有很少很少的人了解和研究.NET分析器，它常被用于APM（应用性能诊断）、IDE、诊断工具中，比如Datadog的APM，Visual Studio的分析器以及Rider和Resh"
host: www.cnblogs.com
favicon: https://assets.cnblogs.com/favicon_v3_2.ico
```

```cardlink
url: https://www.cnblogs.com/lindexi/p/18786647
title: "dotnet 源代码生成器分析器入门 - lindexi - 博客园"
description: "本文将带领大家入门 dotnet 的 SourceGenerator 源代码生成器技术，期待大家阅读完本文能够看懂理解和编写源代码生成器和分析器"
host: www.cnblogs.com
favicon: https://assets.cnblogs.com/favicon_v3_2.ico
```

```cardlink
url: https://hlog.cc/archives/201/
title: "c#的源代码生成器SourceGenerator - 沉迷于学习，无法自拔^_^"
description: "简介微软在 .NET 5 中引入了 Source Generator 的新特性，利用 Source Generator 我们可以在应用编译期间根据当前编译信息动态生成代码，而且可以在我们的 C#..."
host: hlog.cc
```

# 搭建分析器
## 创建分析器工程
在当前工程上，新建一个类库工程Analyzer，在Analyzer.csproj中，配置如下：
```XML
<PropertyGroup>  
	<TargetFramework>netstandard2.0</TargetFramework> 
    <LangVersion>latest</LangVersion>
    <!-- 强制执行扩展分析器规则 -->  
    <EnforceExtendedAnalyzerRules>true</EnforceExtendedAnalyzerRules>  
</PropertyGroup>

<ItemGroup>  
    <!-- 分析器的基础组件 -->  
    <PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.11.0" PrivateAssets="all"/>  
    <!-- C# 的基础组件 -->  
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp" Version="4.12.0" PrivateAssets="all"/>  
</ItemGroup>
```
为什么需要降级为 netstandard2.0 版本？这是为了让此分析器项目能够同时在 dotnet CLI 和 Visual Studio 2022 里面使用。在 Visual Studio 2022 里，当前依然使用的是 .NET Framework 的版本。于是求最小公倍数，选择了 netstandard2.0 版本。预计后续版本才能使用到最新的 dotnet 框架版本。
以上的 `<EnforceExtendedAnalyzerRules>true</EnforceExtendedAnalyzerRules>` 的作用是强制执行扩展分析器规则。这个属性是为了让我们在编写分析器的时候能够更加严格，让我们的代码更加规范。这里大家不需要细致了解，如有兴趣，请参阅 [Roslyn 分析器 EnforceExtendedAnalyzerRules 属性的作用](https://blog.lindexi.com/post/Roslyn-%E5%88%86%E6%9E%90%E5%99%A8-EnforceExtendedAnalyzerRules-%E5%B1%9E%E6%80%A7%E7%9A%84%E4%BD%9C%E7%94%A8.html)
## 设置主工程
在主工程的csproj中，添加如下设置：
```XML
<ItemGroup>  
    <!-- OutputItemType="Analyzer" 是告诉 dotnet 这个引用项目是一个分析器项目 -->  
    <!-- ReferenceOutputAssembly="false" 是告诉 dotnet 不要引用这个项目的输出程序集 -->  
    <ProjectReference Include=".\Analyzer\Analyzer.csproj" OutputItemType="Analyzer" ReferenceOutputAssembly="false"/>  
</ItemGroup>
```
可以看到以上的 csproj 项目文件和正常的控制台项目的差别仅仅只有在对 `Analyzer.csproj` 的引用上。且和正常的引用项目的方式不同的是，这里额外添加了 `OutputItemType="Analyzer" ReferenceOutputAssembly="false"` 两个配置。这两个配置的作用如下：
- 以上的 `OutputItemType="Analyzer"` 是告诉 dotnet 这个引用项目是一个分析器项目。这个配置是必须的，没有这个配置，dotnet 就不知道这个项目是一个分析器项目。通过这个配置是告诉 dotnet 这个项目是一个分析器项目，才能让 dotnet 在编译的时候能够正确地当成分析器处理这个项目
- 以上的 `ReferenceOutputAssembly="false"` 是告诉 dotnet 不要引用这个项目的输出程序集。正常的项目是不应该引用分析器项目的程序集的，分析器项目的作用仅仅只是作为分析器，而不是提供程序集给其他项目引用。这个配置是为了让 dotnet 在编译的时候不要引用这个项目的输出程序集，避免引用错误或导致不小心用了不应该使用的类型
对于正常的项目引用来说，一旦存在项目引用，那被引用的项目的输出程序集就会被引用。此时项目上就可以使用被引用项目的公开类型，以及获取 NuGet 包依赖传递等。但是对于分析器项目来说，这些都是不应该的，正常就不能让项目引用分析器项目的输出程序集。这就是为什么会额外添加 `ReferenceOutputAssembly="false"` 配置的原因
# 分析和生成入门
## `IIncrementalGenerator`接口
2022 之后，官方大力推荐的是使用`IIncrementalGenerator`增量源代码生成器技术。整个`IIncrementalGenerator`的入口都在`Initialize`方法里面。
通过 `context.RegisterPostInitializationOutput` 方法注册一个源代码输出。如以下代码所示，将输出一个名为 `GeneratedCode` 的代码
```CSharp
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterPostInitializationOutput(initializationContext =>
        {
            initializationContext.AddSource("GeneratedCode.cs",
                """
                using System;
                namespace ConsoleApp
                {
                    public static class GeneratedCode
                    {
                        public static void Print()
                        {
                            Console.WriteLine("Hello from generated code!");
                        }
                    }
                }
                """);
        });
    }
```
## 使用`ForAttributeWithMetadataName`快速分析代码
这个方法是用于找到标记了某个`Attribute`特性的类型、方法、属性等，函数签名如下：
```CSharp
var provider =
    context.SyntaxProvider.ForAttributeWithMetadataName
    (
        "特性名",
        (SyntaxNode node, CancellationToken token) => 语法判断条件,
        (GeneratorAttributeSyntaxContext syntaxContext, CancellationToken token) => 语义处理和获取返回值
    );
```
第一个参数是特性名，记得带上特性的命名空间，以及写明特性的全名。第二个参数是语法判断条件，用于判断当前节点是否符合条件。第三个参数是语义处理和获取返回值，用于处理当前节点的语义，获取返回值。
### 语法和语义
>[!INFO]
> 1. 在 Roslyn 里面，将初步的代码分析的语法层面内容称为`Syntax语法`。语法是非常贴近编写出来的代码直接的内存映射的样子，这个过程里面只做片面考虑，即不考虑代码之间的引用关系，只考虑代码语法本身。
> 2. 语法分析过程是最早的过程，也是损耗极小的过程，也是可以并行化执行的过程。
> 3. 一般来说，进行语法分析都可以将写出来的代码分为一个个`SyntaxTree语法树`，每个代码或代码片都可以转换为一个`SyntaxNode语法节点`。

>[!INFO]
>1. `语义Semantic`则是包含了代码的含义，不仅仅只是语法层面上，`语义Semantic`包含了代码之间的引用关系，包含了各个符号的信息。
>2. 语义分析过程是在语法分析之后的过程，执行过程中有所损耗，且存在多个代码文件和程序集之间的引用关联关系。
### 语法和语义使用说明
```CSharp
        IncrementalValuesProvider<string> targetClassNameProvider = context.SyntaxProvider.ForAttributeWithMetadataName("Lindexi.FooAttribute",
            // 进一步判断
            (SyntaxNode node, CancellationToken token) => node.IsKind(SyntaxKind.ClassDeclaration),
            (GeneratorAttributeSyntaxContext syntaxContext, CancellationToken token) => syntaxContext.TargetSymbol.Name);
```
`node.IsKind(SyntaxKind.ClassDeclaration)`表明，找到的代码是否是类声明