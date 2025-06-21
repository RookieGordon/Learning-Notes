---
tags:
  - SeaWar/工具/Prefab的引用替换工具
  - mytodo
  - Unity/Tools/Prefab读取
  - Yaml文件解析
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/工具
dateStart: 2025-06-16
dateFinish: 2025-06-21
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
在 Unity 中替换 Prefab 对资源的引用，直接解析 Prefab 的 YAML 文件是更通用且强大的方法。这种方法不依赖组件类型，通过修改资源 GUID 和 FileID 实现精准替换。以下是完整解决方案：
# 核心原理
1. **Prefab 文件结构**：Unity 的 `.prefab` 文件实质是 YAML 格式的文本文件
2. **资源引用标识**：
    - `guid`：资源的全局唯一标识（存储在 .meta 文件）
    - `fileID`：资源内部子对象的标识（如 Texture 的主对象为 0，Sprite 是子对象）
3. **引用格式**：`{fileID: 11500000, guid: 5f489...8df1, type: 3}`
## 关于引用资源的type
具体参考文章：

```cardlink
url: https://unity.com/blog/engine-platform/understanding-unitys-serialization-language-yaml
title: "了解Unity的序列化语言：YAML"
description: "知道吗？你不必在Unity编辑器中使用XML或JSON等序列化语言就可以编辑任何种类的资产。尽管这种方法在大多数时候都能用，但有时你必须直接修改文件。比如为了避免合并冲突或损坏文件。而在这篇博文中，我们将进一步解读Unity的序列化系统，并介绍几种直接修改资产文件的用例。"
host: unity.com
favicon: /favicon.ico
image: https://cdn.sanity.io/images/fuvbjjlp/production/dcf278a2d2cf399de9d757722ca728604cfeab4d-600x338.png
```
总结来说：
>[!IMPORTANT]
>Type 用于确定应从 Assets 文件夹还是 Library 文件夹加载文件。请注意，它仅支持以下值，从 2 开始（假设 0 和 1 已弃用）：
>- 类型 2：可由 Editor 直接从 Assets 文件夹加载的资源，如 Materials 和 .asset 文件
>- 类型 3：已在 Library 文件夹中处理和写入并由 Editor 从那里加载的资源，例如预制件、纹理和 3D 模型

经过实际测试发现：
![[（图解5）不同资源的引用数据.png|630]]
可以发现，独立出来的动画片段，其type也是2，而FBX中的动画片段，其type则是3。
# 解决方案步骤
## 1. 获取资源的 GUID、LocalID和type
```CSharp
bool GetResourceMeta(Object obj, out string guid, out long fileID, out int typeID)  
{  
    AssetDatabase.TryGetGUIDAndLocalFileIdentifier(obj, out guid, out fileID);  
    typeID = GetResourceTypeID(obj);  
    return true;  
}

int GetResourceTypeID(Object obj)  
{  
    if (obj is Material) return 2; // Materials是Type 2  
    if (obj is ScriptableObject) return 2; // .asset文件是Type 2  
    if (obj is AnimationClip)  
    {        
	    return AssetDatabase.IsMainAsset(obj) ? 2 : 3; // AnimationClip主资源是Type 2，子资源是Type 3  
    }  
  
    // 其他资源默认为Type 3  
    return 3;  
}
```
## 2. 解析并修改 Prefab YAML
```CSharp
using System.IO;
using YamlDotNet.RepresentationModel;

public static void ReplacePrefabReference(
    string prefabPath, 
    (string guid, long fileId) source, 
    (string guid, long fileId) target)
{
    string yaml = File.ReadAllText(prefabPath);
    var stream = new YamlStream();
    stream.Load(new StringReader(yaml));

    bool modified = false;
    foreach (YamlDocument doc in stream.Documents)
    {
        TraverseYaml(doc.RootNode, node => 
        {
            if (!(node is YamlMappingNode mapping)) return;

            // 检测资源引用字段
            if (mapping.Children.TryGetValue("guid", out YamlNode guidNode) &&
                mapping.Children.TryGetValue("fileID", out YamlNode fileIdNode))
            {
                string guid = ((YamlScalarNode)guidNode).Value;
                long fileId = long.Parse(((YamlScalarNode)fileIdNode).Value);

                // 匹配源资源
                if (guid == source.guid && fileId == source.fileId)
                {
                    // 替换为新资源
                    ((YamlScalarNode)guidNode).Value = target.guid;
                    ((YamlScalarNode)fileIdNode).Value = target.fileId.ToString();
                    modified = true;
                }
            }
        });
    }

    if (modified)
    {
        using (var writer = new StringWriter())
        {
            stream.Save(writer, false);
            File.WriteAllText(prefabPath, writer.ToString());
        }
        Debug.Log("Prefab references updated: " + prefabPath);
    }
}

// 递归遍历 YAML 节点
private static void TraverseYaml(YamlNode node, System.Action<YamlNode> action)
{
    action(node);
    switch (node)
    {
        case YamlMappingNode mapping:
            foreach (var child in mapping.Children.Values)
                TraverseYaml(child, action);
            break;
        case YamlSequenceNode sequence:
            foreach (var child in sequence.Children)
                TraverseYaml(child, action);
            break;
    }
}
```



