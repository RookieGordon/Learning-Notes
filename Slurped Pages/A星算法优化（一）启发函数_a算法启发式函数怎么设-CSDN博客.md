---
link: https://blog.csdn.net/weixin_52029211/article/details/123412402
byline: 成就一亿技术人!
excerpt: 文章浏览阅读1.8w次，点赞41次，收藏257次。笔者将从以下5个点进行改进：1、启发函数——曼哈顿距离等2、权重系数——动态加权等3、搜索邻域——基于8邻域搜索改进4、搜索策略——双向搜索、JPS策略等5、路径平滑处理——贝塞尔曲线、B样条曲线等一、启发函数（理论）A星算法评价函数为_a*算法启发式函数怎么设
tags:
  - slurp/a*算法启发式函数怎么设
slurped: 2024-06-05T03:25:30.652Z
title: A星算法优化（一）启发函数_a*算法启发式函数怎么设-CSDN博客
---

基于Python语言对A星算法进行优化：(视频中会拿python与matlab作对比)

源码地址：[https://github.com/Grizi-ju/ros_program/blob/main/path_planning/Astar.py](https://github.com/Grizi-ju/ros_program/blob/main/path_planning/Astar.py)  
B站详解视频：[https://www.bilibili.com/video/BV1FL4y1M7PM?spm_id_from=333.999.0.0](https://www.bilibili.com/video/BV1FL4y1M7PM?spm_id_from=333.999.0.0)  
基于开源算法：https://github.com/Grizi-ju/PythonRobotics/tree/master/PathPlanning/AStar  
（个人认为，用哪种语言不重要，重要的是改进点及改进思路）

**将从以下5个点进行改进：**  
1、启发函数——曼哈顿距离等  
2、权重系数——动态加权等  
3、搜索邻域——基于8邻域搜索改进  
4、搜索策略——双向搜索、JPS策略等  
5、路径平滑处理——贝塞尔曲线、B样条曲线等

#### 一、基础代码详解

本人已经做了详细的中文注释，代码地址：https://github.com/Grizi-ju  
![在这里插入图片描述](https://img-blog.csdnimg.cn/108c0a2fd5434048aead71a43acfea79.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/679d82c882d345ab8cd2196274018a96.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)

**算法预处理：**  
1、将地图栅格化，每一个正方形格子的中央成为节点（索引index）  
2、确定起始点和目标点  
3、定义open_set列表与closed_set列表，open_set中存放待考察的节点，closed_set中存放已经考察过的节点  
4、初始时，定义起点为父节点，存入closed_set  
5、父节点周围共有8个节点，定义为子节点，并存入open_set中，成为待考察对象

#### 二、启发函数改进（理论）

A星算法评价函数为f(n)=g(n)+h(n)，其中h(n)为启发函数，启发函数的改进对算法行为影响很大  
启发函数的作用：指引正确的扩展方向  
其中：  
f(n) 是节点 n的评价函数  
g(n)是在状态空间中从初始节点到节点 n的实际代价  
h(n)是从节点n到目标节点的最佳路径的估计代价。  
g(n)是已知的，所以在这里主要是 h(n) 体现了搜索的启发信息。换句话说，g(n)代表了搜索的广度的优先趋势。

##### 0、Dijkstra

如果h(n)=0,那么只有g(n)实际上是有用的,这时A*算法退化成迪杰斯特拉算法,它能保证一定可以找到一条最优路径

Dijkstra和贪心算法的缺点：  
1.Dijkstra算法很好地找到了最短路径，但它浪费了时间去探索那些没有前途的方向。  
2.贪婪的最好的第一次搜索在有希望的方向上探索，但它可能找不到最短的路径。

A*算法结合了这两种方法

![在这里插入图片描述](https://img-blog.csdnimg.cn/10696a5505804afa8f78a7b0414a361d.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)

##### 1、曼哈顿距离

标准的启发函数是曼哈顿距离（Manhattan distance）  
![在这里插入图片描述](https://img-blog.csdnimg.cn/770f1f0a9494416a96939267befd03a5.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6cb78c09c13a4157854d0fbee3822aee.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_14,color_FFFFFF,t_70,g_se,x_16)

```
h = np.abs(n1.x - n2.x) + np.abs(n1.y - n2.y)     #  Manhattan
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/15e4be9f10f748d0b11cce76b5ae576e.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/62ac56588c9d46f0875000fac7e2fdfa.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)

##### 2、欧几里得距离（欧氏距离）

如果单位可以沿着任意角度移动（而不是网格方向），那么也许应该使用直线距离：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/761146e748b44660a229c6c9a69415e8.png)

```
h = math.hypot(n1.x - n2.x, n1.y - n2.y)       #  Euclidean
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/1210d3949e3d434ca10c740a4008f288.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/45b0a9cd75f540408330a99aaeeacede.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)

##### 3、对角线距离（切比雪夫距离）

如果在地图中允许对角运动，那么需要一个不同的启发函数

```
dx = np.abs(n1.x - n2.x)                        #  Diagnol distance 
dy = np.abs(n1.y - n2.y)
min_xy = min(dx,dy)
h = dx + dy + (math.sqrt(2) - 2) * min_xy   
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/b78f22ca3d104777800e1ba7818bc3e8.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5915dbdfdac14a529eeb784c9a5ae334.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA5bCP5beo5ZCM5a2m,size_12,color_FFFFFF,t_70,g_se,x_16)

参考论文：《一种面向非结构化环境的改进跳点搜索路径规划算法》等