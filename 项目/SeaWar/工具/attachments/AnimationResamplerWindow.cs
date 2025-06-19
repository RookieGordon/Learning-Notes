/*
 * @author: guangdong
 * @Date: 2025-06-17 11:06:25
 * @Description: 动画重采样工具，用于将60fps的动画采样成30fps
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using vietlabs.fr2;

public class AnimationResamplerWindow : EditorWindow
{
    private const float TARGET_FPS = 30f;
    private const float TOLERANCE = 0.001f; // 时间容差阈值

    private string _targetPath = string.Empty;
    private List<string> _clipFiles = new List<string>();
    private List<AnimationClip> _animationClips = new List<AnimationClip>();

    private Vector2 _scrollPos;

    /// <summary>
    /// fbx被哪些资源引用的映射
    /// </summary>
    private Dictionary<string, List<string>> _clipUsedByMap = new Dictionary<string, List<string>>();

    /// <summary>
    /// fbx中动画片段和新动画片段的映射
    /// </summary>
    private Dictionary<AnimationClip, AnimationClip> _clipMap = new Dictionary<AnimationClip, AnimationClip>();

    private List<string> _removeList = new List<string>();


    [MenuItem("ArtTools/Animation/动画重采样工具")]
    static void Init()
    {
        GetWindow<AnimationResamplerWindow>("Resampler").Show();
    }

    void OnGUI()
    {
        EditorGUILayout.BeginHorizontal();
        GUILayout.Label("目标目录:", GUILayout.Width(80));
        GUILayout.Label(string.IsNullOrEmpty(_targetPath) ? "未选择目录" : _targetPath);
        if (GUILayout.Button("选择目录", GUILayout.Width(100)))
        {
            _targetPath = EditorUtility.OpenFolderPanel("选择动画目录", "", "");
            RefreshClipList();
        }

        EditorGUILayout.EndHorizontal();

        EditorGUILayout.LabelField("Clip文件列表 (" + _clipFiles.Count + "个):");
        _scrollPos = EditorGUILayout.BeginScrollView(_scrollPos, GUILayout.Height(200));
        for (int i = 0; i < _clipFiles.Count; i++)
        {
            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField(_clipFiles[i], GUILayout.Width(500));
            EditorGUILayout.Space(10);
            _animationClips[i] =
                (AnimationClip)EditorGUILayout.ObjectField(_animationClips[i], typeof(AnimationClip), false,
                    GUILayout.Width(200));
            EditorGUILayout.EndHorizontal();
        }

        EditorGUILayout.EndScrollView();

        EditorGUILayout.Space(10);

        if (GUILayout.Button("重采样", GUILayout.Height(30)))
        {
            ReSampleClip();
        }
    }

    void RefreshClipList()
    {
        if (string.IsNullOrEmpty(_targetPath))
        {
            return;
        }

        _clipFiles.Clear();
        _animationClips.Clear();
        var files = new List<string>();
        files.AddRange(Directory.GetFiles(_targetPath, "*.anim", SearchOption.AllDirectories));
        files = files.ConvertAll(p => p.Replace(Application.dataPath, "Assets"));
        foreach (var VARIABLE in files)
        {
            var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(VARIABLE);
            if (clip.frameRate <= 30.0f)
            {
                continue;
            }

            _clipFiles.Add(VARIABLE);
            _animationClips.Add(clip);
        }
    }

    private void ReSampleClip()
    {
        if (_clipFiles.Count == 0)
        {
            EditorUtility.DisplayDialog("提示", "请先选择动画目录", "确定");
            return;
        }

        PreCollectReferences();
        try
        {
            _removeList.Clear();
            _clipMap.Clear();
            float total = _clipFiles.Count;
            for (int i = 0; i < _clipFiles.Count; i++)
            {
                string clipFile = _clipFiles[i];
                if (EditorUtility.DisplayCancelableProgressBar("处理中",
                        $"正在处理 {Path.GetFileName(clipFile)}", i / total))
                {
                    Debug.LogWarning("用户取消操作");
                    break;
                }

                if (_animationClips[i].frameRate <= 30.0f)
                {
                    Debug.Log($"跳过低精度的动画：{_animationClips[i].name}");
                    continue;
                }

                CompressAnimation(_animationClips[i], clipFile);

                //FixClipRefUtil.FixClipReference(clipFile, _clipUsedByMap, _clipMap);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"处理失败：{e.Message}");
            EditorUtility.DisplayDialog("错误", $"处理过程中发生错误：{e.Message}", "确定");
        }
        finally
        {
            DeleteClipAssets();
            EditorUtility.ClearProgressBar();
            AssetDatabase.Refresh();
            EditorUtility.DisplayDialog("警告", "建议对比采样前后的动画效果！", "OK");
        }
    }

    private void PreCollectReferences()
    {
        _clipUsedByMap.Clear();
        for (int i = 0; i < _clipFiles.Count; i++)
        {
            var usedByList = new List<string>();
            FR2_Export.SelectUsed_wtme(_clipFiles[i], usedByList);
            _clipUsedByMap.Add(_clipFiles[i], usedByList);
        }
    }

    #region 动画处理

    private void CompressAnimation(AnimationClip sourceClip, string originalClipPath)
    {
        AnimationClip newClip = new AnimationClip();
        newClip.frameRate = TARGET_FPS;
        newClip.legacy = sourceClip.legacy;
        newClip.wrapMode = sourceClip.wrapMode;

        var sourceClipSetting = AnimationUtility.GetAnimationClipSettings(sourceClip);
        var newClipSetting = AnimationUtility.GetAnimationClipSettings(newClip);
        newClipSetting.loopTime = sourceClipSetting.loopTime;
        AnimationUtility.SetAnimationClipSettings(newClip, newClipSetting);


        EditorCurveBinding[] bindings = AnimationUtility.GetCurveBindings(sourceClip);

        // 处理每条曲线
        foreach (var binding in bindings)
        {
            AnimationCurve sourceCurve = AnimationUtility.GetEditorCurve(sourceClip, binding);
            AnimationCurve targetCurve = ConvertCurveTo30FPS(sourceCurve);
            AnimationUtility.SetEditorCurve(newClip, binding, targetCurve);
        }

        // 复制动画事件
        CopyAnimationEvents(sourceClip, newClip);

        // 设置动画帧率
        SetAnimationFrameRate(newClip);

        var savePath = originalClipPath.Replace(".anim", "_30FPS.anim");
        AssetDatabase.CreateAsset(newClip, savePath);
        AssetDatabase.SaveAssets();

        Debug.Log($"Optimized animation compressed successfully! Saved to: {savePath}");
    }

    AnimationCurve ConvertCurveTo30FPS(AnimationCurve sourceCurve)
    {
        List<Keyframe> newKeys = new List<Keyframe>();
        float frameTime60 = 1f / 60f;
        float frameTime30 = 1f / 30f;

        // 获取并排序原始关键帧时间
        float[] srcKeyTimes = new float[sourceCurve.length];
        for (int i = 0; i < sourceCurve.length; i++)
        {
            srcKeyTimes[i] = sourceCurve.keys[i].time;
        }

        Array.Sort(srcKeyTimes);

        // 计算总帧数
        float animLength = sourceCurve.keys[sourceCurve.length - 1].time;
        int totalFrames30 = Mathf.CeilToInt(animLength / frameTime30);

        for (int f30Index = 1; f30Index <= totalFrames30; f30Index++)
        {
            float time30 = (f30Index - 1) * frameTime30;
            int f60Index = 2 * f30Index - 1;
            float time60 = (f60Index - 1) * frameTime60;

            if (f30Index % 2 == 1) // 奇数帧
            {
                int keyIndex = FindKeyIndex(sourceCurve, time60);
                if (keyIndex >= 0)
                {
                    newKeys.Add(sourceCurve.keys[keyIndex]);
                }
            }
            else // 偶数帧
            {
                float time60_pre = time60 - frameTime60;
                float time60_next = time60 + frameTime60;

                int idx_pre = FindKeyIndex(sourceCurve, time60_pre);
                int idx = FindKeyIndex(sourceCurve, time60);
                int idx_next = FindKeyIndex(sourceCurve, time60_next);

                Keyframe? key_pre = idx_pre >= 0 ? sourceCurve.keys[idx_pre] : (Keyframe?)null;
                Keyframe? key = idx >= 0 ? sourceCurve.keys[idx] : (Keyframe?)null;
                Keyframe? key_next = idx_next >= 0 ? sourceCurve.keys[idx_next] : (Keyframe?)null;

                if (CalculateEvenFrameValue(
                        key_pre, key, key_next, time60, sourceCurve, out var newValue))
                {
                    newKeys.Add(new Keyframe(time30, newValue));
                }
            }
        }

        // 创建优化后的曲线
        AnimationCurve newCurve = new AnimationCurve(newKeys.ToArray());
        OptimizeCurve(newCurve);
        return newCurve;
    }

    // 使用二分查找提高关键帧检测效率
    int FindKeyIndex(AnimationCurve curve, float time)
    {
        int left = 0;
        int right = curve.length - 1;
        while (left <= right)
        {
            int mid = (left + right) / 2;
            float diff = curve.keys[mid].time - time;
            if (Mathf.Abs(diff) < 0.0001f)
            {
                return mid;
            }

            if (diff < 0)
            {
                left = mid + 1;
            }
            else
            {
                right = mid - 1;
            }
        }

        return -1;
    }

    bool CalculateEvenFrameValue(Keyframe? k1, Keyframe? k2, Keyframe? k3,
        float baseTime, AnimationCurve curve, out float newValue)
    {
        newValue = 0;
        // 2.1 三个关键帧都存在
        if (k1.HasValue && k2.HasValue && k3.HasValue)
        {
            newValue = (k1.Value.value + k2.Value.value + k3.Value.value) / 3f;
            return true;
        }

        // 2.2 两个相邻关键帧存在
        if (k1.HasValue && k2.HasValue && !k3.HasValue)
        {
            float t = (baseTime - k1.Value.time) / (k2.Value.time - k1.Value.time);
            newValue = HermiteInterpolate(k1.Value, k2.Value, t);
            return true;
        }

        if (!k1.HasValue && k2.HasValue && k3.HasValue)
        {
            float t = (baseTime - k2.Value.time) / (k3.Value.time - k2.Value.time);
            newValue = HermiteInterpolate(k2.Value, k3.Value, t);
            return true;
        }

        // 2.3 只有中间关键帧存在
        if (!k1.HasValue && k2.HasValue && !k3.HasValue)
        {
            newValue = k2.Value.value;
            return true;
        }

        // 2.4 单边缘关键帧+曲线采样
        if (k1.HasValue && !k2.HasValue && !k3.HasValue)
        {
            newValue = k1.Value.value + k1.Value.outTangent * (baseTime - k1.Value.time);
            return true;
        }

        if (!k1.HasValue && !k2.HasValue && k3.HasValue)
        {
            newValue = k3.Value.value + k3.Value.inTangent * (baseTime - k3.Value.time);
            return true;
        }

        return false;
    }

    // 使用Hermite插值获得更平滑结果
    float HermiteInterpolate(Keyframe a, Keyframe b, float t)
    {
        float t2 = t * t;
        float t3 = t2 * t;
        float h1 = 2 * t3 - 3 * t2 + 1;
        float h2 = -2 * t3 + 3 * t2;
        return h1 * a.value + h2 * b.value;
    }

    void OptimizeCurve(AnimationCurve curve)
    {
        // 基于角度变化的优化算法
        float angleThreshold = 2f; // 角度变化阈值(度)

        for (int i = curve.length - 2; i > 0; i--)
        {
            Vector2 prev = new Vector2(curve.keys[i - 1].time, curve.keys[i - 1].value);
            Vector2 current = new Vector2(curve.keys[i].time, curve.keys[i].value);
            Vector2 next = new Vector2(curve.keys[i + 1].time, curve.keys[i + 1].value);

            Vector2 toCurrent = current - prev;
            Vector2 toNext = next - current;

            if (toCurrent.sqrMagnitude > 0 && toNext.sqrMagnitude > 0)
            {
                float angle = Vector2.Angle(toCurrent, toNext);
                if (angle < angleThreshold)
                {
                    curve.RemoveKey(i);
                }
            }
        }

        // 自动平滑切线
        for (int i = 0; i < curve.length; i++)
        {
            curve.SmoothTangents(i, 1.0f);
        }
    }

    void CopyAnimationEvents(AnimationClip sourceClip, AnimationClip targetClip)
    {
        AnimationEvent[] sourceEvents = AnimationUtility.GetAnimationEvents(sourceClip);
        AnimationUtility.SetAnimationEvents(targetClip, sourceEvents);
    }

    void SetAnimationFrameRate(AnimationClip targetClip)
    {
        // 设置动画帧率为30FPS
        SerializedObject serializedClip = new SerializedObject(targetClip);
        SerializedProperty sampleRate = serializedClip.FindProperty("m_SampleRate");
        sampleRate.floatValue = 30f;
        serializedClip.ApplyModifiedProperties();
    }

    #endregion

    private void DeleteClipAssets()
    {
        if (_removeList.Count == 0)
        {
            return;
        }

        var failures = new List<string>();
        AssetDatabase.DeleteAssets(_removeList.ToArray(), failures);
        if (failures.Count > 0)
        {
            var errorMessage = $"删除Clip文件失败：{string.Join("\n", failures)}";
            Debug.LogError(errorMessage);
            EditorUtility.DisplayDialog("错误", errorMessage, "确定");
        }
    }
}