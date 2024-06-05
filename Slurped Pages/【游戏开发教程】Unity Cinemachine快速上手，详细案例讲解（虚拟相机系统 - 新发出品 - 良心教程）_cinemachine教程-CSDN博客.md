---
link: https://blog.csdn.net/linxinfa/article/details/124537415
byline: 成就一亿技术人!
excerpt: 文章浏览阅读3.2w次，点赞269次，收藏657次。本文详细介绍了Cinemachine插件的使用方法，图文并茂，良心教程_cinemachine教程
tags:
  - slurp/cinemachine教程
slurped: 2024-06-05T03:23:34.939Z
title: 【游戏开发教程】Unity Cinemachine快速上手，详细案例讲解（虚拟相机系统 | 新发出品 | 良心教程）_cinemachine教程-CSDN博客
---

![请添加图片描述](https://img-blog.csdnimg.cn/fa667967892942599d88668c2b9044d5.gif)

#### 文章目录

- - - [一、前言](https://blog.csdn.net/linxinfa/article/details/124537415#_4)
        - [二、插件下载](https://blog.csdn.net/linxinfa/article/details/124537415#_17)
        - [三、案例1：第三人称自由视角，Free Look character场景](https://blog.csdn.net/linxinfa/article/details/124537415#1Free_Look_character_27)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_28)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_37)
            - - [2.1、CinemachineBrain：核心](https://blog.csdn.net/linxinfa/article/details/124537415#21CinemachineBrain_38)
                - [2.2、CinemachineFreeLook：第三人称自由视角相机](https://blog.csdn.net/linxinfa/article/details/124537415#22CinemachineFreeLook_41)
                - - [2.2.1、设置Follow：跟随](https://blog.csdn.net/linxinfa/article/details/124537415#221Follow_45)
                    - [2.2.2、设置LookAt：朝向](https://blog.csdn.net/linxinfa/article/details/124537415#222LookAt_54)
                    - [2.2.3、三个圆环轨道：环绕约束](https://blog.csdn.net/linxinfa/article/details/124537415#223_61)
                    - [2.2.4、圆环轨道之间的连接曲线：Spline Curvature](https://blog.csdn.net/linxinfa/article/details/124537415#224Spline_Curvature_71)
                    - [2.2.5、相机移动策略，移动阻尼：Body Y/Z Damping](https://blog.csdn.net/linxinfa/article/details/124537415#225Body_YZ_Damping_78)
                    - [2.2.6、相机旋转策略，瞄准：Aim](https://blog.csdn.net/linxinfa/article/details/124537415#226Aim_94)
                    - [2.2.7、瞄准偏移：Tracked Object Offset](https://blog.csdn.net/linxinfa/article/details/124537415#227Tracked_Object_Offset_115)
                    - [2.2.8、预测：Lookahead](https://blog.csdn.net/linxinfa/article/details/124537415#228Lookahead_122)
                    - [2.2.8、瞄准阻尼：Horizontal/Vertical Damping](https://blog.csdn.net/linxinfa/article/details/124537415#228HorizontalVertical_Damping_145)
                    - [2.2.9、画面构图（重要）](https://blog.csdn.net/linxinfa/article/details/124537415#229_155)
                - [2.3、小结](https://blog.csdn.net/linxinfa/article/details/124537415#23_183)
            - [3、用代码控制相机移动（绕圆环旋转）](https://blog.csdn.net/linxinfa/article/details/124537415#3_185)
        - [四、案例2：相机避障不穿墙，Free Look collider场景](https://blog.csdn.net/linxinfa/article/details/124537415#2Free_Look_collider_222)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_223)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_232)
            - - [2.1、CinemachineCollider：相机碰撞](https://blog.csdn.net/linxinfa/article/details/124537415#21CinemachineCollider_233)
                - - [2.1.1、Add Extension拓展](https://blog.csdn.net/linxinfa/article/details/124537415#211Add_Extension_236)
                    - [2.1.2、Collide Against：被认定为障碍物的Layer](https://blog.csdn.net/linxinfa/article/details/124537415#212Collide_AgainstLayer_244)
                    - [2.1.3、Ignore Tag：忽略碰撞检测的Tag](https://blog.csdn.net/linxinfa/article/details/124537415#213Ignore_TagTag_247)
                    - [2.1.4、Transparent Layers：透明层](https://blog.csdn.net/linxinfa/article/details/124537415#214Transparent_Layers_250)
                    - [2.1.5、Minimum Distance From Target：与目标的最小距离](https://blog.csdn.net/linxinfa/article/details/124537415#215Minimum_Distance_From_Target_266)
                    - [2.1.6、Avoid Obstacles：是否避开障碍物](https://blog.csdn.net/linxinfa/article/details/124537415#216Avoid_Obstacles_268)
                    - [2.1.7、Distance Limit：碰撞检测的射线长度](https://blog.csdn.net/linxinfa/article/details/124537415#217Distance_Limit_270)
                    - [2.1.8、Camera Radius：相机半径](https://blog.csdn.net/linxinfa/article/details/124537415#218Camera_Radius_272)
                    - [2.1.9、Strategy：避障策略](https://blog.csdn.net/linxinfa/article/details/124537415#219Strategy_274)
                    - [2.1.10、Maximum Effort：一次可处理的最多的障碍物数量](https://blog.csdn.net/linxinfa/article/details/124537415#2110Maximum_Effort_291)
                    - [2.1.11、Smoothing Time：相机移动的平滑时间](https://blog.csdn.net/linxinfa/article/details/124537415#2111Smoothing_Time_294)
                    - [2.1.12、Damping：避障后相机恢复位置的阻尼](https://blog.csdn.net/linxinfa/article/details/124537415#2112Damping_307)
                    - [2.1.12、Damping When Occluded：避障时的相机阻尼](https://blog.csdn.net/linxinfa/article/details/124537415#2112Damping_When_Occluded_311)
        - [五、案例3：简单追踪，FollowCam Simple Follow场景](https://blog.csdn.net/linxinfa/article/details/124537415#3FollowCam_Simple_Follow_315)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_316)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_324)
            - [2.1、CinemachineVirtualCamera：虚拟相机](https://blog.csdn.net/linxinfa/article/details/124537415#21CinemachineVirtualCamera_325)
            - - [2.1.1、Follow与LookAt：追踪目标](https://blog.csdn.net/linxinfa/article/details/124537415#211FollowLookAt_328)
                - [2.1.2、Binding Mode：Body绑定模式](https://blog.csdn.net/linxinfa/article/details/124537415#212Binding_ModeBody_331)
                - - [1、Lock To Target On Assign 模式（常用）](https://blog.csdn.net/linxinfa/article/details/124537415#1Lock_To_Target_On_Assign__340)
                    - [2、Lock To Target With World Up 模式](https://blog.csdn.net/linxinfa/article/details/124537415#2Lock_To_Target_With_World_Up__359)
                    - [3、Lock To Target No Roll 模式](https://blog.csdn.net/linxinfa/article/details/124537415#3Lock_To_Target_No_Roll__375)
                    - [4、Lock To Target 模式](https://blog.csdn.net/linxinfa/article/details/124537415#4Lock_To_Target__388)
                    - [5、World Space 模式](https://blog.csdn.net/linxinfa/article/details/124537415#5World_Space__403)
                    - [6、Simple Follow With World Up 模式](https://blog.csdn.net/linxinfa/article/details/124537415#6Simple_Follow_With_World_Up__416)
        - [六、案例4：动画状态驱动自由视角，StateDrivenCamera场景](https://blog.csdn.net/linxinfa/article/details/124537415#4StateDrivenCamera_436)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_437)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_447)
            - - [2.1、CinemachineStateDrivenCamera：状态驱动虚拟相机](https://blog.csdn.net/linxinfa/article/details/124537415#21CinemachineStateDrivenCamera_450)
                - [2.1.1、父节点：CinemachineStateDrivenCamera](https://blog.csdn.net/linxinfa/article/details/124537415#211CinemachineStateDrivenCamera_451)
                - [2.1.2、子节点：多个虚拟相机](https://blog.csdn.net/linxinfa/article/details/124537415#212_454)
                - [2.1.3、设置Animated Target](https://blog.csdn.net/linxinfa/article/details/124537415#213Animated_Target_457)
                - [2.1.4、设置State](https://blog.csdn.net/linxinfa/article/details/124537415#214State_461)
        - [七、案例5：分镜/切镜，ClearShot场景](https://blog.csdn.net/linxinfa/article/details/124537415#5ClearShot_466)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_480)
            - - [1.1、ClearShot场景](https://blog.csdn.net/linxinfa/article/details/124537415#11ClearShot_481)
                - [1.2、ClearShot closest场景](https://blog.csdn.net/linxinfa/article/details/124537415#12ClearShot_closest_498)
                - [1.2、ClearShot character场景](https://blog.csdn.net/linxinfa/article/details/124537415#12ClearShot_character_510)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_520)
            - - [2.1、CinemachineClearShot：自动选择/切换最适合的摄像头](https://blog.csdn.net/linxinfa/article/details/124537415#21CinemachineClearShot_521)
                - [2.2、CinemachineBlendListCamera：虚拟相机过渡/混合器](https://blog.csdn.net/linxinfa/article/details/124537415#22CinemachineBlendListCamera_535)
                - [2.3、CinemachineTriggerAction：虚拟相机触发器](https://blog.csdn.net/linxinfa/article/details/124537415#23CinemachineTriggerAction_558)
                - - [2.3.1、碰撞体勾选Is Trigger](https://blog.csdn.net/linxinfa/article/details/124537415#231Is_Trigger_574)
                    - [2.3.2、设置过滤](https://blog.csdn.net/linxinfa/article/details/124537415#232_580)
                    - [2.3.3、设置Skip First](https://blog.csdn.net/linxinfa/article/details/124537415#233Skip_First_585)
                    - [2.3.4、设置On Object Enter响应](https://blog.csdn.net/linxinfa/article/details/124537415#234On_Object_Enter_590)
        - [八、案例6：多目标追踪，Dolly Group场景](https://blog.csdn.net/linxinfa/article/details/124537415#6Dolly_Group_610)
        - - [1、场景演示](https://blog.csdn.net/linxinfa/article/details/124537415#1_611)
            - [2、组件参数](https://blog.csdn.net/linxinfa/article/details/124537415#2_617)
        - [九、其他案例](https://blog.csdn.net/linxinfa/article/details/124537415#_624)
        - - - [1、打BOSS视角：BossCam场景](https://blog.csdn.net/linxinfa/article/details/124537415#1BOSSBossCam_626)
                - [2、双重目标：DualTarget场景](https://blog.csdn.net/linxinfa/article/details/124537415#2DualTarget_628)
                - [3、近物透明，FadeOutNearbyObjects场景](https://blog.csdn.net/linxinfa/article/details/124537415#3FadeOutNearbyObjects_630)
                - [4、第三人称瞄准，3rdPersonWithAimMode场景](https://blog.csdn.net/linxinfa/article/details/124537415#43rdPersonWithAimMode_632)
                - [5、镜头震动，Impulse场景](https://blog.csdn.net/linxinfa/article/details/124537415#5Impulse_637)
        - [十、完毕](https://blog.csdn.net/linxinfa/article/details/124537415#_641)

#### 一、前言

嗨，大家好，我是新发。  
相信很多同学都用过`Unity`的`Cinemachine`插件，使用它可以很方便地实现一些摄像机效果，比如摄像机追踪、推拉镜头、分镜等效果。  
插件提供了很多场景案例，大家可以看下插件的官方文档：  
[https://docs.unity3d.com/Packages/com.unity.cinemachine@2.8/manual/CinemachineUsing.html](https://docs.unity3d.com/Packages/com.unity.cinemachine@2.8/manual/CinemachineUsing.html)

趁五一假期有时间，我准备对插件里的案例场景进行讲解，方便大家快速上手，希望大家学以致用。

提示：本文内容较长，建议收藏后使用电脑观看。

> 注：本文使用的`Unity`版本为`2021.3.1f1c1`，`Cinemachine`版本为`2.8.4`

#### 二、插件下载

在`PackageManager`中搜索`Cinemachine`，点击`Install`安装即可，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a53ec780536b40749a997d650690779d.png)  
本文我要讲解插件的案例，所以需要把`Samples`也引入到工程中，点击`Samples`的`Import`按钮，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b4a2cdb46ea54594b1f94844d948c2b6.png)  
完成后我们就可以在工程中看到`Cinemachine`的插件包和案例包了，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d2f67f182c3f4ad984e4779addb87711.png)  
现在我们开始吧~

> 注：本文讲解的案例顺序不是按照目录顺序，而是根据常用程度进行排序

#### 三、案例1：第三人称自由视角，Free Look character场景

##### 1、场景演示

双击打开`Free Look character`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/bb9dcd47d1db48639415ec0062ff1f0a.png)  
这是第三人称自由视角的摄像机效果，如下  
![请添加图片描述](https://img-blog.csdnimg.cn/b4abfddc3d7441f8ad7f11cdb7e045b7.gif)  
画个图

![在这里插入图片描述](https://img-blog.csdnimg.cn/d7c85fdead2443068d57df4ce49afbe3.png)

##### 2、组件参数

###### 2.1、CinemachineBrain：核心

主摄像机上挂`CinemachineBrain`组件，参数默认即可，它是整个虚拟相机系统的核心，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6387a958de384333b68fcd7a168e5d5d.png)

###### 2.2、CinemachineFreeLook：第三人称自由视角相机

`CM FreeLook1`节点上挂了`CinemachineFreeLook`组件，它实现了第三人称自由视角的相机逻辑，是非常常用的一个相机功能，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ff3bfe21f1e94abb8a5228ae17b22e20.png)  
下面我介绍一下这个组件的参数设置。

###### 2.2.1、设置Follow：跟随

我们需要设置追踪的目标物体，这里设置追踪的目标是主角的`Root`节点，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a3aed79712c648bc88bb9ccf76d6ac3f.png)  
如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d55159d746a949b09de7f1908410dc47.png)  
设置了`Follow`对象，摄像机就会跟着追踪的对象移动了。  
![请添加图片描述](https://img-blog.csdnimg.cn/5208dcd0ae3a492fbe941c60658c6ee2.gif)

###### 2.2.2、设置LookAt：朝向

设置`LookAt`，可以让相机角度始终朝着目标的方向，这里设置的是看向主角的头，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9d7690f4b0f444ca946ac8ab1c7e5751.png)  
如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c02a4c6afc3c43a6812af90e730ed1ef.png)  
我们可以看到相机的`Z`轴（蓝色的那根轴）始终朝着主角的头，  
![请添加图片描述](https://img-blog.csdnimg.cn/d897a369ac9046908a10ccdd087e86d3.gif)

###### 2.2.3、三个圆环轨道：环绕约束

摄像机围绕主角环绕的范围是由三个圆环轨道决定的，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/06c4b76e59f14d169da4d98d792b1265.png)  
我们可以调整这三个圆环轨道的高度和半径，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/d68b3b2d5acd42a4bb530987f77b4c10.png)  
如下  
![请添加图片描述](https://img-blog.csdnimg.cn/4aea71fbe757499a9f2499d45eea9de0.gif)

###### 2.2.4、圆环轨道之间的连接曲线：Spline Curvature

三个圆环之间有一根连接的曲线，它是摄像机在竖直方向上移动的约束，你可以把它想象成就是一根弯曲的杆子，在它对面有一根形状与它一样的隐形的杆子，相机只能在这根隐形的杆子上移动，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ba1ed3ebf97a4fd59c77fc54aae59017.png)  
我们可以调节`Spline Curvature`来调整这根连接杆的弯曲程度，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1d4c272735a144adad9d34a8832c25f5.png)  
如下  
![请添加图片描述](https://img-blog.csdnimg.cn/19ae2f37ace241129daa25ca2ee99588.gif)

###### 2.2.5、相机移动策略，移动阻尼：Body Y/Z Damping

我们有三个圆环轨道，分别对应三个机位视角：顶部机位、中部机位、底部机位，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e627554653a3484c934ceff44bf32f48.png)  
我们可以调整每个机位的相机移动阻尼、画面构图等，以`Middle Rig`中部机位为例，  
我们可以调整相机跟随的移动阻尼，阻尼越大，跟随速度越慢，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/75926c7476f54efda8440452b45ca808.png)  
`Y Damping`用于控制相机在竖直方向上的跟随阻尼，比如角色跳跃的时候，相机也会跟着在竖直方向上 “跳”，相机的 “跳” 会受到这个`Y Damping`阻尼影响。  
同理，`Z Damping`控制垂直于屏幕方向移动的阻尼，比如角色往垂直于屏幕的方向走，相机也跟着往前，相机在这个方向上的跟随受到`Z Damping`阻尼的影响。

> 注：阻尼可以减少由于相机速度过快而出现画面抖动的效果。  
> 阻尼为 0 会显得跟随很僵硬，可能出现画面抖动；阻尼过大则会导致相机跟随太慢，跟不上主角。

我调整`Z Damping`给大家演示一下，首先看下`Z Damping`为`1`时的效果，  
![请添加图片描述](https://img-blog.csdnimg.cn/28257968ba294ce19c0f31ced87ecd0e.gif)

接着我把`Z Damping`阻尼调大到`20`，可以看到相机跟随已经跟不上主角的移动了，特别是主角跑起来的时候，建议保持默认的`1`即可，  
![请添加图片描述](https://img-blog.csdnimg.cn/a090aa36bd42447e8f7625caf3c848ba.gif)

###### 2.2.6、相机旋转策略，瞄准：Aim

展开`Aim`下拉按钮，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/191b576ac69b4e54bb8f9c5215fc2406.png)

我们可以在`Game`试图中看到出现了一些线和一些区域块，如下，它是通过约束相机的==旋转==来达到让瞄准的物体显示在画面区域内的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/de32ef448c2a49a1b03c64f7d46a2b7e.png)  
如果你没有显示上面的线和区域，检查一下`Game Window Guides`是否是勾选状态，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3882ac25aa234823bbf85d91d743c89d.png)  
我们可以切换瞄准的策略，默认是`Composer`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/99053d4c7d214159a28b2e966fd37194.png)  
每种瞄准策略含义如下

|瞄准策略|说明|
|---|---|
|Composer|将目标保持在相机镜头内，可以设置多种约束|
|Group Composer|将多个目标保持在相机镜头内|
|Hard Look At|将Look At目标固定在镜头中心的位置|
|POV|根据用户的输入旋转相机|
|Same As Follow Target|将相机的旋转和跟随目标的旋转同步|

下面以`Composer` 策略为例，介绍一下各个参数的用途。

###### 2.2.7、瞄准偏移：Tracked Object Offset

`Tracked Object Offset相`参数控制对于跟踪目标的偏移，比如我们`Look At`的目标是`Head`节点，但是这个节点与主角的真实头部偏了一些，我们就可以通过调整`Tracked Object Offset`来校准瞄准的位置，

![在这里插入图片描述](https://img-blog.csdnimg.cn/fbc35b82561a41bf8110f7bb12ceb3ba.png)  
如下  
![请添加图片描述](https://img-blog.csdnimg.cn/979db9e856c849aa9238a0051bf79724.gif)

###### 2.2.8、预测：Lookahead

![在这里插入图片描述](https://img-blog.csdnimg.cn/54609a9756634c95a2aba8696f645226.png)

|参数|说明|
|---|---|
|Lookahead Time|预测提前的秒数，默认为0，如果大于0，会预测目标的位置，如果主角移动速度很快，可以适当进行预测，如果主角移动速度不快，但开启了预测，可能会导致相机抖动|
|Lookahead Smoothing|预测算法的平滑度，提高平滑度可以减少预测抖动，但会导致预测滞后|
|Lookahead ignore Y|预测算法会忽略Y轴的移动|

我们把`Lookahead Time`调大到`1`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/86b1fb99ba4e47378387fbcde1a0a11f.png)  
效果如下，可以看到，过度预测导致了相机的抖动，  
![请添加图片描述](https://img-blog.csdnimg.cn/fd212e421ea34fa2a9736ae6b352007f.gif)  
我们保持`1`秒`Lookahead Time`，此时我们把`Lookahead Smoothing`调大到`8`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3707104bc9e34660bc42f54dfec442bd.png)  
效果如下，可以看到，相机提前预测了目标位置，抖动平滑了一些，但是由于我们的主角移动速度并不快，预测导致相机超前，最后还得折返回来，所以这里我们没有必要开启预测。  
如果你的项目的主角是飞机，飞行速度快，则可以考虑开启预测。  
![请添加图片描述](https://img-blog.csdnimg.cn/97eb1756a7174d2eb1886d83b4f2d4cb.gif)

`Lookahead Ignore Y`就是忽略`Y`轴方向上的预测，比如跳跃动作，我们不想让相机做`Y`轴上的预测，就可以勾选它，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/356fd344c3f54c1ba25283cfa7e2e057.png)  
一般情况下，我们都不需要开启预测，保持为`0`即可，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b2c8ffedb0674ccbb63db052b8f5928e.png)

###### 2.2.8、瞄准阻尼：Horizontal/Vertical Damping

![在这里插入图片描述](https://img-blog.csdnimg.cn/33fc6825ab41499d8563b5707f2cc5e8.png)  
注意，这个和`2.2.5`小节讲的`Body Y/Z Damping`阻尼是不同的，`Body Y/Z Damping`是移动阻尼，而`Horizontal/Vertical Damping`是旋转阻尼，  
为了方便观察，我先把`Follow`设为`None`，让相机固定位置不动，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a32732316765405e8e10bcea20b7092a.png)  
现在我们先看`Horizontal Damping`为`0.5`时的效果，此时水平旋转阻尼比较小，相机的旋转是可以跟上主角的移动的，  
![请添加图片描述](https://img-blog.csdnimg.cn/5e9aef06d3f2486ab742044d8b2ec842.gif)  
现在我们把`Horizontal Damping`调整到`3`，效果如下，可以看到，相机的水平旋转由于阻尼的作用而出现了滞后，适当的阻尼可以减少抖动，过大的阻尼会带来滞后，我们保持默认的`0.5`就好了，  
![请添加图片描述](https://img-blog.csdnimg.cn/dbdf4d69aa4b453b9caeec5c1fb36dfb.gif)

###### 2.2.9、画面构图（重要）

喜欢摄影的同学应该都听说过构图，比如三分法、中央对称法、对角线三角形、留白、黄金比例等等。在`Cinemachine`中，提供了`Dead Zone`、`Soft Zone`来约束主角在画面中的位置，我们可以调整对应的参数来实现自己的画面构图，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/922c508fc2524ad4a5c63829b9bbb573.png)  
`Dead Zone`和`Soft Zone`区域如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c3c1dff2f0df4e13b51c273a7acd4f30.png)  
`Dead Zoon`范围内，主角的移动不会触发相机的旋转，为了演示，我把`Dead Zone`调大一点点，我们可以通过`Dead Zone Width`和`Dead Zone Height`来调整`Dead Zoon`的区域大小，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f17a7b6ebc6b426cb996a5034b74b8cf.png)  
可以看到，`Dead Zoon`范围内，主角的移动不会触发相机的旋转，只有当主角的位置超出了`Dead Zone`的区域，才会触发相机的旋转，  
![请添加图片描述](https://img-blog.csdnimg.cn/b85a0519ea2a4dfcab704b7212aea7da.gif)  
我们可以把`Dead Zone`区域调为``0```，这样主角只要发生移动，就会触发相机的旋转，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/cab4016177874b10a5a56c8aafe8449f.png)

同理，`Soft Zone`的区域是一个缓冲区域，在这个区域内，相机会插值旋转（慢慢旋转），直至把主角 “推” 回到 `Dead Zone`内，如果主角的位置超过了`Soft Zone`的区域，相机就会立刻旋转确保主角留在`Soft Zone`区域内。

比如我现在把`Soft Zone`区域调小，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/eb16ba62f55c4d979c7e807b4d2ada46.png)  
测试效果如下，可以看到，当主角尝试超过`Soft Zone`区域时，相机的旋转速度会立刻跟上，确保主角在`Soft Zone`区域内，  
![请添加图片描述](https://img-blog.csdnimg.cn/78245a21d3f241afb76bd508c6e5c4e2.gif)  
`Screen X`和`Screen Y`是用来调整整个`Zone`的屏幕位置的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/70ac4513b05a40a3983aa453c884345f.png)  
比如把整个`Zone`调整到屏幕左下角，这样主角在画面中的位置就是左下角了，  
![请添加图片描述](https://img-blog.csdnimg.cn/2b3f94959d7949d1816d609602a86ff5.gif)

`Bias X`和`Bias Y`用来调整`Soft Zoon`相对于整个`Zoon`的位置偏移，

![在这里插入图片描述](https://img-blog.csdnimg.cn/f59eb7fd928f4850a58baf9476333a66.png)  
效果如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/b728491efd3c4c01820f4cbe841726f7.gif)

###### 2.3、小结

这个案例中，我们主要设置`CinemachineFreeLook`组件的`Follow`、`LookAt`对象，调整移动阻尼：`Body Y/Z Damping`，调整一下`Aim`的`Dead Zone`、`Soft Zone`就差不多了，可以快速应用到自己的实际项目中。

##### 3、用代码控制相机移动（绕圆环旋转）

等我们移动鼠标的时候，相机会围绕圆环轨道移动，如下  
![请添加图片描述](https://img-blog.csdnimg.cn/ff0c250e5986490a9aa1a9080d6610b7.gif)  
这是因为`CinemachineFreeLook`组件监听了`Mouse Y`、`Mouse X`输入，它根据鼠标的移动去控制相机的移动，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7ac69880afff462497e8b2a5584de75f.png)  
如果我们先禁用它自身的这个控制，可以把这两个`Input Axis Name`设置为空，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f558c506d36c421084cd98d2c915d41c.png)  
接着，我们在代码中去设置`CinemachineFreeLook`组件的`m_XAxis`和`m_YAxis`成员的`m_InputAxisValue` 即可，例：

```
using UnityEngine;
using Cinemachine;

public class Main : MonoBehaviour
{
    private CinemachineFreeLook vcam;

    void Start()
    {
        vcam = GetComponent<CinemachineFreeLook>();
    }

    void Update()
    {
        // 自己通过代码获取 x、y分量，比如通过摇杆获取，这里我就仍然使用 Mouse X 和 Mouse Y吧
        var x = Input.GetAxis("Mouse X");
        var y = Input.GetAxis("Mouse Y");
        // 相机移动
        vcam.m_XAxis.m_InputAxisValue = x;
        vcam.m_YAxis.m_InputAxisValue = y;
    }
}
```

关于摇杆的实现，可以参见我之前写的这篇博客的第六节：[【游戏开发创新】用Unity等比例制作广州地铁，广州加油，早日战胜疫情（Unity | 地铁地图 | 第三人称视角）](https://blog.csdn.net/linxinfa/article/details/117536057)

![](https://img-blog.csdnimg.cn/20210603231452659.gif)  
![](https://img-blog.csdnimg.cn/2021060323073095.gif)

#### 四、案例2：相机避障不穿墙，Free Look collider场景

##### 1、场景演示

双击打开`Free Look collider`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e704174bc703466e82b87e5bfe9f2a6c.png)  
这也是第三人称自由视角的摄像机效果，在此基础上加了`CinemachineCollider`，避免相机穿墙的问题，效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/241bdec5eb5f4e809935efd3dffffd8d.gif)  
画个图

![在这里插入图片描述](https://img-blog.csdnimg.cn/30c28078a7cd46e7ab48271b25b4ddd4.png)

##### 2、组件参数

###### 2.1、CinemachineCollider：相机碰撞

在上面==案例1==的基础上，加多了一个`CinemachineCollider`组件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0785316853bc49bd9d3fec79f311f922.png)

###### 2.1.1、Add Extension拓展

如果你点击`AddComponent`按钮，你是找不到这个`CinemachineCollider`组件的；  
![在这里插入图片描述](https://img-blog.csdnimg.cn/40c51a379e77462ebc57a4296f6ad84f.png)

正确的姿势是点击`CinemachineFreeLook`的`Add Extension`下拉选项，添加`CinemachineCollider`拓展，

![在这里插入图片描述](https://img-blog.csdnimg.cn/f8691309cc7f420aaf662dbf33fe12ee.png)

###### 2.1.2、Collide Against：被认定为障碍物的Layer

虚拟相机的碰撞是通过射线检测来实现的，射线检测的时候可以传一个`LayerMask`参数过滤要检测的层，这里`Collide Against`参数就是设置被认为障碍物的`Layer`，只有被勾选的`Layer`才会参与射线碰撞检测，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1786107216d6416b9268a5bef116d863.png)

###### 2.1.3、Ignore Tag：忽略碰撞检测的Tag

如果我们想要剔除掉某个`Tag`的物体，不对特定`Tag`的物体进行碰撞检测，可以设置`Ignore Tag`参数，这里设置的是`Player`，也就是不与主角做碰撞检测（也就是说摄像机有可能从主角身上穿过去）  
![在这里插入图片描述](https://img-blog.csdnimg.cn/b4c20c04cc6c41fba9eb6fb832a4fd72.png)

###### 2.1.4、Transparent Layers：透明层

透明层的物体被认为是透明的，不作为障碍物处理。  
可能有同学要问了，上面不是已经有个`Tag`来剔除碰撞检测对象了吗，这个透明层是不是有点功能重复了？非也，请往下看，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a43e4bb1ffc24a548b0e40fb50103780.png)  
首先要清楚这个`CinemachineCollider`的功能不仅仅是确保相机不穿墙，还要确保主角不被 障碍物 挡住。

比如下面这种情况（我把`Transparent Layers`设置为`Default`，这样墙壁被认为是透明层），相机并没有在墙里面，但是视线被墙挡住了，看不见主角，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2d75839873b04209999fe2614f424d98.png)  
我们把`Transparent Layers`改回`Nothing`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/88536abf7e0840a5adcf9ea453299f24.png)  
此时可以看到，主角画面没有被墙挡住了，现在你知道`Transparent Layers`是干嘛的了吗~  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a423d03eebf94800986dd0931c2907b4.png)  
如果这里的墙确实是半透明的，那么我们就可以把它的层加入到`Transparent Layers`，比如这里我特意把墙改为半透明，添加了一个`Wall`层，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ee4c4f51d82745ce86daeba0ef48f1c1.png)  
效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/bcb9e283c78b402ca68b0b5c45419a48.gif)

###### 2.1.5、Minimum Distance From Target：与目标的最小距离

与目标的最小距离 ，只有大于最小距离，`Cinemachine`才会进行规避障碍物的操作。

###### 2.1.6、Avoid Obstacles：是否避开障碍物

勾选了才会执行避障逻辑。

###### 2.1.7、Distance Limit：碰撞检测的射线长度

上面我们说到碰撞检测这里用的是射线来检测的，`Distance Limit`就是射线的长度，为`0`的时候则以`Cinemachine`与`Follow`目标的距离为射线长度，

###### 2.1.8、Camera Radius：相机半径

相机将尝试与任何障碍物保持此距离。 尽量保持这个值很小。

###### 2.1.9、Strategy：避障策略

![在这里插入图片描述](https://img-blog.csdnimg.cn/022848563d504aa0b8c9c09824577009.png)

|避障策略|说明|
|---|---|
|Pull Camera Forward|直接让相机往前走，移动到障碍物之前|
|Preserve Camera Height|相机高度不变，通过向左或向右移动来避开障碍物|
|Preserve Camera Distance|保持相机和目标的距离不变，避开障碍物|

**Pull Camera Forward** 这种策略摄像机会出现瞬移的问题，如下  
![请添加图片描述](https://img-blog.csdnimg.cn/7ba351e67e584720a361a893f9d2c3e8.gif)

**Preserve Camera Height** 这种策略摄像机会在水平方向上移动来过渡，而不是像上面那样瞬移，==推荐使用这种策略==，如下

![请添加图片描述](https://img-blog.csdnimg.cn/fd05c1c372154bed932c1cc939930380.gif)  
**Preserve Camera Distance** 这种策略由于为了保持距离，摄像机会出现向上蹿或像下蹿的问题，如下

![请添加图片描述](https://img-blog.csdnimg.cn/e93738c1d21d4de494f01a6410685ee0.gif)

###### 2.1.10、Maximum Effort：一次可处理的最多的障碍物数量

一般`4`个就可以了，太高影响性能。

###### 2.1.11、Smoothing Time：相机移动的平滑时间

在距离目标最近的点保持相机的最小秒数。如果场景中障碍物很多，会导致摄像机频繁避障而出现相机跳动，比如我在主角周围摆了那么多障碍物，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/61f26d64bb74498ca9a35cb90fded58a.png)  
此时，就可以适当调大`Smoothing Time`，减少多余的摄像机避障移动。  
我们先看下`Smoothing Time`为`0`时的效果，可以看到摄像机很跳，  
![请添加图片描述](https://img-blog.csdnimg.cn/604999f37c0340b0a664a0c63f664700.gif)  
现在我们把`Smoothing Time`调大到`2`，效果如下，可以看到，摄像机平滑了很多，不会那么跳了，

![请添加图片描述](https://img-blog.csdnimg.cn/1b959e06c4fb494fb8d05358079f7c4e.gif)

###### 2.1.12、Damping：避障后相机恢复位置的阻尼

遮挡消失后，相机恢复到正常位置的阻尼。  
比如我们使用`Pull Camera Forward`避障策略，然后把`Damping`调大，可以看到在遮挡消失后，相机位置有一个平滑的过渡恢复效果，  
![请添加图片描述](https://img-blog.csdnimg.cn/ec754f0471804615b709592f7407cd15.gif)

###### 2.1.12、Damping When Occluded：避障时的相机阻尼

上面的`Damping`是避障后恢复的阻尼，这个`Damping When Occluded`则是避障时的相机阻尼，我们同样使用`Pull Camera Forward`避障策略进行测试，把`Damping When Occluded`调大，效果如下，可以看到，当出现遮挡时，摄像机不是瞬移了，而是有个阻尼过渡移动过去，看起来貌似与`Preserve Camera Height`避障策略差不多，但`Preserve Camera Height`避障会确保摄像机不穿墙，而这种`Pull Camera Forward`配合`Damping When Occluded`的方式是会存在摄像机穿墙的问题的。  
![请添加图片描述](https://img-blog.csdnimg.cn/177f652fa8894c078fe7fade9b129b3c.gif)

#### 五、案例3：简单追踪，FollowCam Simple Follow场景

##### 1、场景演示

双击打开`FollowCam Simple Follow`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/dd282fb0cab04742ad95f2c62fa0cac4.png)  
这是一个追踪一架飞机飞行的摄像机效果，效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/ff1b16a6f76f491fbf60d9eb9f3d5016.gif)  
画个图

![在这里插入图片描述](https://img-blog.csdnimg.cn/448a7df3ec664f0daf68ee47e830e069.png)

##### 2、组件参数

##### 2.1、CinemachineVirtualCamera：虚拟相机

与`CinemachineFreeLook`一样，`CinemachineVirtualCamera`也是继承`CinemachineVirtualCameraBase`，相对来说，`CinemachineVirtualCamera`功能更简单一些。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/13607f586de8492e820e357213ae5368.png)

###### 2.1.1、Follow与LookAt：追踪目标

同样也是设置`Follow`和`LookAt`参数，设置追踪的目标和朝向的目标。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3aaf823fd92e4742a20c9fa698f0d67f.png)

###### 2.1.2、Binding Mode：Body绑定模式

需要重点讲一下`Body`的绑定模式，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/6d1a3064215743d4a09a753ea76a611b.png)  
大家可以打开`Transposer`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a84b0bb0d3644c1da140077337e2d3be.png)  
这个场景里帮我们创建了多个`Binding Mode`的虚拟相机，方便我们进行测试，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a0422a97caa248b4aa5f75b7f40e8dfc.png)  
下文，我将使用一个更直观的案例进行演示~

###### 1、Lock To Target On Assign 模式（常用）

当相机跟踪目标被设置的时候，把相机设置到目标物体的局部坐标系中，但不跟随目标物体的旋转而移动。

==简单讲就是：你动我动，你转我不动==

![请添加图片描述](https://img-blog.csdnimg.cn/884df1d090ec483c9d15de9f9ae31bcf.gif)

这种适用于视角固定的追踪，为了方便演示应用效果，我导入另外一个`Package`资源包，该资源包可以在`AssetStore`免费下载使用，地址：[https://assetstore.unity.com/packages/3d/characters/humanoids/character-pack-free-sample-79870](https://assetstore.unity.com/packages/3d/characters/humanoids/character-pack-free-sample-79870)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/44056eb34e9848b995121d4af48efe4a.png)  
稍微整一下场景，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3e2aaee395cf4b85b2f8f15d60981a4d.png)  
虚拟相机参数设置如下，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a9d8152eea3347d6b5896c270c5f4f19.png)

我们运行，效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/153626b821414108a969f54fefa80d15.gif)

###### 2、Lock To Target With World Up 模式

相机被设置到目标物体的局部坐标系中，但不会跟随目标物体在`z`轴旋转, 也不会跟随目标物体在`x`轴倾斜。

==简单讲就是：你动我动，你x/z轴转我不动，你y轴转我动。==

![请添加图片描述](https://img-blog.csdnimg.cn/6991ce527ff24e689b85d4b55846738e.gif)  
同样，我们使用小男孩演示下镜头效果，注意主角身上的`SimpleSampleCharacterControl`组件的移动模式切换成`Tank`模式，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f82bb728323e41099d6a8ad94d22873f.png)  
运行效果如下，适合这种视角始终朝着角色背后的情景，  
![请添加图片描述](https://img-blog.csdnimg.cn/b7cdf826b3c04501ae5430569cb33cb3.gif)  
并且主角`x`轴旋转时，相机不会因为主角的旋转而移动，

![请添加图片描述](https://img-blog.csdnimg.cn/582bff6ca2704f4d98f652fc80bed1ac.gif)

###### 3、Lock To Target No Roll 模式

相机被设置到目标物体的局部坐标系中，但不会跟随目标物体在```z``轴的旋转。

==简单讲就是：你动我动，你x/y旋转我动，你z轴转我不动。==

![请添加图片描述](https://img-blog.csdnimg.cn/60856e6c25194a378548598c48edcca8.gif)  
小男孩效果如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/fa667967892942599d88668c2b9044d5.gif)  
这个情景看起来效果与`Lock To Target With World Up`一样，但如果主角在绕着`x`轴旋转，相机会跟着移动，如下

![请添加图片描述](https://img-blog.csdnimg.cn/f19051375d27495ea0193aec917f4fdd.gif)

###### 4、Lock To Target 模式

这是最容易理解的类型，相机被设置到目标物体的局部坐标系中，将一直跟随目标物体旋转和移动。

==简单讲就是：你动我动，你转我动。==

![请添加图片描述](https://img-blog.csdnimg.cn/c6bc5d8860c14ec7b7bb2349c2aaef33.gif)  
小男孩效果如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/734ddab8d6fc4043bbbe9e03de0cf94e.gif)  
跟上面的`Lock To Target No Roll` 和`Lock To Target With World Up` 运行效果一样，但如果主角在沿着`x`、`y`轴旋转，摄像机会跟着移动，  
![请添加图片描述](https://img-blog.csdnimg.cn/7a7175fbd5c64d3c92279d59cdecfc65.gif)

其实对于小男孩的这个情景，你使用`Lock To Target`、`Lock To Target No Roll` 、`Lock To Target With World Up` 的运行效果一样，因为这个情景下，小男孩并不会发生`x`、`y`轴的旋转。

###### 5、World Space 模式

相机跟目标的偏移以世界坐标来进行计算，并始终保持在初始设置的状态。

==简单讲就是：你动我动，你转我不动==  
诶，听起来跟 **Lock To Target On Assign** 模式一样，其实不一样，区别就在于`Follow Offset`参数，**Lock To Target On Assign** 模式是把 `Follow Offset`当做目标物体的局部坐标系来计算偏移的，而 **World Space** 模式，则是以世界坐标系来计算偏移的，

![在这里插入图片描述](https://img-blog.csdnimg.cn/c8c71f43ae674971aefd1c96c612c8d8.png)  
![请添加图片描述](https://img-blog.csdnimg.cn/8fe77e0b85334fe59a998fa3a1db31f9.gif)  
小男孩运行效果如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/401004d544e04fdd9088de3a34214bd0.gif)  
表现效果与`Lock To Target On Assign`一样，如果在这种应用情景下，我建议使用`World Space`，因为少了一步转局部坐标的过程。

###### 6、Simple Follow With World Up 模式

使用相机坐标系来计算与目标物体的偏移，不会跟随物体旋转而改变朝向，相机方向始终向上。  
比如这个时候的相机坐标系是这样的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7a61324b98e94dd4882317c77600b17b.png)  
把这个坐标系移动到目标物体的中心位置，然后基于这个坐标系做一次`Follow Offset`偏移，即可得到相机的位置，

![在这里插入图片描述](https://img-blog.csdnimg.cn/2324498df8724f12aa0c8ef3cec7f2fb.png)  
效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/e02fda2853ed4e658e0e7470f799e496.gif)

小男孩运行效果如下，  
![请添加图片描述](https://img-blog.csdnimg.cn/a7a8bd75e70a4dd589c10021945309d9.gif)

这一看好像与`World Space`模式的表现是一样的，其实不一样，我们换个视角观察，我让小男孩一直往左走，先看下`World Space`的效果，  
![请添加图片描述](https://img-blog.csdnimg.cn/abeb5d3bbb5447e38f4948aee90d435c.gif)  
现在我们看下`Simple Follow With World Up` 模式下，小男孩一直往左跑是什么效果，如下，小男孩是绕着圈圈走的。之前就有一个策划拿着某款游戏过来问我，为什么主角一直往右跑的时候看起来好像是在转圈圈，我猜那款游戏用的就是`Simple Follow With World Up`模式，

![请添加图片描述](https://img-blog.csdnimg.cn/b3a42e4eb0ab463fbb8bae2eac9949ee.gif)

#### 六、案例4：动画状态驱动自由视角，StateDrivenCamera场景

##### 1、场景演示

双击打开`StateDrivenCamera`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2f0d71868a0f4fbf951c7fecfbdd48b2.png)  
这是一个根据主角动画状态切换摄像机机位效果，默认情况下是一个第三人称自由视角，当主角跑起来的时候，会切换到一个固定视角的虚拟相机机位，我们运行，在`Scene`窗口看下这个切换过程，  
![请添加图片描述](https://img-blog.csdnimg.cn/158dca6122ae4253b5489ac6866e1bfc.gif)  
画个图

![在这里插入图片描述](https://img-blog.csdnimg.cn/b6e2a2d6d6a447c497d7a27e6b0255f7.png)

##### 2、组件参数

这个案例我们只需要讲一下`CinemachineStateDrivenCamera`组件，其它的上文已经讲过了。

###### 2.1、CinemachineStateDrivenCamera：状态驱动虚拟相机

###### 2.1.1、父节点：CinemachineStateDrivenCamera

在父节点上挂`CinemachineStateDrivenCamera`组件，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1e28b7403f5a4d4aaefb9012aa59185d.png)

###### 2.1.2、子节点：多个虚拟相机

子节点可以放多个虚拟相机，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0a63f2e2d75e46e7bdca73e49baff2a3.png)

###### 2.1.3、设置Animated Target

因为我们需要根据动画状态来切换不同的虚拟相机，所以需要给`CinemachineStateDrivenCamera`组件指定`Animated Target`，把主角的`Animator`对象赋值给它，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/5e75aa862fc1433ebc0cb216ba104a8b.png)

###### 2.1.4、设置State

我们先看下主角的动画状态机，很简单，只有`Locomotion`和`Sprint`两个动画状态，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f98ceb3cea1d4c0e916eff95b468f6e2.png)  
我们在`CinemachineStateDrivenCamera`组件上分别给这两个动画状态添加要激活的虚拟相机，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/45698e3c0c1c4d74a272b0327aa5aaf1.png)

#### 七、案例5：分镜/切镜，ClearShot场景

`ClearShot`翻译过来是清晰的镜头的意思，就是从多个相机镜头中选择一个画面质量最好的镜头，切换过去，表现上就像分镜的效果。

啥是分镜呢？首先看下百科的概念，

> 分镜(Storyboard) 又叫故事板。是指电影、动画、电视剧、广告、音乐录像带等各种影像媒体，在实际拍摄或绘制之前，以图表的方式来说明影像的构成，将连续画面以一次运镜为单位作分解，并且标注运镜方式、时间长度、对白、特效等。根据媒体不同划分成不同分镜。常见的有影片分镜，漫画分镜。影片分镜用以解说一个场景将如何构成，人物以多大的比例收入镜头成为构图、做出什么动作，摄影机要从哪个角度切入或带出、摄影机本身怎么移动、录映多少时间等。

喜欢看漫画的同学应该不陌生，一个场景中我们架设多个虚拟相机机位，为了做出最好的画面表现，我们需要进行镜头切换，比如下面的漫画，一个格子就像是一个机位拍摄的画面，镜头角度、位置等，什么时候去切换镜头，这些对应到`Cinemachine`中，就是`ClearShot`要做的事情，

![在这里插入图片描述](https://img-blog.csdnimg.cn/fa179b4d0bae459f82919ec16a79e770.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/e12cea35aa2848c1987e51a4995edb19.png)  
`Cinemachine`给我们做了三个场景，我们先运行看下效果。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a07bac07c5774a72ae180ad99aa62fcc.png)

##### 1、场景演示

###### 1.1、ClearShot场景

先双击打开`ClearShot`场景，运行效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/ac7f812e5d18490a9fe8ca70a6da85eb.gif)  
场景中架了三个虚拟相机，如下，根据主角是否被遮挡进行最优切换，

![在这里插入图片描述](https://img-blog.csdnimg.cn/4b60a11d51a04a41931800eaef63df4c.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2ddbb80eebb743b9b100b913b1c23f53.png)

虚拟相机父节点是一个`CinemachineClearShot`，下文会介绍这个组件的参数，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1a62a473765841a1bbb211ad363aa5c2.png)  
画个图  
![在这里插入图片描述](https://img-blog.csdnimg.cn/3517fcf796704b45a7f1260c7a60c9f7.png)

###### 1.2、ClearShot closest场景

先双击打开`ClearShot closest`场景，运行效果如下  
![请添加图片描述](https://img-blog.csdnimg.cn/76c95194a1d4442b87a07482ef6a64b9.gif)  
场景中架了六个虚拟相机，如下，根据与主角的距离进行最优切换，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9e3d86abfffe4b51986f3388a0cd74be.png)

其中`CinemachineClearShot`子节点虚拟相机中嵌了一个`CinemachineBlendListCamera`，下文会介绍这个组件的参数，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/bed731c1c8f647839bf7bf2974278071.png)  
按照惯例画个图  
![在这里插入图片描述](https://img-blog.csdnimg.cn/ee5ff4a16f8f41e981dad8b8bf2675c3.png)

###### 1.2、ClearShot character场景

双击打开`ClearShot character`场景，运行效果如下

![请添加图片描述](https://img-blog.csdnimg.cn/35f91ac5c1ed4379b61d28895db98c2e.gif)  
场景中架设了`5`个虚拟相机  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4a78b2f0f0ea4b7d995e7cc069d6e86f.png)  
其中用到了虚拟相机触发器：`CinemachineTriggerAction`，用于检测主角是否进入触发器区域，然后进行虚拟相机的切换，下文会介绍这个组件的参数，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/9d9f18b7ee824b14967ef1faf069c449.png)  
画个图  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0aa76a73f00449c4a0dcabafd611e5b4.png)

##### 2、组件参数

###### 2.1、CinemachineClearShot：自动选择/切换最适合的摄像头

`CinemachineClearShot`会根据被观察目标的最好画面质量，从子节点中选择一个最合适的虚拟相机。  
至于它是根据什么做出最优选择的，大家可以查看`CinemachineClearShot.cs`源码的`ChooseCurrentCamera`方法，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a6af09066fc843aeb8002056181618cc.png)  
主要是根据虚拟相机的`ShowQuality`和`Priority`两个参数进行评估的，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/59a0ac0740e849bfad72407b93df2146.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/77990b36529941eb9749f070b3c71313.png)  
而`ShowQuality`又是根据相机是否被遮挡、与目标的距离等参数进行评估的。  
如果我们想手动触发虚拟相机的切换，可以通过代码设置虚拟相机的`Priority`参数提高优先级。  
这里我们主要讲一下如何设置`CinemachineClearShot`组件的参数。  
我们只需要在子节点中添加虚拟相机，就会自动在下面的列表中显示出来，我们设置一下`Priority`优先级参数即可，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/47b9c036b8f4497697d85a8f015902c8.png)  
另外，`CinemachineClearShot`本身也有`Follow`和`LookAt`参数，如果子节点的虚拟相机没有设置`Follow`和`LookAt`，则会以`CinemachineClearShot`的为准，否则以子节点虚拟相机的`Follow`和`LookAt`为准，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f31ac38f9a3a4876bbb5a8578cd8ff9a.png)

###### 2.2、CinemachineBlendListCamera：虚拟相机过渡/混合器

在`ClearShot closest`场景中用到了`CinemachineBlendListCamera`，我使用另一个专门的场景来讲解，  
双击打开`BlendListCamera`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/2a4a70d2af654b58a6d9f36b8a064877.png)  
场景中放了两个`CinemachineBlendListCamera`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/163cd87665d143f68881401aed1c4a3b.png)  
我们把默认的虚拟相机禁用，把第一个`CinemachineBlendListCamera`激活，可以看到它底下有两个虚拟相机，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/7d971db54d384b28897629d257599cb5.png)  
`CinemachineBlendListCamera`做的事情就是按照我们设定的顺序进行虚拟相机的过渡，注意，这里会按照我们排的顺序进行过渡，而不会进行像`ClearShot`那样进行画面质量评估，下面这个设置的意思就是先在`CM vcam A`虚拟相机状态停留`0.5`秒，然后用`2`秒时间过渡到`CM vcam B`，过渡的缓动曲线使用`Ease In Out`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/58a36c013bc94a0c94ae13fca5cb98ff.png)  
常用的缓动曲线如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/159098a25a834f13bf11205ceb50169b.png)

我们调整一下两个虚拟相机的位置，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/f241f8a7ca624c57b10697b2d2c478ce.png)  
现在我们运行看看效果，可以看到相机从`CM vcam A`过渡到了`CM vcam B`，  
![请添加图片描述](https://img-blog.csdnimg.cn/95afe34994214b05859f4df2ae4e039a.gif)  
我们还可以让它从`CM vcam B`回到`CM vcam A`，我们添加过渡设置，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/bd13029f51fa4d60bb41b1240e6d8be9.png)  
重新运行，效果如下，可以看到，相机最后又过渡回到了`CM vcam A`，  
![请添加图片描述](https://img-blog.csdnimg.cn/dc49d5b33a18488ca0fca3fbce2fa4d7.gif)  
如果我们想要让这个顺序循环执行，可以勾选`Loop`  
![在这里插入图片描述](https://img-blog.csdnimg.cn/8fc7e50583b944a880b87c89b82c5863.png)

###### 2.3、CinemachineTriggerAction：虚拟相机触发器

插件中的`Trigger volumes`场景可以针对触发器进行测试，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/877347fc7bdf489b91883a2377b880ce.png)  
可以用它来实现虚拟相机的镜头切换，  
![请添加图片描述](https://img-blog.csdnimg.cn/df8015f6fd6942f1816f72e4f3a8b51b.gif)  
也可以用来实现机关触发（比如执行`TimeLine`）

![请添加图片描述](https://img-blog.csdnimg.cn/bb5d5f84202f4d3d8d9433554cacc2e3.gif)  
插件中还有一个`Anywhere Door`（任意门）场景，用的就是`CinemachineTriggerAction`触发器来实现两个`世界`的无缝穿越的，挺有意思的，效果如下

![请添加图片描述](https://img-blog.csdnimg.cn/17cd61c132014b20828ad453a79eb1ea.gif)

下面讲一下`CinemachineTriggerAction`组件的参数设置。

###### 2.3.1、碰撞体勾选Is Trigger

我们可以打开`CinemachineTriggerAction.cs`查看源码，里面其实就是使用`OnTriggerXXX`来检测碰撞，然后执行对应的响应方法，

![在这里插入图片描述](https://img-blog.csdnimg.cn/5aa76b98ca574b6cb5d1cc367c071a3c.png)  
注意使用`CinemachineTriggerAction`的物体上，需要带`Collider`，并且勾选`Is Trigger`，如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/a2e042e7249144049754e9e87059d895.png)

###### 2.3.2、设置过滤

我们可以设定`Layer Mask`、`With Tag`和`Without Tag`进行过滤，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/96533913b6d1494298a49df9fb75e038.png)  
只有通过过滤器的检测才能触发逻辑，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0a63ed72918f458faa9d106a78d8f220.png)

###### 2.3.3、设置Skip First

`Skip First`可以用来跳过前面`N`此的触发，比如第一次进入时不想触发逻辑，则可以把`Skip First`设置为`1`，如果想要每次都触发，则把`Skip First`设置为`0`，并勾选`Repeating`，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/0facfb276fac4a529e610ada7d526422.png)  
`Skip First`逻辑如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/67617a904ba24601a10bd66215a596a9.png)

###### 2.3.4、设置On Object Enter响应

进入触发器，触发响应逻辑，我们可以设置要执行的行为，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/da8bdc42dd934152a3d29d95375eab62.png)  
支持的行为如下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/c99065636c1f4f288dda117ed1628f18.png)

|响应行为|说明|
|---|---|
|Custom|自定义，使用组件里的`Event()`自定义触发函数|
|Priority Boost|增加目标虚拟相机的优先级，并把虚拟相机推入优先队列顶部|
|Activate|激活虚拟相机，并把虚拟相机推入优先队列顶部|
|Deactive|禁用目标物体，即执行SetActive(false)|
|Enable|激活目标组件，即设置组件的 enabled 为 true|
|Disable|禁用目标组件，即设置组件的 enabled 为 false|
|Play|播放Timeline|
|Stop|停止Timeline|

同理，物体离开触发器会触发`On Object Exit`，我们也可以设置对应的响应行为，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4d4a20b4df17495e85918ecd53a03b46.png)

#### 八、案例6：多目标追踪，Dolly Group场景

##### 1、场景演示

双击打开`Dolly Group`场景，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/81449c033db14e5898ff02e222ae1359.png)  
运行效果如下

![请添加图片描述](https://img-blog.csdnimg.cn/c52a9ae1be03442a9165c8a73f566d43.gif)

##### 2、组件参数

这个场景使用了一个`Timeline`来控制虚拟相机的移动，虚拟相机`LookAt`的目标是一个`TargetGroup`物体，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/707170134f0f4ea1a6988118328c9dd2.png)

这个`TargetGroup`物体上挂着`CinemachineTargetGrouop`组件，通过它可以实现虚拟相机同时追踪多个物体的效果（原理是动态调整相机的`Field Of View`来确保多个物体都在画面以内），参数比较简单，主要是设置多个对象物体到列表中即可，  
![在这里插入图片描述](https://img-blog.csdnimg.cn/df277b2d02fa49b9842c452019c57523.png)

#### 九、其他案例

我感觉我写得太详细了，不知不觉本文内容已经非常长了，再写下去感觉没有同学能耐心看完了，其他场景案例我这里就不挨个讲解了，大家可以自己玩玩看。

###### 1、打BOSS视角：BossCam场景

![请添加图片描述](https://img-blog.csdnimg.cn/1a449090a9c641829b6f1e85bc2cd5b7.gif)

###### 2、双重目标：DualTarget场景

![请添加图片描述](https://img-blog.csdnimg.cn/e328d217697e45f4b680ff7f2ac319f0.gif)

###### 3、近物透明，FadeOutNearbyObjects场景

![请添加图片描述](https://img-blog.csdnimg.cn/bf0cc64223494086a0100d8729f0d3ae.gif)

###### 4、第三人称瞄准，3rdPersonWithAimMode场景

![请添加图片描述](https://img-blog.csdnimg.cn/ae53fe7061fb4d6bbd1c1fd2ec4a9cbe.gif)

###### 5、镜头震动，Impulse场景

![请添加图片描述](https://img-blog.csdnimg.cn/5146a01b4fcd452f84b4bcaaadb78a64.gif)

#### 十、完毕

好了，不写了不写了，先到这里吧~  
我是林新发，[https://blog.csdn.net/linxinfa](https://blog.csdn.net/linxinfa)  
一个在小公司默默奋斗的`Unity`开发者，希望可以帮助更多想学`Unity`的人，共勉~