---
link: https://blog.csdn.net/weixin_52029211/article/details/123598667?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522171755804616800211572349%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fblog.%2522%257D&request_id=171755804616800211572349&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~rank_v31_ecpm-3-123598667-null-null.nonecase&utm_term=A%E6%98%9F
byline: 成就一亿技术人!
excerpt: 文章浏览阅读8.4k次，点赞18次，收藏124次。将从以下5个点进行改进：1、启发函数——曼哈顿距离等2、权重系数——动态加权等3、搜索邻域——基于8邻域搜索改进4、搜索策略——双向搜索、JPS策略等5、路径平滑处理——贝塞尔曲线、B样条曲线等权重系数改进..._a星算法改进
tags:
  - slurp/a星算法改进
slurped: 2024-06-05T03:27:40.900Z
title: A星算法优化（二）权重系数_a星算法改进-CSDN博客
---

本文接上一篇：[A星算法优化（一）启发函数](https://blog.csdn.net/weixin_52029211/article/details/123412402)  
B站详解视频：[https://www.bilibili.com/video/BV1EF411W7Rw?spm_id_from=333.999.0.0](https://www.bilibili.com/video/BV1EF411W7Rw?spm_id_from=333.999.0.0)  
**将从以下5个点进行改进：**  
1、启发函数——曼哈顿距离等  
2、权重系数——动态加权等  
3、搜索邻域——基于8邻域搜索改进  
4、搜索策略——双向搜索、JPS策略等  
5、路径平滑处理——贝塞尔曲线、B样条曲线等

### 权重系数改进

#### 1、改进效果

以欧式距离为例  
改进后的A星：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/909591ff9c9d4c62bec446589c5f4560.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)  
未改进的A星:

![在这里插入图片描述](https://img-blog.csdnimg.cn/a8d34a10db8c4338b6ab7896f38d084d.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_13,color_FFFFFF,t_70,g_se,x_16)  
在保留规划出较优路径的前提下，搜索节点减少、搜索速度大大提升

主要对估价函数f(n)=g(n)+h(n)进行改进，上一节是对启发函数h(n)进行改进，这次是对公式整体进行改进，阅读大量论文，总结常见的改进方式如下：

#### 2、f(n)=g(n)+w(n)*h(n)

**理论：**  
在h(n)前增加一个权重系数w(n)，即weight(n)，g(n)与h(n)原本是1：1的权重分配，假如w(n)=2，权重分配变为1：2，这样对规划效果带来的影响是相比实际代价g(n)会更偏向用估计代价h(n)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/84ea9b832da14fd2a97a4a59262d01d6.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_20,color_FFFFFF,t_70,g_se,x_16) 权重系数w较大，此时A_算法会尽快向终点扩展，搜索速度很快但会错过最优路径；当w较小，此时A_算法会倾向于搜索最优路径而减慢搜索速度。

**代码实现：**

```
w = 2.0
d = math.hypot(n1.x - n2.x, n1.y - n2.y)          #  Euclidean
print(d)
h = w * d
return h
```

观察改进效果

#### 3、动态加权

我们不可能只考虑搜索速度而不考虑规划的路径，也就是不可能一直让w=2，此时就考虑使用动态加权的方式，以原本的启发函数h(n)为判断依据，我们把它声明为d，当d>18时，w=3.0，此时算法搜索速度更快；当d<=18时，w=0.8，也就是接近终点的时候，优先考虑最优路径。

**动态加权：** 在放弃搜索最优路径的情况下，使用动态加权来缩短A星搜索的时间。其原则为，在搜索开始时，快速到达目的地所在区域更重要；在搜索结束时，得到到达目标的最佳路径更重要

当h较大时，权重系数w也应该较大，此时A_算法会尽快向终点扩展，搜索速度很快但会错过最优路径；当h较小时，w也应该较小，此时A_算法会倾向于搜索最优路径而减慢搜索速度。

此时代码变为：

```
if d > 18:
    w = 3.0
else: w = 0.8
h = w * d
```

其中w与d的值要根据自己设定地图的大小、复杂程度进行多次调节，也可以按实际情况设置多段加权

本文仅提供简单的改进思路，更复杂更优的改进思路建议自己阅读论文。

参考：[https://joveh-h.blog.csdn.net/article/details/100081677?spm=1001.2014.3001.5506](https://joveh-h.blog.csdn.net/article/details/100081677?spm=1001.2014.3001.5506)  
论文《一种面向非结构化环境的改进跳点搜索路径规划算法》