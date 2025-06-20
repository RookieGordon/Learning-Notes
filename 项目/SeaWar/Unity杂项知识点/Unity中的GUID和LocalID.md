---
tags:
  - SeaWar/Unity杂项知识点/Unity中的GUID和LocalID
  - mytodo
  - Unity/编辑器/GUID
  - Unity/编辑器/LocalID
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/Unity杂项知识点
dateStart: 2025-06-20
dateFinish: 2025-06-20
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
在Unity中，**GUID（全局唯一标识符）** 和 **Local ID（局部标识符）** 是资源引用系统的核心机制，它们共同确保了资源引用的准确性和稳定性。下面详细分析它们的作用及协作原理：
## **1. GUID（全局唯一标识符）**
- **作用**：
    - GUID 是每个资源文件（如材质、纹理、预制体）的**全局唯一身份证**。
    - 当资源导入项目时，Unity 自动生成一个128位的唯一字符串（如`a4f3b8c1d9e02b7f6a5c4d3e`），存储在对应资源的`.meta`文件中。
    - **核心价值**：即使资源被移动或重命名，GUID 保持不变，确保引用不丢失。
- **资源引用中的角色**：  
    GUID 用于在**不同资源之间**建立引用关系。例如：
    - 当材质A引用纹理B时，材质A的序列化数据中会记录纹理B的GUID。
## **2. Local ID（局部标识符）**
- **作用**：
    - Local ID 是**同一文件内子对象（如GameObject、组件）的唯一整数标识**。
    - 每个文件（如预制体、场景）内部维护自己的Local ID列表（从0开始递增）。
    - **核心价值**：解决文件内部对象间的引用问题，避免全局唯一ID的开销。
- **资源引用中的角色**：  
    Local ID 用于标识**文件内部的对象**。例如：
    - 预制体中，子物体Player的Local ID=1，子物体Weapon的Local ID=2。
    - 若Player引用Weapon，则Player的脚本中会记录Weapon的Local ID。
## **3. 二者协作机制：资源引用示例分析**
### **场景示例**
假设有以下资源：
- **纹理资源** `hero_texture.png` → GUID: `tex_guid`
- **材质资源** `hero_mat.mat` → GUID: `mat_guid`
- **预制体** `hero_prefab.prefab` → GUID: `prefab_guid`
    - 包含子物体：    
        - `Body` (Local ID=1)    
        - `Weapon` (Local ID=2)
### **引用关系分析**
1. **材质引用纹理**：
    - `hero_mat.mat` 通过**GUID**引用`hero_texture.png`：
```yaml
MaterialData:
          TextureRef: GUID=tex_guid  # 指向纹理
```
2. **预制体引用材质**：
    - `hero_prefab.prefab` 的`Body`子物体挂载Renderer组件，该组件通过**GUID**引用材质：
```yaml
PrefabData:
  GameObject "Body" (LocalID=1):
    Renderer:
      MaterialRef: GUID=mat_guid  # 指向材质
```
3. **预制体内部子物体相互引用**：
    - `Body`上的脚本需引用同预制体的`Weapon`子物体：
```yaml
PrefabData:
  GameObject "Body" (LocalID=1):
    ScriptComponent:
      TargetWeaponRef: 
        FileID: 0          # 0表示当前文件
        PathID: 2           # Weapon的Local ID
```
        - **FileID=0**：表示引用目标在**同一文件内**（即`hero_prefab.prefab`）。        
        - **PathID=2**：指向`Weapon`的Local ID。
## **4. 关键协作原理**
1. **跨资源引用（GUID主导）**：
    - 引用外部资源（如材质引用纹理） → **仅需GUID**。
    - Unity通过GUID在项目中定位资源文件。
2. **文件内部引用（Local ID主导）**：
    - 引用同一文件内的对象 → **GUID + Local ID**。
    - 格式：`{GUID of prefab, Local ID}`。
    - 例如：`(prefab_guid, 2)` 指向`hero_prefab.prefab`中的`Weapon`。
3. **反序列化流程**：  
    当加载`hero_prefab.prefab`时：
    - Step 1: 通过`prefab_guid`定位预制体文件。
    - Step 2: 解析内部对象（Local ID=1为Body，Local ID=2为Weapon）。
    - Step 3: 发现Body的材质引用`mat_guid` → 加载材质资源。
    - Step 4: 材质资源通过`tex_guid`加载纹理。
# 参考

```cardlink
url: https://www.cnblogs.com/CodeGize/p/8697227.html
title: "Unity文件、文件引用、meta详解 - CodeGize - 博客园"
description: "Tag：Unity文件,Unity文件引用,Meta文件,GUID,FileID,LocalID 本文介绍unity工程中的文件类型，文件引用原理和meta文件的yaml结构等 参考文档： Assets, Objects and serialization Description of the Fo"
host: www.cnblogs.com
favicon: https://assets.cnblogs.com/favicon_v3_2.ico
```




