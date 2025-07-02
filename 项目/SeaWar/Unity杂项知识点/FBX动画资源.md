---
tags:
  - SeaWar/Unity杂项知识点/FBX动画资源
  - mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/Unity杂项知识点
dateStart: 2025-07-02
dateFinish: 2025-07-02
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
# FBX中的Avatar
Unity中的Avatar，是Unity提供的骨骼复用系统。
只要你是人型的角色，就会识别，并根据角色原本的骨骼及命名，创建对应的Avatar。那么只需要大家的骨骼都转换成这种模式，我们就可以实现动画复用了。
一般说，将Rig中的Animation Type切换成人形，就可以启用Avatar了。
# Avatar的使用时机

**对于 Generic 动画类型**，  如果你将模型的动画类型设置为 **Generic**，那么即使没有 Avatar，动画也能在**这个特定的模型**上正常播放。Unity 会直接使用 FBX 文件中包含的骨骼和动画数据。
**对于 Humanoid 动画类型**， 如果你将模型的动画类型设置为 **Humanoid**，那么**必须**有一个有效的 Avatar。没有 Avatar 或 Avatar 配置错误，Humanoid 动画将无法播放或播放异常。
**总结：**
- **不导出/不使用 Avatar (Generic 类型)：** 动画**可以**在**原始模型**上正常使用，但**不能**进行骨骼重定向到其他模型，也无法使用 Humanoid 特有的高级功能（IK, 肌肉限制等）。适用于非人形物体或不需要共享动画的特定角色。
- **使用 Avatar (Humanoid 类型)：** 对于人形角色**是必须的**。它解锁了强大的**动画重定向能力**、提供了**骨骼抽象层**以简化动画系统和脚本、并启用了 **IK 等高级 Humanoid 功能**。这是处理人形角色动画的标准和推荐方式。
# Avatar的作用
Avatar 在 Unity 的 Mecanim 动画系统中扮演着至关重要的角色，尤其是在处理 **Humanoid（人形）** 动画时。它的主要作用有：
- **骨骼重定向：** 这是 Avatar 最核心、最强大的功能。它定义了模型骨骼结构与 Unity 内部标准人形骨骼结构之间的映射关系。
    - 这使得你可以将为一个角色（A）制作的动画**应用到另一个骨骼结构不同但同为“人形”的角色（B）** 上。Unity 会根据两个角色的 Avatar 映射关系，自动调整动画数据以适应新的骨骼结构。这对于角色换装、使用不同来源的角色资产或共享动画库极其重要。
    - **如果没有 Avatar（即 Generic 类型），动画只能严格地应用于创建它的原始骨骼结构模型。** 不能在不同模型之间共享（除非它们骨骼结构完全一致）。
- **提供统一的抽象层：** 无论实际模型使用的骨骼命名是什么（如 `Bip001 L UpperArm`, `mixamorig:LeftArm`, `Arm_L`），Avatar 将其统一映射到 Unity 的标准骨骼名称（如 `LeftUpperArm`）。这使得动画状态机、混合树、动画层和脚本（如 `Animator.GetBoneTransform`）可以用统一的方式引用骨骼，而不需要关心具体模型的骨骼命名。这极大地提高了工作流的可维护性和复用性。
- **启用高级 Humanoid 功能：**
    - **逆向动力学：** 支持基于物理的脚部落地、手部抓握等效果。
    - **肌肉定义与限制：** 可以定义骨骼旋转的生理学限制（肌肉范围），使动画混合和重定向结果更自然，避免骨骼扭曲到不合理的角度。
    - **人形动画优化：** Unity 引擎可以对基于 Avatar 的 Humanoid 动画进行特定优化。
    - **Retargeting 质量设置：** 控制动画重定向时的精度和方式。
- **简化动画状态机设计：** 因为骨骼被抽象化了，为一个 Humanoid 角色设计的动画状态机和控制器，理论上可以复用到任何其他配置了有效 Avatar 的 Humanoid 角色上，只要它们需要相同的行为逻辑。