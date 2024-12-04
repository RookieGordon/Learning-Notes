// jave.lin 2024/09/16

// jave.lin :
// [打开] 开启 Profiler sample 的话
// 需要 sublime 软件，CTRL + H 打开替换
// 输入
// 查找 : (\s*)\b(using\s*\(new\s+ProfilerSample\(.*\)\n)
// 替换 : \n#if __ENABLED_PROFILER__\1\2#endif\n

// jave.lin :
// [关闭] 开启 Profiler sample 的话
// 需要 sublime 软件，CTRL + H 打开替换
// 输入
// 查找 : (\s*#if\s+__ENABLED_PROFILER__\s*\n)(.*\n)(\s*#endif\s*\n)
// 替换 : \n\2

// 注意，[打开] [有] 动态的 profiler 名字的功能，[profiler 分析 QT 会有大量GC]

// 如果需要 [打开] 带有 Name 的 profiler 提示功能的话
// 输入
// 查找 : (\s*)\b(using\s*\(new\s+ProfilerSample\(\s*)((\$)?(")(\(\{Name\}\))?(.*\n))
// 替换 : \1\2$\5({Name})\7

// 如果需要 [关闭] 带有 Name 的 profiler 提示功能的话
// 输入
// 查找 : (\s*)\b(using\s*\(new\s+ProfilerSample\(\s*)((\$)(")(\(\{Name\}\))(.*\n))
// 替换 : \1\2\5\7

// jave.lin 2024/09/16

// jave.lin :
// [Open] To enable Profiler sample 
// Requires Sublime software, press CTRL + H to open replace 
// Input 
// Find: (\s*)\b(using\s*\(new\s+ProfilerSample\(.*\)\n) 
// Replace: \n#if __ENABLED_PROFILER__\1\2#endif\n

// jave.lin :
// [Close] To enable Profiler sample 
// Requires Sublime software, press CTRL + H to open replace 
// Input 
// Find: (\s*#if\s+__ENABLED_PROFILER__\s*\n)(.*\n)(\s*#endif\s*\n) 
// Replace: \n\2

// Note: [Open] [Has] dynamic profiler name functionality, [profiler analysis QT may have a lot of GC]

// If you need to [Open] the profiler hint feature with Name
// Input
// Find: (\s*)\b(using\s*\(new\s+ProfilerSample\(\s*)((\$)?(")(\(\{Name\}\))?(.*\n)) 
// Replace: \1\2$\5({Name})\7

// If you need to [Close] the profiler hint feature with Name 
// Input 
// Find: (\s*)\b(using\s*\(new\s+ProfilerSample\(\s*)((\$)(")(\(\{Name\}\))(.*\n)) 
// Replace: \1\2\5\7


using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;
using FPLibrary;
using UnityEngine;

namespace SAS.QuadTree
{
    /// <summary>
    /// QuadTree 类
    /// （
    ///     目前封装的写法适合静态构建四叉树的写法，
    ///     如果需要动态调整，可能还需要四叉树刷新机制，或是重构树的机制，
    ///     简单粗暴的重构树，也可以先 Clear 再逐个 Insert，但是会导致 Insert 消耗增加
    ///
    ///     jave.lin:2024/09/26 08:58:42 增加 四叉树 动态增加 Remove(T) 的API，和 RemoveEmptys() API，可只是动态刷新机制
    ///     但是有这种方法也使用前提，就是节点的数量并不会非常多的情况下，可以大大提升效率
    ///     目前测试量级是：
    ///         CPU : 11th Gen Intel(R) Core(TM) i7-11700KF @ 3.60GHz
    ///         unity editor play mode + profiler 采样测试
    ///         单帧 调用
    ///         * Select(QTAABB, List<T>) 240+ 次
    ///         * Insert 100+ 次
    ///         * Remove 40+ 次
    ///         * RemoveEmptys 1次
    ///         总耗时大概是 0.86ms
    /// ）
    /// 参考另一个：https://github.com/futurechris/QuadTree 该开源库写得还是不错的，可读性也高
    /// date    : 2021/02/18
    /// author  : jave.lin
    /// </summary>
    /// <typeparam name="T">四叉树中需要被包裹的实体对象类型</typeparam>
    public class QuadTree<T> : IDisposable, IQuadTree<T>
    {
        public const int MAX_LIMIT_LEVEL = 16; // 四叉树最大可以设置的深度
        public const int DEFAULT_MAX_LEVEL = 8; // 默认的最大深度级别
        public const int DEFAULT_MAX_LEAF_PER_BRANCH = 8; // 默认的枝干最多能放多少叶子就要去分裂，深度不足，将会放在最后一层的枝干

        /// <summary>
        /// 四叉树的 Leaf 叶子类
        /// </summary>
        public struct Leaf<T>
        {
            public T value; // 包裹的数据对象
            public QTAABB aabb; // 该叶子的 AABB
        }
        
        /// <summary>
        /// 四叉树的 Branch 枝干类
        /// </summary>
        public class Branch
        {
            public int instanceID; // 实例ID
            public Branch parent; // 父枝干
            public int idxOfParent; // 所在 父枝干 的索引
            public int depth; // 该枝干的深度
            public bool hasSplit; // 有无再次分过枝干
            public QTAABB aabb; // 该枝干
            public QTAABB[] aabbs = new QTAABB[4]; // 分支的四象限的 AABB       （先创建对象：空间换时间，省去后续的大量 != null 判断）
            public Branch[] branches = new Branch[4]; // 分支的枝干                （先创建对象：空间换时间，省去后续的大量 != null 判断）
            public List<Leaf<T>> leaves = new List<Leaf<T>>(8); // 拥有的叶子                （先创建对象：空间换时间，省去后续的大量 != null 判断）

            public bool AnySubBranchInst()
            {
                for (int i = 0; i < 4; i++)
                {
                    if (branches[i] != null)
                        return true;
                }

                return false;
            }
            
            public string Dump(string indent)
            {
                return
                    $"{indent}branch.instanceID:{instanceID}" +
                    $", depth:{depth}" +
                    $", idxOfParent:{idxOfParent}" +
                    $", hasSplit:{hasSplit}" +
                    $", leaves.count:{leaves.Count}";
            }

            public string DumpLeaves(string indent)
            {
                var sb = new StringBuilder();
                sb.AppendLine($"{indent}[branch.leaves]:");
                for (int i = 0; i < leaves.Count; i++)
                {
                    var leaf = leaves[i];
                    sb.AppendLine($"{indent}value:{leaf.value}, aabb:{leaf.aabb}");
                }

                return sb.ToString();
            }
        }

        // 四叉树名字，一般用于调试用，默认: "Unnamed"
        public string Name
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set;
        } = "Unnamed";

        // 根枝干
        public Branch root;

        // 最大层级
        private int _maxLevel;

        // 叶子到达该数量时就会再次划分出枝干
        private int _maxLeafPerBranch;

        // 枝干表, key : 枝干ID, 枝干对象
        private Dictionary<int, Branch> _branchID2BranchObjDict = new Dictionary<int, QuadTree<T>.Branch>();

        // 叶子表, key : 包裹数据对象, val : 什么枝干 ID 包含了这个叶子数据对象，这时一个 枝干 列表
        private Dictionary<T, List<int>> _obj2BelongBranchIDsDict = new Dictionary<T, List<int>>();

        // 枝干、叶子的池子（减少 GC 频繁触发的问题），每个池子在自身的类对象下管理即可，看情况而是否该成 static 的
        private Stack<Branch> _branchPool = new Stack<Branch>();
        private ListPool<int> _listLeafPool = new ListPool<int>();
        private ListPool<T> _listDataPool = new ListPool<T>();
        private HashSet<T> _distinctHelper = new HashSet<T>();
        
        private int _branchInstanceCounter;

        /// <summary>
        /// 构建四叉树
        /// </summary>
        /// <param name="aabb">整个QuadTree的最大aabb</param>
        /// <param name="maxLevel">四叉树的最大深度</param>
        /// <param name="maxLeafPerBranch">四叉树单个叶子的最大数量</param>
        public QuadTree(QTAABB aabb,
            int maxLevel = DEFAULT_MAX_LEVEL, int maxLeafPerBranch = DEFAULT_MAX_LEAF_PER_BRANCH)
            : this(aabb.x, aabb.y, aabb.w, aabb.h, maxLevel, maxLeafPerBranch)
        {
        }

        /// <summary>
        /// 构建四叉树
        /// </summary>
        /// <param name="x">整个QuadTree的最大aabb的x</param>
        /// <param name="y">整个QuadTree的最大aabb的y</param>
        /// <param name="w">整个QuadTree的最大aabb的w</param>
        /// <param name="h">整个QuadTree的最大aabb的h</param>
        /// <param name="maxLevel">四叉树的最大深度</param>
        /// <param name="maxLeafPerBranch">四叉树单个叶子的最大数量</param>
        public QuadTree(Fix64 x, Fix64 y, Fix64 w, Fix64 h,
            int maxLevel = DEFAULT_MAX_LEVEL, int maxLeafPerBranch = DEFAULT_MAX_LEAF_PER_BRANCH)
        {
            _Reset(x, y, w, h, maxLevel, maxLeafPerBranch);
        }

        /// <summary>
        /// 销毁
        /// </summary>
        public void Dispose()
        {
            Clear();

            if (root != null)
            {
                _RecycleBranchToPool(root);
                root = null;
            }

            if (_distinctHelper != null)
            {
                _distinctHelper.Clear();
                _distinctHelper = null;
            }

            if (_branchID2BranchObjDict != null)
            {
                _branchID2BranchObjDict.Clear();
                _branchID2BranchObjDict = null;
            }

            if (_obj2BelongBranchIDsDict != null)
            {
                _obj2BelongBranchIDsDict.Clear();
                _obj2BelongBranchIDsDict = null;
            }

            if (_branchPool != null)
            {
                _branchPool.Clear();
                _branchPool = null;
            }

            if (_listLeafPool != null)
            {
                _listLeafPool.Dispose();
                _listLeafPool = null;
            }

            if (_listDataPool != null)
            {
                _listDataPool.Dispose();
                _listDataPool = null;
            }
        }

        public void Clear()
        {
            // using (new ProfilerSample("QuadTree.Clear()"))
            {
                if (root != null)
                {
                    // 原来的 aabb
                    var src_aabb = root.aabb;

                    // 回收 root
                    _RecycleBranchToPool(root);
                    _branchID2BranchObjDict.Clear();

                    // 这里遍历 _obj2LeavesDict.Values 会有GC，没法优化，C#.NET 底层封装的问题
                    foreach (var item in _obj2BelongBranchIDsDict.Values)
                    {
                        _listLeafPool.ToPool(item);
                    }

                    _obj2BelongBranchIDsDict.Clear();

                    // 还原之前的root
                    // _branchInstanceCounter = 0;
                    root = _GetBranchFromPool(null, 0, ref src_aabb, -1);
                }
            }
        }

        // 删除 空枝干
        public void RemoveEmptys()
        {
            // using (new ProfilerSample("QuadTree.RemoveEmptys()"))
            {
                var t_pBranch = root;
                for (int i = 0; i < 4; i++)
                {
                    _RemoveEmptyBranch(t_pBranch.branches[i]);
                }
            }
        }

        private void _RemoveEmptyBranch(Branch branch)
        {
            if (branch == null)
                return;

            // using (new ProfilerSample("QuadTree._RemoveEmptyBranch()"))
            {
                for (int i = 0; i < 4; i++)
                {
                    var b = branch.branches[i];
                    if (b == null) continue;
                    if (_BranchCanRecycle(b))
                    {
                        _RecycleBranchToPool(b);
                    }
                    else
                    {
                        _RemoveEmptyBranch(b);
                    }
                }

                if (_BranchCanRecycle(branch))
                {
                    _RecycleBranchToPool(branch);
                }
            }
        }
        
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public InsertRetType Insert(T p_obj, QTAABB aabb)
        {
            return Insert(p_obj, ref aabb);
        }

        public InsertRetType Insert(T obj, ref QTAABB aabb)
        {
            // using (new ProfilerSample("QuadTree.Insert()"))
            {
                Remove(obj);
                return _Insert(root, new Leaf<T>()
                {
                    value = obj,
                    aabb = aabb,
                });
            }
        }

        public bool Remove(T value)
        {
            var ret = false;

            // using (new ProfilerSample("QuadTree.Remove()"))
            {
                // var need_handle_branch_list = _listBranchPool.FromPool();

                // 先从所有 枝干删除
                if (_obj2BelongBranchIDsDict.TryGetValue(value, out var branchInstIDList))
                {
                    // Debug.Log($"删除的 : 叶子 {value.ToString()} 从属于 {branchInstIDList.Count} 个枝干里面");
                    // for (int i = 0; i < branchInstIDList.Count; i++)
                    // {
                    //     var branchInst5ID = branchInstIDList[i];
                    //     if (_branchID2BranchObjDict.TryGetValue(branchInst5ID, out var branch))
                    //     {
                    //         Debug.Log($"删除的 叶子 {value.ToString()} 第{i}个枝干 : {branch.ToString()}");
                    //     }
                    // }

                    for (int i = 0; i < branchInstIDList.Count; i++)
                    {
                        var branchInst5ID = branchInstIDList[i];
                        if (_branchID2BranchObjDict.TryGetValue(branchInst5ID, out var branch))
                        {
                            if (_RemoveLeafFromBranch(value, branch))
                            {
                                // if (root != branch)
                                // {
                                //     need_handle_branch_list.Add(branch);
                                //     // _RecycleBranchChains(branch);
                                // }

                                ret = true;
                            }
                        }
                    }

                    _obj2BelongBranchIDsDict.Remove(value);
                    _listLeafPool.ToPool(branchInstIDList);
                }
                
                // // 再清理枝干
                // if (need_handle_branch_list.Count > 0)
                // {
                //     for (int i = 0; i < need_handle_branch_list.Count; i++)
                //     {
                //         _RecycleBranchChains(need_handle_branch_list[i]);
                //     }
                // }
                //
                // _listBranchPool.ToPool(need_handle_branch_list);
            }
            
            // Debug.Log($"Remove.dump:{value}\n{Dump()}");

            return ret;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Select(Fix64 x, Fix64 y, Fix64 w, Fix64 h, List<T> ret)
        {
            Select(new QTAABB { x = x, y = y, w = w, h = h }, ret);
        }

        private int _counter_SelectByAABB = 0;

        public void Select(QTAABB aabb, List<T> ret)
        {
            // using (new ProfilerSample("QuadTree.Select() by aabb"))
            {
                ret.Clear();

                // using (new ProfilerSample("QuadTree.Select() by aabb, _SelectByAABB"))
                {
                    _counter_SelectByAABB = 0;
                    _SelectByAABB(ref aabb, ret, root);
                }

                if (ret.Count > 1)
                {
                    // using (new ProfilerSample("QuadTree.Select() by aabb, _Distinct"))
                        _Distinct(ret, _distinctHelper);
                }
            }
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Select(Fix64 x, Fix64 y, List<T> ret)
        {
            Select(new FPVector2(x, y), ret);
        }

        public void Select(FPVector2 pos, List<T> ret)
        {
            // using (new ProfilerSample("QuadTree.Select by pos 1"))
            {
                ret.Clear();
                _SelectByPos(ref pos, ret, root);
                if (ret.Count > 1)
                {
                    _Distinct(ret, _distinctHelper);
                }
            }
        }

        public void Select(List<QTAABB> aabbs, List<T> ret)
        {
            if (aabbs.Count == 0)
                return;

            // using (new ProfilerSample("QuadTree.Select by aabbs"))
            {
                ret.Clear();

                // using (new ProfilerSample("QuadTree.Select by aabbs, _SelectByAABBS"))
                    _SelectByAABBS(aabbs, ret, root);

                if (ret.Count > 1)
                {
                    // using (new ProfilerSample("QuadTree.Select by aabbs, _Distinct"))
                        _Distinct(ret, _distinctHelper);
                }
            }
        }

        private bool _RemoveLeafFromBranch(T value, Branch branch)
        {
            var ret = false;
            // using (new ProfilerSample("QuadTree._RemoveFromBranch() 1"))
            {
                var leafs = branch.leaves;
                var count = leafs.Count;
                for (int i = 0; i < count; i++)
                {
                    if (leafs[i].value.Equals(value))
                    {
                        leafs.RemoveAt(i);
                        ret = true;
                        break;
                    }
                }
            }

            return ret;
        }

        // // 注意，只是 递归 清理子枝干，不清理 当前枝干
        // private void _RecycleBranchDownLoop(Branch branch)
        // {
        //     // using (new ProfilerSample("QuadTree._RecycleBranchDownLoop()"))
        //     {
        //         for (int i = 0; i < 4; i++)
        //         {
        //             var sub_branch = branch.branches[i];
        //             if (sub_branch == null) continue;
        //
        //             _RecycleBranchDownLoop1(sub_branch);
        //         }
        //     }
        // }
        //
        // private void _RecycleBranchDownLoop1(Branch branch)
        // {
        //     if (branch == null) return;
        //     
        //     for (int i = 0; i < 4; i++)
        //     {
        //         _RecycleBranchDownLoop1(branch.branches[i]);
        //     }
        //     
        //     if (_BranchCanRecycle(branch))
        //     {
        //         _RecycleBranchToPool(branch);
        //     }
        // }
        //
        // // 注意这个会清理当前枝干 和 递归的父级 枝干
        // private void _RecycleBranchUpLoop(Branch branch)
        // {
        //     var cur_branch = branch;
        //         
        //     // using (new ProfilerSample("QuadTree._RecycleBranchUpLoop()"))
        //     {
        //         // 向上遍历
        //         while (cur_branch != null && cur_branch != root)
        //         {
        //             if (_BranchCanRecycle(cur_branch))
        //             {
        //                 // 移除前，一定要先取出 父级，不然被回收了，就无法向上遍历了
        //                 var recycle_branch = cur_branch;
        //                 cur_branch = cur_branch.parent;
        //                 
        //                 _RecycleBranchToPool(recycle_branch);
        //             }
        //             else
        //             {
        //                 break;
        //             }
        //         }
        //     }
        // }
        
        // // 回收无效的枝干链
        // private void _RecycleBranchChains(Branch branch)
        // {
        //     if (branch == root || branch == null)
        //         return;
        //     
        //     // if (_BranchCanRecycle(branch))
        //     // {
        //     //     // 如果本身这个节点可回收，直接 向上遍历
        //     //     _RecycleBranchUpLoop(branch);
        //     // }
        //     // else
        //     // {
        //     //     // 如果当前不可回收，先清理所有子枝干，并向下遍历
        //     //     _RecycleBranchDownLoop(branch);
        //     //     // 再向上遍历
        //     //     _RecycleBranchUpLoop(branch);
        //     // }
        //     
        //     // 如果当前不可回收，先清理所有子枝干，并向下遍历
        //     _RecycleBranchDownLoop(branch);
        //     // 再向上遍历
        //     _RecycleBranchUpLoop(branch);
        // }

        private static bool _BranchCanRecycle(Branch branch)
        {
            // using (new ProfilerSample("QuadTree._BranchCanRecycle"))
            {
                if (branch.hasSplit)
                {
                    // 如果分裂过
                    // 那就判断是否有子枝干实例
                    return !branch.AnySubBranchInst();
                }

                // 如果没有分裂过
                // 那就判断叶子对象数量是否为0
                return branch.leaves.Count == 0;
            }
        }

        // 去重
        private void _Distinct(List<T> list, HashSet<T> distinctHelper)
        {
            // using (new ProfilerSample("QuadTree._Distinct"))
            {
                distinctHelper.Clear();
                var t_pList = _listDataPool.FromPool();
                for (int i = 0; i < list.Count; i++)
                {
                    if (distinctHelper.Add(list[i]))
                    {
                        t_pList.Add(list[i]);
                    }
                }

                list.Clear();
                list.AddRange(t_pList);
                _listDataPool.ToPool(t_pList);
            }
        }

        private void _SelectByAABB(ref QTAABB aabb, List<T> ret, Branch branch)
        {
            // using (new ProfilerSample("QuadTree._SelectByAABB ref aabb"))
            {
                if (aabb.IsIntersect(ref branch.aabb))
                {
                    // 与部分的交集
                    for (int i = 0; i < branch.leaves.Count; i++)
                    {
                        // TODO : 这块后续可以再次优化
                        var leaf = branch.leaves[i];
                        if (aabb.IsIntersect(ref leaf.aabb))
                        {
                            ret.Add(leaf.value);
                        }
                    }

                    for (int i = 0; i < branch.branches.Length; i++)
                    {
                        if (branch.branches[i] == null) continue;
                        _SelectByAABB(ref aabb, ret, branch.branches[i]);
                    }
                }
            }
        }

        public string Dump()
        {
            var sb = new StringBuilder();

            sb.AppendLine($"name: {this.Name}");
            sb.AppendLine($"_maxLevel: {this._maxLevel}");
            sb.AppendLine($"_maxLeafPerBranch: {this._maxLeafPerBranch}");
            sb.AppendLine($"_counter_SelectByAABB: {this._counter_SelectByAABB}");
            sb.AppendLine("=== branches start ===");

            var branch = root;

            DumpBranchInfo(sb, branch);

            sb.AppendLine("=== branches end===");

            sb.AppendLine("=== callstack start ===");
            sb.AppendLine(Environment.StackTrace);
            sb.AppendLine("=== callstack end===");

            return sb.ToString();
        }

        private static void DumpBranchInfo(StringBuilder sb, Branch branch)
        {
            var indent = new string(' ', 4 * branch.depth);
            
            sb.AppendLine(branch.Dump(indent));
            
            if (branch.leaves.Count > 0) sb.AppendLine(branch.DumpLeaves(indent));

            for (int i = 0; i < branch.branches.Length; i++)
            {
                if (branch.branches[i] != null)
                {
                    DumpBranchInfo(sb, branch.branches[i]);
                }
            }
        }

        // private void _SelectAllValues(Branch branch, List<T> ret)
        // {
        //     if (branch == null)
        //     {
        //         return;
        //     }
        //
        //     // using (new ProfilerSample("QuadTree._SelectAllValues"))
        //     {
        //         for (int i = 0; i < branch.leaves.Count; i++)
        //         {
        //             ret.Add(branch.leaves[i].value);
        //         }
        //
        //         for (int i = 0; i < branch.branches.Length; i++)
        //         {
        //             _SelectAllValues(branch.branches[i], ret);
        //         }
        //     }
        // }

        private void _SelectByPos(ref FPVector2 pos, List<T> ret, Branch branch)
        {
            if (branch == null)
            {
                return;
            }

            // using (new ProfilerSample("QuadTree._SelectByPos"))
            {
                if (branch.aabb.Contains(ref pos))
                {
                    for (int i = 0; i < branch.leaves.Count; i++)
                    {
                        ret.Add(branch.leaves[i].value);
                    }

                    for (int i = 0; i < branch.branches.Length; i++)
                    {
                        _SelectByPos(ref pos, ret, branch.branches[i]);
                    }
                }
            }
        }

        private void _SelectByAABBS(List<QTAABB> aabbs, List<T> ret, Branch branch)
        {
            if (aabbs.Count == 0 || branch == null)
            {
                return;
            }

            // using (new ProfilerSample("QuadTree._SelectByAABBS"))
            {
                if (branch.aabb.AnyIntersect(aabbs))
                {
                    // using (new ProfilerSample("QuadTree._SelectByAABBS, add"))
                    {
                        for (int i = 0; i < branch.leaves.Count; i++)
                        {
                            if (branch.leaves[i].aabb.AnyIntersect(aabbs))
                            {
                                ret.Add(branch.leaves[i].value);
                            }
                        }
                    }

                    for (int i = 0; i < branch.branches.Length; i++)
                    {
                        _SelectByAABBS(aabbs, ret, branch.branches[i]);
                    }
                }
            }
        }

        private InsertRetType _Insert(Branch branch, Leaf<T> leaf)
        {
            // using (new ProfilerSample("QuadTree._Insert 1"))
            {
                if (!branch.aabb.IsIntersect(ref leaf.aabb))
                {
                    return InsertRetType.Failure;
                }
            }

            InsertRetType ret = InsertRetType.Failure;

            // using (new ProfilerSample("QuadTree._Insert 2"))
            {
                // 如果有分裂过，只能当作 枝干用了
                if (branch.hasSplit)
                {
                    // using (new ProfilerSample("QuadTree._Insert 3"))
                    {
                        // 尝试插入到底部的 子枝干
                        for (int i = 0; i < branch.branches.Length; i++)
                        {
                            //if (branch.aabbs[i].IsIntersect(ref leaf.aabb))
                            {
                                // 因为 中途 枝干 可能会随机被回收掉
                                // 所以这里需要 重新那新的枝干
                                var subBranch = branch.branches[i];
                                if (subBranch == null)
                                {
                                    subBranch = _GetBranchFromPool(branch, branch.depth + 1, ref branch.aabbs[i], i);
                                    branch.branches[i] = subBranch;
                                }

                                // 递归插入到 子枝干
                                var temp_ret = _Insert(subBranch, leaf);
                                if (temp_ret == InsertRetType.Success)
                                    ret = InsertRetType.Success;
                            }
                        }
                    }
                }
                else
                {
                    // if (branch.depth <= _maxLevel && branch.leaves.Count >= _maxLeafPerBranch)
                    if (branch.depth < _maxLevel && branch.leaves.Count > _maxLeafPerBranch)
                    {
                        // using (new ProfilerSample("QuadTree._Insert 4"))
                        {
                            // [已达] 最大深度限制，已超过对应的数量，那么再次细分该枝干

                            // 1. 先分裂枝干
                            _SplitBranch(branch);

                            // 2. 将叶子 重新 递归 插入
                            if (_Insert(branch, leaf) == InsertRetType.Success)
                            {
                                ret = InsertRetType.Success;
                            }
                        }
                    }
                    else
                    {
                        // using (new ProfilerSample("QuadTree._Insert 5"))
                        {
                            // [未达] 最大深度限制，未超过对应的数量，那么插入该枝干
                            branch.leaves.Add(leaf);

                            if (!_obj2BelongBranchIDsDict.TryGetValue(leaf.value, out var belongBranchIDList))
                            {
                                belongBranchIDList = _listLeafPool.FromPool();
                                _obj2BelongBranchIDsDict[leaf.value] = belongBranchIDList;
                            }

                            belongBranchIDList.Add(branch.instanceID);

                            ret = InsertRetType.Success;
                        }
                    }
                }
            }

            return ret;
        }

        private void _SplitBranch(Branch branch)
        {
            // using (new ProfilerSample("QuadTree._SplitBranch"))
            {
                // 标记已经分裂
                branch.hasSplit = true;

                // 将叶子插入到子枝干
                for (int leafIDX = 0; leafIDX < branch.leaves.Count; leafIDX++)
                {
                    // 所以只有这里才会处理 多象限的情况
                    var leaf = branch.leaves[leafIDX];

                    // 先清理之前的 数据绑定的 叶子节点信息
                    if (_obj2BelongBranchIDsDict.TryGetValue(leaf.value, out var branchInstIDList))
                    {
                        if (branchInstIDList.Remove(branch.instanceID))
                        {
                            // 从原来的 包裹数据对象的枝干ID记录删除，因为下面要重新插入
                            // nops
                        }
                        else
                        {
                            Debug.LogError($"叶子对象 {leaf.value} 的从属的枝干列表信息中，没有找到对应的 源枝干ID: {branch.instanceID}");
                        }
                    }
                    else
                    {
                        Debug.LogError($"没有查找到 {leaf.value} 从属的枝干列表信息");
                    }

                    // 重新插入到 子枝干
                    for (int subBranchIDX = 0; subBranchIDX < branch.branches.Length; subBranchIDX++)
                    {
                        var subBranch = branch.branches[subBranchIDX];
                        if (subBranch == null)
                        {
                            subBranch = _GetBranchFromPool(branch, branch.depth + 1, ref branch.aabbs[subBranchIDX], subBranchIDX);
                            branch.branches[subBranchIDX] = subBranch;
                        }
                        _Insert(subBranch, leaf);
                    }
                }

                // 清理原本枝干叶子
                branch.leaves.Clear();
            }
        }

        private Branch _GetBranchFromPool(Branch parent, int depth, ref QTAABB aabb, int idxOfParent)
        {
            // using (new ProfilerSample("QuadTree._GetBranchFromPool()"))
            {
                Branch ret;
                if (_branchPool.Count > 0)
                {
                    ret = _branchPool.Pop();
                }
                else
                {
                    ret = new Branch();
                    ret.instanceID = ++_branchInstanceCounter;
                }

                ret.parent = parent;
                ret.idxOfParent = idxOfParent;
                ret.depth = depth;
                ret.aabb = aabb;
                Fix64 halfW = aabb.w * QTAABB.FIX64_DOT5;
                Fix64 halfH = aabb.h * QTAABB.FIX64_DOT5;
                Fix64 midX = aabb.x + halfW;
                Fix64 midY = aabb.y + halfH;
                ret.aabbs[0].Set(aabb.x, midY, halfW, halfH); // top-left
                ret.aabbs[1].Set(midX, midY, halfW, halfH); // top-right
                ret.aabbs[2].Set(midX, aabb.y, halfW, halfH); // bottom-right
                ret.aabbs[3].Set(aabb.x, aabb.y, halfW, halfH); // bottom-left
                _branchID2BranchObjDict[ret.instanceID] = ret;
                return ret;
            }
        }

        private void _RecycleBranchToPool(Branch branch)
        {
            // using (new ProfilerSample("QuadTree._RecycleBranchToPool()"))
            {
                if (_branchID2BranchObjDict.Remove(branch.instanceID))
                {
                    // 向下清理
                    for (int i = 0; i < branch.branches.Length; i++)
                    {
                        var subBranch = branch.branches[i];
                        if (subBranch == null) continue;
                        _RecycleBranchToPool(subBranch);
                    }

                    // 清理从属父级
                    if (branch.idxOfParent != -1)
                    {
                        branch.parent.branches[branch.idxOfParent] = null;
                        branch.idxOfParent = -1;
                    }

                    branch.parent = null;
                    branch.hasSplit = false;

                    branch.leaves.Clear();

                    _branchPool.Push(branch);
                }
            }
        }

        private void _Reset(Fix64 x, Fix64 y, Fix64 w, Fix64 h,
            int maxLevel = DEFAULT_MAX_LEVEL, int maxLeafPerBranch = DEFAULT_MAX_LEAF_PER_BRANCH)
        {
            if (w == 0 || h == 0)
                Debug.LogError("QTAABB is Zero");
            if (maxLevel > MAX_LIMIT_LEVEL)
                Debug.LogError($"QuadTree MaxLevel cannot more than : {MAX_LIMIT_LEVEL}");

            // using (new ProfilerSample("QuadTree._Reset()"))
            {
                this._maxLevel = maxLevel;
                this._maxLeafPerBranch = maxLeafPerBranch;

                var aabb = new QTAABB { x = x, y = y, w = w, h = h };
                if (root != null)
                {
                    root.aabb = aabb;
                }
                else
                {
                    root = _GetBranchFromPool(null, 0, ref aabb, -1);
                }
            }
        }
    }
}