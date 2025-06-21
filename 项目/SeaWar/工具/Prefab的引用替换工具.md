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
# 解决方案步骤
## 1. 获取资源的 GUID 和 LocalID
```CSharp
// 获取任意资源的 GUID 和 FileID
public static (string guid, long fileId) GetResourceIDs(UnityEngine.Object obj)
{
    if (AssetDatabase.TryGetGUIDAndLocalFileIdentifier(obj, out string guid, out long fileId))
        return (guid, fileId);
    throw new System.Exception("Resource not found: " + obj.name);
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



