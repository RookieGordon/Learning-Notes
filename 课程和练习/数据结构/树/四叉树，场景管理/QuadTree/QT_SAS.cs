/*
 * author       : jave.lin
 * datetime     : 2024/9/14 16:07:52
 * description  : 四叉树 空间加速
 * */

using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using FPLibrary;

namespace SAS.QuadTree
{
    public class QT_SAS<T> : IDisposable
    {
        // 四叉树
        public IQuadTree<T> qt
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get; 
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            private set;
        }

        // 获取 跟枝干，外部目前用于 unity_editor 下的 gizmos 绘制
        public QuadTree<T>.Branch root
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get; 
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            private set;
        }

        // 获取 或 设置名字
        public string Name
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => qt.Name;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => qt.Name = value;
        }
        
        public QT_SAS(QTAABB aabb, int maxLevel = 6, int maxLeafPerBrach = 16)
        {
            // jave.lin : qt1
            var qt1 = new QuadTree<T>(aabb, maxLevel, maxLeafPerBrach);
            
            // jave.lin : qt2
            // qt = ...;

            qt = qt1;
            root = qt1.root;
        }
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public InsertRetType Insert(T obj, QTAABB aabb)
        {
            return qt.Insert(obj, aabb);
        }
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool Remove(T obj)
        {
            return qt.Remove(obj);
        }
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public InsertRetType Replace(T obj, QTAABB aabb)
        {
            // 先删除旧的
            Remove(obj);
            // 再重新插入
            return Insert(obj, aabb);
        }
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Select(QTAABB aabb, List<T> ret)
        {
            qt.Select(aabb, ret);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Select(FPVector2 pos, List<T> ret)
        {
            qt.Select(pos, ret);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Select(List<QTAABB> aabbs, List<T> ret)
        {
            qt.Select(aabbs, ret);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Clear()
        {
            qt.Clear();
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void RemoveEmptys()
        {
            qt.RemoveEmptys();
        }

        public void Dispose()
        {
            if (qt != null)
            {
                qt.Dispose();
                qt = null;
            }
        }
    }
}