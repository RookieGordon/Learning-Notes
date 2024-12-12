/*
 * author       : TGD-3-89
 * datetime     : 2024/12/10 16:53:53
 * description  : AC自动机(Aho-Corasick Automaton)，高效处理多模式字符串匹配问题的数据结构
 * */

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Collections.Generic;
using Hotfixs.GameCfg.StaticData;

class AhoCorasick
{
    // 节点定义
    private class TrieNode
    {
        public Dictionary<char, TrieNode> Children = new Dictionary<char, TrieNode>();
        public TrieNode FailPointer = null; // 失败指针
        public List<int> Output = new List<int>(); // 存储匹配到的敏感词索引
    }

    private TrieNode Root = new TrieNode();
    private List<string> Patterns = new List<string>(); // 保存所有敏感词

    
    public void AddPattern(string pattern)
    {
        TrieNode current = Root;
        foreach (char c in pattern)
        {
            if (!current.Children.ContainsKey(c))
                current.Children[c] = new TrieNode();
            current = current.Children[c];
        }

        current.Output.Add(Patterns.Count);
        Patterns.Add(pattern);
    }

    // 构建失败指针
    private void BuildFailurePointers()
    {
        Queue<TrieNode> queue = new Queue<TrieNode>();
        foreach (var child in Root.Children.Values)
        {
            child.FailPointer = Root;
            queue.Enqueue(child);
        }

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();

            foreach (var kvp in current.Children)
            {
                char c = kvp.Key;
                TrieNode child = kvp.Value;

                TrieNode failure = current.FailPointer;
                while (failure != null && !failure.Children.ContainsKey(c))
                    failure = failure.FailPointer;

                child.FailPointer = (failure == null) ? Root : failure.Children[c];
                if (child.FailPointer.Output != null)
                    child.Output.AddRange(child.FailPointer.Output);

                queue.Enqueue(child);
            }
        }
    }

    // 替换敏感词
    public string ReplaceSensitiveWords(string input)
    {
        BuildFailurePointers(); // 确保失败指针已经被构建
        char[] result = input.ToCharArray(); // 转为字符数组，便于替换

        TrieNode current = Root;
        for (int i = 0; i < input.Length; i++)
        {
            char c = input[i];

            // 移动失败指针直到匹配当前字符为止
            while (current != null && !current.Children.ContainsKey(c))
                current = current.FailPointer;

            if (current == null)
                current = Root;
            else
                current = current.Children[c];

            if (current.Output.Count > 0) // 找到敏感词
            {
                foreach (int patternIndex in current.Output)
                {
                    int start = i - Patterns[patternIndex].Length + 1; // 计算敏感词起始位置
                    for (int j = start; j <= i; j++) // 敏感词替换为 *
                        result[j] = '*';
                }
            }
        }

        return new string(result);
    }
}

public class SensitiveWordsHelper
{
    private static AhoCorasick _ac;
    private static HashSet<string> _wordSet = new HashSet<string>();

    public static string Filter(string input)
    {
        if (SensitiveWordsHelper._ac == null)
        {
            SensitiveWordsHelper._ac = new AhoCorasick();
            foreach (var VARIABLE in IllegallyWordCfgCreater.GetData().Values)
            {
                if (SensitiveWordsHelper._wordSet.Contains(VARIABLE.Word))
                {
                    continue;
                }

                SensitiveWordsHelper._wordSet.Add(VARIABLE.Word);
                SensitiveWordsHelper._ac.AddPattern(VARIABLE.Word);
            }
        }

        return SensitiveWordsHelper._ac.ReplaceSensitiveWords(input);
    }
}