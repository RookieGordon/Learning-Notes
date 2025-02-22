using System.Collections.Generic;
using FPLibrary;
using UnityEngine;

namespace SAS.QuadTree
{
    /// <summary>
    /// QuadTree 使用的 AABB Utils
    /// date    : 2021/02/18
    /// author  : jave.lin
    /// </summary>
    public static class QTUtils
    {
        /// <summary>
        /// 获取 cam frustum 的 aabb 的垂直方向的 分层级别，默认是 3 个级别
        /// </summary>
        public const int DEFAULT_GET_CAM_FRUSTUM_TO_AABB_LEVEL = 3;

        /// <summary>
        /// 获取 cam frustum 的 aabb 的水平方向的 padding，默认是 unity 的 0 个 units 的大小
        /// </summary>
        public const float DEFAULT_GET_CAM_FRUSTUM_AABB_H_PADDING = 0;

        private static readonly ListPool<QTAABB> _s_CamAABBsListPool = new ListPool<QTAABB>();

        /// <summary>
        /// 获取 Camera 分层 level 的多个 aabb，如果 Camera 是一个正交投影，那么会无视 level 数值，直接返回一个 aabb
        /// </summary>
        /// <param name="cam">要获取多个 aabb 的 Camera</param>
        /// <param name="ret">结果</param>
        /// <param name="level">将 frustum 分解的层级数量</param>
        /// <param name="h_padding">添加水平边界间隔</param>
        public static void GetCameraAABBs(Camera cam, List<QTAABB> ret,
            int level = DEFAULT_GET_CAM_FRUSTUM_TO_AABB_LEVEL, float h_padding = DEFAULT_GET_CAM_FRUSTUM_AABB_H_PADDING)
        {
            ret.Clear();
            if (cam.orthographic)
            {
                var aabb = new QTAABB();
                GetOrthorCameraAABB(cam, ref aabb, h_padding);
                ret.Add(aabb);
            }
            else
            {
                GetFrustumCameraAABBs(cam, ret, level, h_padding);
            }
        }
        /// <summary>
        /// 此方法不能用于战斗逻辑层计算
        /// </summary>
        /// <param name="cam"></param>
        /// <param name="aabb"></param>
        /// <param name="h_padding"></param>
        public static void GetOrthorCameraAABB(Camera cam, ref QTAABB aabb,
            float h_padding = DEFAULT_GET_CAM_FRUSTUM_AABB_H_PADDING)
        {
            System.Diagnostics.Debug.Assert(cam.orthographic == true);
            var far = cam.farClipPlane;
            var near = cam.nearClipPlane;
            var delta_fn = far - near;
            var half_height = cam.orthographicSize;
            var half_with = cam.aspect * half_height;
            var forward = cam.transform.forward;
            var right = cam.transform.right;
            var up = cam.transform.up;
            var start_pos = cam.transform.position + forward * near;
            var top_left = start_pos + forward * delta_fn + (-right * half_with) + (up * half_height);
            var top_right = top_left + (right * (2 * half_with));
            var bottom_right = top_right + (-up * (2 * half_height));
            var bottom_left = bottom_right + (-right * (2 * half_with));

            var h_padding_vec = right * h_padding;

            top_left -= h_padding_vec;
            top_right += h_padding_vec;
            bottom_right += h_padding_vec;
            bottom_left -= h_padding_vec;

            // 重置
            aabb.w = aabb.h = 0;
            aabb.x = FPExtensional.FloatToFix64(start_pos.x);
            aabb.y = FPExtensional.FloatToFix64(start_pos.z);

            // 并集其他点
            aabb.Union(ref top_left);
            aabb.Union(ref top_right);
            aabb.Union(ref bottom_right);
            aabb.Union(ref bottom_left);
        }
        /// <summary>
        /// 此方法不能用于战斗逻辑层
        /// </summary>
        /// <param name="cam"></param>
        /// <param name="aabbs"></param>
        /// <param name="level"></param>
        /// <param name="h_padding"></param>
        public static void GetFrustumCameraAABBs(Camera cam, List<QTAABB> aabbs,
            int level = DEFAULT_GET_CAM_FRUSTUM_TO_AABB_LEVEL, float h_padding = DEFAULT_GET_CAM_FRUSTUM_AABB_H_PADDING)
        {
            // 计算椎体分段包围盒
            System.Diagnostics.Debug.Assert(cam.orthographic == false);
            System.Diagnostics.Debug.Assert(level > 0);
            // 相机的 frustum 如果构建，可以参考我以前的一篇文章：https://blog.csdn.net/linjf520/article/details/104761121#OnRenderImage_98
            var far = cam.farClipPlane;
            var near = cam.nearClipPlane;
            var tan = Mathf.Tan(cam.fieldOfView * 0.5f * Mathf.Deg2Rad);
            var far_plane_half_height = tan * far;
            var far_plane_half_with = cam.aspect * far_plane_half_height;
            var near_plane_half_height = tan * near;
            var near_plane_half_with = cam.aspect * near_plane_half_height;

            var forward = cam.transform.forward;
            var right = cam.transform.right;
            var up = cam.transform.up;

            var far_top_left = cam.transform.position + forward * far + (-right * far_plane_half_with) +
                               (up * far_plane_half_height);
            var far_top_right = far_top_left + (right * (2 * far_plane_half_with));
            var far_bottom_right = far_top_right + (-up * (2 * far_plane_half_height));
            var far_bottom_left = far_bottom_right + (-right * (2 * far_plane_half_with));

            var near_top_left = cam.transform.position + forward * near + (-right * near_plane_half_with) +
                                (up * near_plane_half_height);
            var near_top_right = near_top_left + (right * (2 * near_plane_half_with));
            var near_bottom_right = near_top_right + (-up * (2 * near_plane_half_height));
            var near_bottom_left = near_bottom_right + (-right * (2 * near_plane_half_with));

            var n2f_top_left_vec = far_top_left - near_top_left;
            var n2f_top_right_vec = far_top_right - near_top_right;
            var n2f_bottom_right_vec = far_bottom_right - near_bottom_right;
            var n2f_bottom_left_vec = far_bottom_left - near_bottom_left;

            var h_padding_vec = right * h_padding;

            for (int i = 0; i < level; i++)
            {
                var rate_start = (float)i / level;
                var rate_end = (float)(i + 1) / level;

                // near plane 四个角点
                var top_left_start = near_top_left + n2f_top_left_vec * rate_start;
                var top_right_start = near_top_right + n2f_top_right_vec * rate_start;
                var bottom_right_start = near_bottom_right + n2f_bottom_right_vec * rate_start;
                var bottom_left_start = near_bottom_left + n2f_bottom_left_vec * rate_start;

                // 水平 padding
                top_left_start -= h_padding_vec;
                top_right_start += h_padding_vec;
                bottom_right_start += h_padding_vec;
                bottom_left_start -= h_padding_vec;

                // far plane 四个角点
                var top_left_end = near_top_left + n2f_top_left_vec * rate_end;
                var top_right_end = near_top_right + n2f_top_right_vec * rate_end;
                var bottom_right_end = near_bottom_right + n2f_bottom_right_vec * rate_end;
                var bottom_left_end = near_bottom_left + n2f_bottom_left_vec * rate_end;

                // 水平 padding
                top_left_end -= h_padding_vec;
                top_right_end += h_padding_vec;
                bottom_right_end += h_padding_vec;
                bottom_left_end -= h_padding_vec;

                var aabb = new QTAABB();
                aabb.Set(FPExtensional.FloatToFix64(top_left_start.x), FPExtensional.FloatToFix64(top_left_start.z), 0, 0);

                // 并集其他点
                aabb.Union(ref top_left_start);
                aabb.Union(ref top_right_start);
                aabb.Union(ref bottom_right_start);
                aabb.Union(ref bottom_left_start);
                aabb.Union(ref top_left_end);
                aabb.Union(ref top_right_end);
                aabb.Union(ref bottom_right_end);
                aabb.Union(ref bottom_left_end);
                aabbs.Add(aabb);
            }
        }

#if UNITY_EDITOR
        public static void DrawCameraAABB(
            Camera cam,
            int frustum_AABB_level,
            float frustum_h_padding,
            Color cam_aabb_color)
        {
            var cam_aabbs_list = _s_CamAABBsListPool.FromPool();
            QTUtils.GetCameraAABBs(cam, cam_aabbs_list, frustum_AABB_level, frustum_h_padding);
            foreach (var aabb in cam_aabbs_list)
            {
                DrawQTAABB(aabb, cam_aabb_color);
            }
            _s_CamAABBsListPool.ToPool(cam_aabbs_list);
        }
        
        public static void DrawQTAABB(QTAABB aabb, Color color)
        {
            var src_col = Gizmos.color;
            Gizmos.color = color;

            var min = aabb.min;
            var max = aabb.max;

            var start_pos = min.AsUnityVector3XZ();
            var end_pos = start_pos;
            end_pos.x = max.x.AsFloat();

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.z = max.y.AsFloat();

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.x = min.x.AsFloat();

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.z = min.y.AsFloat();

            Gizmos.DrawLine(start_pos, end_pos);
            
            Gizmos.color = src_col;
        }
        
        public static void DrawCameraWireframe(Camera cam, Color cam_frustum_color)
        {
            var src_col = Gizmos.color;
            Gizmos.color = cam_frustum_color;

            // 可参考我以前的一篇文章：https://blog.csdn.net/linjf520/article/details/104994304#SceneGizmos_35
            Matrix4x4 temp = Gizmos.matrix;
            Gizmos.matrix = Matrix4x4.TRS(cam.transform.position, cam.transform.rotation, Vector3.one);
            if (!cam.orthographic)
            {
                // 透视视锥
                Gizmos.DrawFrustum(Vector3.zero, cam.fieldOfView, cam.farClipPlane, cam.nearClipPlane, cam.aspect);
            }
            else
            {
                // 正交 cube
                var far = cam.farClipPlane;
                var near = cam.nearClipPlane;
                var delta_fn = far - near;

                var half_height = cam.orthographicSize;
                var half_with = cam.aspect * half_height;
                var pos = Vector3.forward * (delta_fn * 0.5f + near);
                var size = new Vector3(half_with * 2, half_height * 2, delta_fn);

                Gizmos.DrawWireCube(pos, size);
            }
            Gizmos.matrix = temp;
            Gizmos.color = src_col;
        }
        
        public static void DrawBranch(QuadTree<GameObject>.Branch branch, Color color)
        {
            if (branch == null)
            {
                return;
            }

            // draw this branch
            QTUtils.DrawQTAABB(branch.aabb, color);

            // draw sub branches
            foreach (var b in branch.branches)
            {
                DrawBranch(b, color);
            }
        }
        
        public static void DrawLeafsOfBrances(QuadTree<GameObject>.Branch branch, Color color)
        {
            if (branch == null)
            {
                return;
            }
            foreach (var b in branch.branches)
            {
                if (b == null)
                {
                    continue;
                }
                foreach (var l in b.leaves)
                {
                    QTUtils.DrawQTAABB(l.aabb, color);
                }
                DrawLeafsOfBrances(b, color);
            }
        }
        
        public static void DrawBoundsXZ(Bounds bounds, Color color)
        {
            var src_col = Gizmos.color;
            Gizmos.color = color;

            var min = bounds.min;
            var max = bounds.max;

            var start_pos = min;
            var end_pos = min;
            end_pos.x = max.x;

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.z = max.z;

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.x = min.x;

            Gizmos.DrawLine(start_pos, end_pos);

            start_pos = end_pos;
            end_pos = start_pos;
            end_pos.z = min.z;

            Gizmos.DrawLine(start_pos, end_pos);
            Gizmos.color = src_col;
        }

        public static void DrawSelected(List<GameObject> qt_select_ret_helper, Color qt_leaves_in_frustum_color)
        {
            if (qt_select_ret_helper != null)
            {
                foreach (var go in qt_select_ret_helper)
                {
                    var renderer = go.GetComponent<Renderer>();
                    QTUtils.DrawBoundsXZ(renderer.bounds, qt_leaves_in_frustum_color);
                }
            }
        }
        
        #endif
    }
}