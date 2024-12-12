// jave.lin 2024/09/16
// 转为 定点数 版本

using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using FPLibrary;
using UnityEngine;

namespace SAS.QuadTree
{
    /// <summary>
    /// QuadTree 使用的 AABB（后续完善其实可以尝试支持 OOB）
    /// date    : 2021/02/18
    /// author  : jave.lin
    /// </summary>
    [Serializable]
    public struct QTAABB : IEquatable<QTAABB>
    {
        public static readonly QTAABB Zero = new QTAABB();
        public static readonly Fix64 FIX64_DOT5 = new Fix64(500) / new Fix64(1000);

        public Fix64 x;
        public Fix64 y;
        public Fix64 w;
        public Fix64 h;

        public Fix64 left
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => x;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => x = value;
        }

        public Fix64 top
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => y + h;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => h = value - y;
        }

        public Fix64 right
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => x + w;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => w = value - x;
        }

        public Fix64 bottom
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => y;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => y = value;
        }

        public Fix64 centerX
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => x + w * FIX64_DOT5;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => x = value - (w * FIX64_DOT5);
        }

        public Fix64 centerY
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => y + h * FIX64_DOT5;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => y = value - (h * FIX64_DOT5);
        }

        public FPVector2 center
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(centerX, centerY);
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set
            {
                centerX = value.x;
                centerY = value.y;
            }
        }

        public Fix64 extentX
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => w * FIX64_DOT5;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => w = value * 2;
        }

        public Fix64 extentY
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => y * FIX64_DOT5;
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set => h = value * 2;
        }

        public FPVector2 extent
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(extentX, extentY);
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set
            {
                extentX = value.x;
                extentY = value.y;
            }
        }

        public FPVector2 min
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(left, bottom);
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set
            {
                left = value.x;
                bottom = value.y;
            }
        }

        public FPVector2 max
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(right, top);
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            set
            {
                right = value.x;
                top = value.y;
            }
        }

        public FPVector2 top_left
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(left, top);
        }

        public FPVector2 top_right
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(right, top);
        }

        public FPVector2 bottom_left
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(left, bottom);
        }

        public FPVector2 bottom_right
        {
            [MethodImpl(MethodImplOptions.AggressiveInlining)]
            get => new FPVector2(right, bottom);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool IsZero()
        {
            return left == right || top == bottom;
        }

        public void Set(Fix64 x, Fix64 y, Fix64 w, Fix64 h)
        {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }

        /// <summary>
        /// 当前 AABB 与 other 的 AABB 是否有交集，并返回交集的 AABB
        /// </summary>
        /// <param name="other">其他的 AABB</param>
        /// <param name="outAABB">返回交集的 AABB</param>
        /// <returns>如果当前 AABB 与 other 的 AABB 是否有交集，则返回 true</returns>
        public bool IsIntersect(ref QTAABB other, out QTAABB outAABB)
        {
            // 计算交集边界
            Fix64 intersectLeft = FPMath.Max(left, other.left);
            Fix64 intersectRight = FPMath.Min(right, other.right);
            Fix64 intersectBottom = FPMath.Max(bottom, other.bottom);
            Fix64 intersectTop = FPMath.Min(top, other.top);

            // 如果边界有效，说明有交集
            if (intersectLeft < intersectRight && intersectBottom < intersectTop)
            {
                outAABB = new QTAABB
                {
                    x = intersectLeft,
                    y = intersectBottom,
                    w = intersectRight - intersectLeft,
                    h = intersectTop - intersectBottom
                };
                return true;
            }

            // 如果没有交集
            outAABB = QTAABB.Zero;
            return false;
        }

        /// <summary>
        /// 当前 AABB 与 other 的 AABB 是否有交集
        /// </summary>
        /// <param name="other">其他的 AABB</param>
        /// <returns>如果当前 AABB 与 other 的 AABB 是否有交集，则返回 true</returns>
        public bool IsIntersect(ref QTAABB other)
        {
            // 检查是否没有交集
            // return !(other.left >= right || other.right <= left || other.bottom >= top || other.top <= bottom);
            return !(other.left > right || other.right < left || other.bottom > top || other.top < bottom);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool IsIntersect(QTAABB other)
        {
            return IsIntersect(ref other);
        }

        /// <summary>
        /// 是否完整包含另一个 AABB（做优化用，一般如果整个 AABB 都被另一个 AABB 包含就不用精确检测了）
        /// </summary>
        /// <param name="other">另一个 AABB</param>
        /// <returns>如果完整包含另一个 AABB，则返回 true</returns>
        public bool Contains(ref QTAABB other)
        {
            return
                // other.x >= this.x
                // && other.right <= this.right
                // && other.y >= this.y
                // && other.top <= this.top;
                other.x > this.x
                && other.right < this.right
                && other.y > this.y
                && other.top < this.top;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool Contains(QTAABB other)
        {
            return Contains(ref other);
        }

        /// <summary>
        /// 是否包含一个 2D 点
        /// </summary>
        /// <param name="x">2D 点 x</param>
        /// <param name="y">2D 点 x</param>
        /// <returns>如果包含 2D 点，则返回 true</returns>
        public bool Contains(Fix64 x, Fix64 y)
        {
            return 
                // x >= left 
                // && x <= right 
                // && y <= top 
                // && y >= bottom;
                x > left 
                && x < right 
                && y < top 
                && y > bottom;
        }

        /// <summary>
        /// 是否包含一个 2D 点
        /// </summary>
        /// <param name="pos">2D 点</param>
        /// <returns>如果包含 2D 点，则返回 true</returns>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool Contains(FPVector2 pos)
        {
            return Contains(ref pos);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public bool Contains(ref FPVector2 pos)
        {
            return Contains(pos.x, pos.y);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Union(QTAABB aabb)
        {
            Union(ref aabb);
        }

        /// <summary>
        /// 并集一个 AABB
        /// </summary>
        /// <param name="aabb">需要与之并集的 AABB</param>
        public void Union(ref QTAABB aabb)
        {
            Union(aabb.min);
            Union(aabb.max);
        }

        /// <summary>
        /// 并集一个 点
        /// </summary>
        /// <param name="pos"></param>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Union(FPVector2 pos)
        {
            Union(ref pos);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Union(ref FPVector2 pos)
        {
            Union(pos.x, pos.y);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Union(Vector3 pos)
        {
            Union(ref pos);
        }

        /// <summary>
        /// 此方法不能用于战斗逻辑层
        /// </summary>
        /// <param name="pos"></param>
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public void Union(ref Vector3 pos)
        {
            Union(FPExtensional.FloatToFix64(pos.x), FPExtensional.FloatToFix64(pos.z));
        }

        public void Union(Fix64 _x, Fix64 _z)
        {
            var src_min = min;
            var src_max = max;

            min = new FPVector2(
                FPMath.Min(_x, src_min.x),
                FPMath.Min(_z, src_min.y));
            
            max = new FPVector2(
                FPMath.Max(_x, src_max.x),
                FPMath.Max(_z, src_max.y));
        }

        /// <summary>
        /// 与多个 aabbs 是否有任意的并集
        /// </summary>
        /// <param name="aabbs">多个 aabbs</param>
        /// <returns>如果有任意的并集，返回 true</returns>
        public bool AnyIntersect(List<QTAABB> aabbs)
        {
            foreach (var aabb in aabbs)
            {
                if (IsIntersect(aabb))
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// 是否被 多个 aabbs 中的其中一个全包含
        /// </summary>
        /// <param name="aabbs">多个 aabbs</param>
        /// <returns>如果被其中一个全包含，返回 true</returns>
        public bool AnyContainsBy(List<QTAABB> aabbs)
        {
            foreach (var aabb in aabbs)
            {
                if (aabb.Contains(this))
                {
                    return true;
                }
            }

            return false;
        }

        public bool Equals(QTAABB other)
        {
            return x == other.x && y == other.y && w == other.w && h == other.h;
        }

        /// <summary>
        /// jave.lin : 让x,y为最小值，right,bottom 为最大值
        /// 因为部分 w, h 可以为负数，那么再部分计算就不太方便，所以可以统一转换成 x,y < w,h 的格式
        /// 比如, 原来是 {x:0,y:0,w:-1,h:-1}, Positive 后将会变成 {x:-1,y:-1,w:1,w:1}
        /// </summary>
        public void Positive()
        {
            var src_min = min;
            var src_max = max;

            x = FPMath.Min(src_min.x, src_max.x);
            y = FPMath.Min(src_min.y, src_max.y);
            w = FPMath.Abs(w);
            h = FPMath.Abs(h);
        }

        /// <summary>
        /// Unity 的 Bounds 隐式转为 我们自己定义的 QTAABB 便于外部书写,此方法不能用于战斗逻辑层计算
        /// </summary>
        /// <param name="v">Unity 的 Bounds</param>
        public static implicit operator QTAABB(Bounds v)
        {
            var b_min = v.min;
            var b_max = v.max;
            return new QTAABB
            {
                min = new FPVector2(FPExtensional.FloatToFix64(b_min.x), FPExtensional.FloatToFix64(b_min.z)),
                max = new FPVector2(FPExtensional.FloatToFix64(b_max.x), FPExtensional.FloatToFix64(b_max.z)),
            };
        }

        /// <summary>
        /// 便于 VS 中断点调式的简要显示 title 信息
        /// </summary>
        /// <returns>返回：便于 VS 中断点调式的简要显示 title 信息</returns>
        public override string ToString()
        {
            return base.ToString() + $", x:{x.AsFloat()}, y:{y.AsFloat()}, w:{w.AsFloat()}, h:{h.AsFloat()}, right:{right.AsFloat()}, bottom:{bottom.AsFloat()}";
        }
    }
}