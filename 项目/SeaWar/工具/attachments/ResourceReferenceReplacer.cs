using System;
using UnityEngine;
using UnityEditor;
using System.IO;
using System.Text.RegularExpressions;
using Object = UnityEngine.Object;

public class ResourceReferenceReplacer : EditorWindow
{
    private Object targetPrefab;
    private Object oldResource;
    private Object newResource;
    private string logText = "";

    [MenuItem("Tools/Resource Reference Replacer")]
    public static void ShowWindow()
    {
        GetWindow<ResourceReferenceReplacer>("Resource Replacer");
    }

    void OnGUI()
    {
        GUILayout.Label("Replace Resource References", EditorStyles.boldLabel);

        targetPrefab = EditorGUILayout.ObjectField("Target Prefab", targetPrefab, typeof(GameObject), false);
        oldResource = EditorGUILayout.ObjectField("Old Resource (B)", oldResource, typeof(Object), false);
        newResource = EditorGUILayout.ObjectField("New Resource (C)", newResource, typeof(Object), false);

        if (GUILayout.Button("Replace References"))
        {
            if (targetPrefab == null || oldResource == null || newResource == null)
            {
                logText = "Error: All fields must be assigned!";
            }
            else
            {
                ReplaceReferences();
            }
        }

        EditorGUILayout.TextArea(logText, GUILayout.Height(100));
    }

    void ReplaceReferences()
    {
        string prefabPath = AssetDatabase.GetAssetPath(targetPrefab);
        if (string.IsNullOrEmpty(prefabPath) || !prefabPath.EndsWith(".prefab"))
        {
            logText = "Error: Invalid prefab selected";
            return;
        }

        // 获取资源的GUID和FileID
        string oldGUID, newGUID;
        long oldFileID, newFileID;
        int oldTypeID, newTypeID;

        GetResourceMeta(oldResource, out oldGUID, out oldFileID, out oldTypeID);
        GetResourceMeta(newResource, out newGUID, out newFileID, out newTypeID);

        try
        {
            string content = File.ReadAllText(prefabPath);
            // 构建匹配模式（考虑type字段位置变化）
            string pattern = $@"{{fileID: {oldFileID}, guid: {oldGUID}, type: {oldTypeID}}}";
            string newReference = $"{{fileID: {newFileID}, guid: {newGUID}, type: {newTypeID}}}";

            logText = $"Matching pattern: {pattern}\n" +
                      $"Replacement: {newReference}\n\n";

            if (Regex.IsMatch(content, pattern))
            {
                int count = 0;
                // 使用更安全的逐行处理
                string[] lines = File.ReadAllLines(prefabPath);
                for (int i = 0; i < lines.Length; i++)
                {
                    if (Regex.IsMatch(lines[i], pattern))
                    {
                        count++;
                        lines[i] = Regex.Replace(lines[i],
                            Regex.Escape($"{oldFileID}"),
                            $"{newFileID}");
                        lines[i] = Regex.Replace(lines[i],
                            Regex.Escape($"{oldGUID}"),
                            $"{newGUID}");
                        lines[i] = Regex.Replace(lines[i],
                            $@"type: {oldTypeID}",
                            $"type: {newTypeID}");
                    }
                }

                File.WriteAllLines(prefabPath, lines);
                AssetDatabase.Refresh();

                logText += $"Success: {count} references replaced!\n" +
                           $"Old: {oldResource.name} ({oldGUID}:{oldFileID}, type:{oldTypeID})\n" +
                           $"New: {newResource.name} ({newGUID}:{newFileID}, type:{newTypeID})";
            }
            else
            {
                logText += "Warning: No matching references found\n" +
                           "Possible reasons:\n" +
                           "1. Resource not used in this prefab\n" +
                           "2. FileID/GUID format mismatch\n" +
                           "3. Different serialization format";
            }
        }
        catch (Exception e)
        {
            logText = $"Error: {e.Message}\n{e.StackTrace}";
        }
    }

    bool GetResourceMeta(Object obj, out string guid, out long fileID, out int typeID)
    {
        AssetDatabase.TryGetGUIDAndLocalFileIdentifier(obj, out guid, out fileID);
        typeID = GetResourceTypeID(obj);
        return true;
    }

    int GetResourceTypeID(Object obj)
    {
        // 根据Unity文档定义资源类型ID
        // Type 2: 直接从Assets加载的资源 (Materials, .asset文件)
        // Type 3: 从Library加载的资源 (预制件, 纹理, 3D模型)

        if (obj is Material) return 2; // Materials是Type 2
        if (obj is ScriptableObject) return 2; // .asset文件是Type 2
        if (obj is AnimationClip)
        {
            return AssetDatabase.IsMainAsset(obj) ? 2 : 3; // AnimationClip主资源是Type 2，子资源是Type 3
        }

        // 其他资源默认为Type 3
        return 3;
    }
}