---
tags:
  - ET8/.Net分析器
  - ET8/.Net源码生成器
  - Syntax语法
  - Semantic语义
  - IIncrementalGenerator增量源代码生成
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
通过 `context.RegisterPostInitializationOutput` 方法注册一个源代码输出，该方法的定义上就是用于提供分析器开始分析工作之前的初始化代码。
如以下代码所示，将输出一个名为 `GeneratedCode` 的代码
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

        IncrementalValuesProvider<string> targetClassNameProvider = context.SyntaxProvider.ForAttributeWithMetadataName("ConsoleApp.FooAttribute",
            // 进一步判断
            (SyntaxNode node, CancellationToken token) => node.IsKind(SyntaxKind.ClassDeclaration),
            (GeneratorAttributeSyntaxContext syntaxContext, CancellationToken token) => syntaxContext.TargetSymbol.Name);
```
语法处理代码块中，`node.IsKind(SyntaxKind.ClassDeclaration)`表明，找到的代码是否是类声明。`SyntaxNode.IsKind`方法是判断当前传入的`SyntaxNode`是什么。满足该条件，则表明，这是一个在类型上面标记了`Foo`特性的代码。
语义处理代码块中，`syntaxContext.TargetSymbol`属性，是当前找到的代码的符号，即当前找到的代码的语义信息。这里的`TargetSymbol.Name`属性是当前找到的代码的名称，即当前找到的代码的类型名称。这里的代码块返回的是当前找到的代码的类型名称，即当前找到的代码的名称。
返回类型`IncrementalValuesProvider<string>`是一个增量值的提供者，不是立刻返回所有满足条件的代码。在IED里面的执行逻辑上，大家可以认为是每更改、新增一次代码，就会执行一次这个查询逻辑，整个查询逻辑是源源不断执行的，不是一次性的，也不是瞬时全跑的，而是增量的逐步执行的。
如果需要一次性收集所有类型，就需要使用Collect方法：
```CSharp

        IncrementalValueProvider<ImmutableArray<string>> targetClassNameArrayProvider = targetClassNameProvider
            .Collect();
```
`ImmutableArray<string>`表明不可变数组。在整个Roslyn设计里面，大量采用不可变思想，这里的返回值就是不可变思想的一个体现。细心的伙伴可以看到 `IncrementalValuesProvider` 和 `IncrementalValueProvider` 这两个单词的差别，没错，核心在于 Values 和 Value 的差别。在增量源代码生成器里面，使用 `IncrementalValuesProvider` 表示多值提供器，使用 `IncrementalValueProvider` 表示单值提供器，两者差异只是值提供器里面提供的数据是多项还是单项。使用 `Collect` 方法可以将一个多值提供器的内容收集起来，收集为一个不可变集合，从而转换为一个单值提供器，这个单值提供器里面只有一项，且这一项是一个不可变数组。
最终代码如下：
```CSharp
	
	[Generator(LanguageNames.CSharp)]  
    public class IncrementalGenerator : IIncrementalGenerator  
    {  
        public void Initialize(IncrementalGeneratorInitializationContext context)  
        {            
            context.RegisterPostInitializationOutput(initializationContext =>  
            {  
                initializationContext.AddSource("FooAttribute.cs", @"  
using System;  
namespace ConsoleApp  
{  
    public class FooAttribute: Attribute {}
}  
");  
            });  

            IncrementalValuesProvider<string> targetClassNameProvider 
                        = context.SyntaxProvider.ForAttributeWithMetadataName(  
                "ConsoleApp.FooAttribute",  
                // 进一步判断  
                (SyntaxNode node, CancellationToken token) => {
                    return node.IsKind(SyntaxKind.ClassDeclaration);
                },
                (GeneratorAttributeSyntaxContext syntaxContext, 
                CancellationToken token) => 
                {
                    return syntaxContext.TargetSymbol.Name;
                }
            ); 
                 
            IncrementalValueProvider<ImmutableArray<string>> targetClassNameArrayProvider = targetClassNameProvider.Collect();  
            
            context.RegisterSourceOutput(targetClassNameArrayProvider, 
                                        (productionContext, classNameArray) =>  
            {  
                productionContext.AddSource("GeneratedCode.cs",  
                    $$"""  
                      using System;                      
                      namespace ConsoleApp                      
                      {                          
                        public static class GeneratedCode                          
                        {                              
                            public static void Print()                              
                            {                                  
                                Console.WriteLine("标记了 Foo 特性的类型有： {{string.Join(",", classNameArray)}}");  
                            }                         
                        }                      
                       }                     
                """);  
            });  
        }    
    }
```
## 关于RegisterPostInitializationOutput，RegisterSourceOutput和RegisterImplementationSourceOutput
`RegisterPostInitializationOutput`方法，用于提供分析器开始分析工作之前的初始化代码。这部分代码由于可不用运行分析过程，可以非常快给到 IDE 层，一般用于提供一些类型定义，可以给到开发者直接快速使用，而不会在使用过程中飘红。
`RegisterImplementationSourceOutput`是用来注册具体实现生成的代码，这部分输入的代码会被 IDE 作为可选分析项。但带来的问题是这部分生成代码可能不被加入 IDE 分析，导致业务方调用时飘红。因此其生成的代码，基本要求是不会被业务方直接调用。
# 更底层的收集分析和生成
在 IIncrementalGenerator 增量 Source Generator 源代码生成里面提供了众多数据源入口，比如整个的配置、引用的程序集、源代码等等。最核心也是用最多的就是通过提供的源代码数据源进行收集分析
按照官方的设计，将会分为三个步骤完成增量代码生成：
1. 告诉框架层需要关注哪些文件或内容或配置的变更
	- 在有对应的文件等的变更情况下，才会触发后续步骤。如此就是增量代码生成的关键
2. 告诉框架层从变更的文件里面感兴趣什么数据，对数据预先进行处理
	- 预先处理过程中，是会不断进行过滤处理的，确保只有感兴趣的数据才会进入后续步骤
	- 其中第一步和第二步可以合在一起
3. 使用给出的数据进行处理源代码生成逻辑
	- 这一步的逻辑和普通的 Source Generator 是相同的，只是输入的参数不同
## 使用context.SyntaxProvider.CreateSyntaxProvider
第一步的语法判断是判断当前传入的是否类型定义。如果是类型定义，则读取其标记的特性，判断特性满足 `ConsoleApp.FooAttribute` 的特征时，则算语法判断通过，让数据走到下面的语义判断处理上。
语法分析部分代码如下：
```CSharp

(node, _) =>  
{  
    if (node is not ClassDeclarationSyntax classDeclarationSyntax)  
	    return false;  

    foreach (var listSyntax in classDeclarationSyntax.AttributeLists)  
    {        
	    foreach (var attributeSyntax in listSyntax.Attributes)  
        {            
	        var name = attributeSyntax.Name.ToFullString();  
            if (name == "Foo")  
	            return true;  
            
            if (name == "FooAttribute")  
	            return true;  
            
            // 可能还有 global::ConsoleApp.FooAttribute 的情况  
            if (name.EndsWith("ConsoleApp.FooAttribute"))  
	            return true;  

            if (name.EndsWith("ConsoleApp.Foo"))  
	            return true;         
        }    
    }  
    return false;  
}
```
`node is not ClassDeclarationSyntax`过滤掉不是类的代码。代码使用了对 `NameSyntax` 调用 `ToFullString` 方法获取到所标记的名（请参阅 [Roslyn NameSyntax 的 ToString 和 ToFullString 的区别](https://blog.lindexi.com/post/Roslyn-NameSyntax-%E7%9A%84-ToString-%E5%92%8C-ToFullString-%E7%9A%84%E5%8C%BA%E5%88%AB.html)）。通过语法分析后，只能知道标记了名为`Foo`的特性，但是并不能确认是否真的是特性。
通过语义来进一步分析。判断的方法就是通过 `GetAttributes` 方法获取标记在类型上面的特性，此时和语法不同的是，可以拿到分部类上面标记的特性，不单单只是某个类型文件而已。接着使用`ToDisplayString`方法获取标记的特性的全名，判断全名是否为 `global::ConsoleApp.FooAttribute` 从而确保类型符合预期。语义分析部分代码如下：
```CSharp

(syntaxContext, _) =>  
{  
    ISymbol declaredSymbol = syntaxContext.SemanticModel.GetDeclaredSymbol(syntaxContext.Node);  
    if (declaredSymbol is not INamedTypeSymbol namedTypeSymbol)  
    {        
	    return (string) null;  
    }  
    ImmutableArray<AttributeData> attributeDataArray = namedTypeSymbol.GetAttributes();  
  
    // 在通过语义判断一次，防止被骗了  
    if (!attributeDataArray.Any(t =>  
            t.AttributeClass?.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) ==  
            "global::ConsoleApp.FooAttribute"))  
    {        
	    return (string) null;  
    }  
    return namedTypeSymbol.Name;  
}
```
# 为分析器编写单元测试
分析器单元测试需要引用分析器项目，配置如下：
```XML

<ItemGroup>  
    <ProjectReference Include="..\Analyzers\Analyzers.csproj" ReferenceOutputAssembly="true" OutputItemType="Analyzer" />  
</ItemGroup>
```
和主工程引用分析器工程不同的是，在单元测试里面就应该添加程序集应用，如此才能够让单元测试项目访问到分析器项目的公开成员，从而进行测试。
`OutputItemType="Analyzer"` 是可选的，仅仅用在期望额外将单元测试项目也当成被分析项目时才添加。默认 `ReferenceOutputAssembly`属性值就是 true 值，这里强行写 `ReferenceOutputAssembly="true"` 只是为了强调而已，默认不写即可。
## 编写测试方法
在对分析器，特别是源代码生成器的单元测试中，一般都会通过一个自己编写的`CreateCompilation`方法，这个方法的作用是将传入的源代码字符串封装为`CSharpCompilation`类型。接着使用 `CSharpGeneratorDriver`执行指定的源代码生成器。
常用的封装**CSharpCompilation**代码的`CreateCompilation`方法代码如下。可以简单将 **CSharpCompilation**理解为一个虚拟的项目。一个虚拟的项目重要的部分只有两个，一个就是源代码本身，另一个就是所引用的程序集。在单元测试的源代码本身就是通过 `CSharpSyntaxTree.ParseText` 方法将源代码转换为`SyntaxTree`对象。引用程序集可能会复杂一些，在这个单元测试里面只需要带上 `System.Runtime` 程序集即可，带上的方法是通过某个 `System.Runtime` 程序集的类型，如 `System.Reflection.Binder` 类型，取其类型所在程序集的路径，再通过 `MetadataReference.CreateFromFile` 作为引用路径
```CSharp

private static CSharpCompilation CreateCompilation(string source)
        => CSharpCompilation.Create("compilation",
            new[] { CSharpSyntaxTree.ParseText(source, path: "Foo.cs") },
            new[]
            {
                // 如果缺少引用，那将会导致单元测试有些符号无法寻找正确，从而导致解析失败
            MetadataReference.CreateFromFile(typeof(Binder).GetTypeInfo().Assembly.Location)
            },
            new CSharpCompilationOptions(OutputKind.ConsoleApplication));

```
大部分情况下的分析器单元测试项目的**CSharpCompilation**封装代码相对固定，会变更的只有某些引用逻辑而已。
