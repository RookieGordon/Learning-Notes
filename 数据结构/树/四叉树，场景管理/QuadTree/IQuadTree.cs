/*
 * author       : jave.lin
 * datetime     : 2024/9/14 16:09:33
 * description  : 四叉树 接口
 * */

using System;
using System.Collections.Generic;
using FPLibrary;

namespace SAS.QuadTree
{
    public interface IQuadTree<T> : IDisposable
    {
        /// <summary>
        /// 四叉树名字
        /// </summary>
        string Name { get; set; }
        /// <summary>
        /// 根据 对象、对象AABB 插入 到四叉树
        /// </summary>
        /// <param name="p_obj">对应的叶子节点包裹的数据对象</param>
        /// <param name="aabb">对应叶子节点的AABB</param>
        /// <returns>返回插入枚举结果</returns>
        InsertRetType Insert(T p_obj, QTAABB aabb);
        /// <summary>
        /// 根据提供的 叶子数据对象，从 四叉树删除
        /// </summary>
        /// <param name="leaf">叶子数据对象</param>
        /// <returns>如果四叉树触发了删除，返回true，否则返回false</returns>
        bool Remove(T p_obj);
        /// <summary>
        /// 清空 四叉树 所有枝干叶子
        /// </summary>
        void Clear();
        /// <summary>
        /// 删除空枝干
        /// </summary>
        void RemoveEmptys();
        /// <summary>
        /// 根据 坐标点 查找 叶子对象内容的数据对象集合
        /// </summary>
        /// <param name="pos">坐标点</param>
        /// <param name="ret">用于接受数据集合的List</param>
        void Select(FPVector2 pos, List<T> ret);
        /// <summary>
        /// 根据 AABB 查找 叶子对象内容的数据对象集合
        /// </summary>
        /// <param name="aabb">AABB</param>
        /// <param name="ret">用于接受数据集合的List</param>
        void Select(QTAABB aabb, List<T> ret);
        /// <summary>
        /// 根据 AABBs 查找 叶子对象内容的数据对象集合
        /// </summary>
        /// <param name="aabbs">AABBs</param>
        /// <param name="ret">用于接受数据集合的List</param>
        void Select(List<QTAABB> aabbs, List<T> ret);
        /// <summary>
        /// 返回QT结构描述数据
        /// </summary>
        /// <returns></returns>
        string Dump();
    }
}