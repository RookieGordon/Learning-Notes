---
tags:
  - AI/Unity/动画性能优化
---
# Unity中，简单的，低面数的骨骼动画是否可以采用动态合批进行性能优化，比如场景中同时实例化20个相同的模型进行动画播放？
在Unity中，**动态合批（Dynamic Batching）对骨骼动画（Skinned Mesh Renderer）的支持非常有限**，但针对低面数模型的优化仍有其他可行方案。以下是详细技术分析和解决方案：
## **一、动态合批的限制**

1. **不适用于Skinned Mesh Renderer**  
    Unity的动态合批主要针对静态Mesh Renderer，而骨骼动画使用的Skinned Mesh Renderer由于每帧骨骼矩阵变化，无法被动态合批自动合并。
    
2. **顶点数限制**  
    即使是非骨骼模型，动态合批要求单个网格顶点属性不超过900个（如Position+Normal+UV），低面数模型虽可能满足，但骨骼动画仍会被排除。
## **二、优化方案**
### **1. GPU Instancing（推荐方案）**
- **原理**  
    通过一次Draw Call渲染多个相同网格，支持每实例的骨骼矩阵传递，显著减少Draw Call。
- **实现步骤**：
    1. **启用GPU Instancing**  
        在材质中勾选 `Enable GPU Instancing`。
    2. **Shader修改**  
        使用支持骨骼动画的Instancing Shader，例如：
```c
#pragma multi_compile_instancing
#pragma instancing_options assumeuniformscaling maxcount:50 // 调整最大实例数

struct appdata {
    float4 vertex : POSITION;
    float2 uv : TEXCOORD0;
    float4 boneWeights : WEIGHTS;
    uint4 boneIndices : BONES;
    UNITY_VERTEX_INPUT_INSTANCE_ID // 关键：添加实例ID
};

v2f vert(appdata v, uint instanceID : SV_InstanceID) {
    UNITY_SETUP_INSTANCE_ID(v);
    // 从实例化的缓冲中读取骨骼矩阵
    float4x4 boneMatrix = _BoneMatricesBuffer[instanceID][v.boneIndices.x];
    // 应用骨骼变换...
}
```
    3. **脚本传递骨骼数据**  
        通过`MaterialPropertyBlock`或ComputeBuffer传递每实例的骨骼矩阵。
- **注意事项**
    - 需要Unity 2018+版本。
    - 需自行处理骨骼数据的每实例更新。
### **2. 手动合并网格（静态合批变体）**
- **原理**  
    将多个Skinned Mesh合并为单个网格，通过Shader控制动画逻辑。
- **实现步骤**：
    1. **导出静态网格**  
        在动画某一帧导出网格（如T-Pose）。
    2. **合并网格**  
        使用`Mesh.CombineMeshes`合并多个实例的网格。
    3. **自定义动画逻辑**  
        在Shader中通过顶点位移模拟动画（需预计算动画数据）。
- **优缺点**
    - ✅ 合并后可使用静态合批。
    - ❌ 动画效果受限，适用于简单循环动画（如草摆动）。
### **3. 优化动画组件**
- **Culling策略**  
    设置`Animator.cullingMode`为`CullUpdateTransforms`或`CullCompletely`，远离相机时跳过动画计算。
- **简化层级**  
    减少骨骼数量，合并不影响视觉效果的骨骼节点。
## **总结**

| 方法             | Draw Call优化 | 实现复杂度 | 适用范围      |
| -------------- | ----------- | ----- | --------- |
| GPU Instancing | ★★★★★       | 高     | 相同材质、大量实例 |
| 手动合并网格         | ★★★★☆       | 中     | 简单重复动画    |
| 优化动画组件         | ★★☆☆☆       | 低     | 通用        |
| 对象池化           | ☆☆☆☆☆       | 低     | 减少GC开销    |

**推荐组合方案**：GPU Instancing + 对象池化 + Animator Culling，可在保证动画效果的前提下最大化性能。
# 有两点疑问：1、为什么动态合批只能针对静态Mesh？2、GPU Instancing为什么需自行处理骨骼数据的每实例更新，在哪里处理骨骼数据更新，骨骼数据不是应该在动画中就有吗？
## **一、为什么动态合批只能针对静态Mesh？**
动态合批（Dynamic Batching）的核心原理是通过合并多个**顶点数据在运行时不变**的网格，从而减少Draw Call。其限制主要源于以下原因：
### **1. 顶点数据必须静态**
动态合批在每帧渲染前会检查网格的顶点数据（位置、法线、UV等）是否发生变化。
- **静态Mesh Renderer**：顶点数据在初始化后保持不变，满足动态合批的条件。
- **Skinned Mesh Renderer**：由于骨骼动画每帧通过骨骼矩阵（Bone Matrices）驱动顶点位置变化，导致顶点数据动态变化，**无法被合批**。
### **2. 合批的底层实现限制**
动态合批的合并操作发生在CPU端，需要将多个网格的顶点数据拷贝到同一个顶点缓冲区。
- **骨骼动画的复杂性**：Skinned Mesh的顶点位置由骨骼矩阵实时计算（通常在GPU端完成），CPU无法直接访问修改后的顶点数据，因此无法合并。
### **3. 顶点属性数量限制**
即使不考虑骨骼动画，动态合批要求单个网格的顶点属性总数不超过900个（例如：顶点坐标+法线+UV=3+3+2=8个属性，最多支持112个顶点）。
- **低面数模型**：虽然可能满足顶点数限制，但Skinned Mesh Renderer仍会被排除在外。
## **二、GPU Instancing为什么需自行处理骨骼数据的每实例更新？**
GPU Instancing的核心是**通过一次Draw Call渲染多个实例**，每个实例可以有不同的属性（如位置、颜色、骨骼矩阵等）。其关键问题在于：
### **1. 骨骼数据的传递机制**
- **常规骨骼动画流程**：  
    Unity的Skinned Mesh Renderer在每帧通过`Animator`或`Animation`组件计算骨骼矩阵，并将这些矩阵传递到Shader的`UNITY_MATRIX_PALETTE`（骨骼矩阵数组）中。  
    **但这一过程是全局的**，所有实例共享同一组骨骼矩阵，无法区分不同实例的动画状态。
- **GPU Instancing的要求**：  
    每个实例需要独立的骨骼矩阵数据。例如：20个角色实例可能播放不同的动画帧，或处于不同的位置，因此需要为每个实例单独传递骨骼矩阵。
### **2. 如何传递每实例骨骼数据？**
需要在Shader和脚本中显式处理以下步骤：
#### **(1) Shader中定义骨骼矩阵的实例化存储**
在Shader中声明一个支持实例化的骨骼矩阵缓冲区（例如使用`StructuredBuffer`）：
```c
// 在CGINCLUDE或Shader顶部定义
#if defined(UNITY_INSTANCING_ENABLED)
StructuredBuffer<float4x4> _BoneMatricesBuffer; // 每个实例的骨骼矩阵数组
#endif
```
#### **(2) 脚本中更新每实例的骨骼数据**

通过以下两种方式传递数据：
- **方法1：MaterialPropertyBlock + ComputeBuffer**
    1. **在C#中计算骨骼矩阵**：  
        使用`SkinnedMeshRenderer.BakeMesh`在每帧获取当前实例的顶点数据（需在CPU端计算骨骼动画）。
	```C#
	Mesh bakedMesh = new Mesh();
	skinnedRenderer.BakeMesh(bakedMesh);
	Matrix4x4[] boneMatrices = skinnedRenderer.bones.Select(b => b.localToWorldMatrix).ToArray();
	```
    2. **将骨骼矩阵存入ComputeBuffer**：
	```C#
	ComputeBuffer boneMatrixBuffer = new ComputeBuffer(boneMatrices.Length, sizeof(float) * 16);
	boneMatrixBuffer.SetData(boneMatrices);
	MaterialPropertyBlock props = new MaterialPropertyBlock();
	props.SetBuffer("_BoneMatricesBuffer", boneMatrixBuffer);
	meshRenderer.SetPropertyBlock(props);
	```
    3. **释放Buffer**：  
        在对象销毁时释放资源，避免内存泄漏：
	```C#
	boneMatrixBuffer.Release();
	```
- **方法2：自定义动画系统（性能更高）**  
    直接通过脚本控制骨骼变换，跳过`Animator`组件，例如：
	```C#
	// 在Update中手动更新骨骼矩阵
	void Update() {
	    foreach (var instance in instances) {
	        Matrix4x4[] bones = instance.CalculateBoneMatrices();
	        Graphics.SetRandomWriteTarget(1, instance.boneMatrixBuffer); // 写入GPU Buffer
	    }
	}
	```
### **3. 为什么骨骼数据需要手动更新？**
- **Unity的默认动画系统不兼容Instancing**：  
    `Animator`组件和Skinned Mesh Renderer的设计目标是单实例动画，无法直接为每个实例生成独立的骨骼矩阵。
- **Instancing需要显式数据分离**：  
    GPU Instancing的核心理念是“数据驱动”，开发者需明确指定每个实例的独立属性，包括骨骼矩阵。
## **三、优化示例：基于GPU Instancing的骨骼动画**
### **实现步骤**
1. **创建Instancing Shader**  
    修改支持骨骼动画的Shader，添加实例化ID和骨骼矩阵缓冲区：
	```c
	struct appdata {
	    float4 vertex : POSITION;
	    float2 uv : TEXCOORD0;
	    float4 boneWeights : WEIGHTS;
	    uint4 boneIndices : BONES;
	    UNITY_VERTEX_INPUT_INSTANCE_ID // 实例ID
	};
	
	v2f vert(appdata v) {
	    UNITY_SETUP_INSTANCE_ID(v);
	    int instanceID = unity_InstanceID;
	    // 从_BoneMatricesBuffer中读取当前实例的骨骼矩阵
	    float4x4 bone0 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.x]; // 假设每实例64个骨骼
	    float4x4 bone1 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.y];
	    // 混合骨骼权重...
	}
	```
2. **脚本中管理骨骼矩阵**
```C#
public class InstancedSkinnedRenderer : MonoBehaviour {
    public SkinnedMeshRenderer skinnedMeshRenderer;
    private ComputeBuffer boneMatrixBuffer;
    private MaterialPropertyBlock props;

    void Start() {
        // 初始化ComputeBuffer（假设每个实例最多64个骨骼）
        boneMatrixBuffer = new ComputeBuffer(64 * instanceCount, 64); 
        props = new MaterialPropertyBlock();
        skinnedMeshRenderer.GetPropertyBlock(props);
        props.SetBuffer("_BoneMatricesBuffer", boneMatrixBuffer);
        skinnedMeshRenderer.SetPropertyBlock(props);
    }

    void Update() {
        // 每帧更新骨骼矩阵
        Matrix4x4[] matrices = new Matrix4x4[64];
        for (int i=0; i<instanceCount; i++) {
            // 假设GetBoneMatricesForInstance(i)返回当前实例的骨骼矩阵
            matrices = GetBoneMatricesForInstance(i); 
            boneMatrixBuffer.SetData(matrices, 0, i*64, 64);
        }
    }
}
```
3. **性能权衡**
    - **优点**：Draw Call从20次降为1次。
    - **代价**：需在CPU端计算骨骼矩阵（若动画复杂可能抵消性能收益）。
## **四、总结**

|问题|原因|解决方案|
|---|---|---|
|动态合批不适用于骨骼动画|顶点数据动态变化，CPU无法合并|改用GPU Instancing或静态合并|
|GPU Instancing需手动更新骨骼数据|Unity默认动画系统不支持实例化，需显式分离每实例数据|通过ComputeBuffer或MaterialPropertyBlock传递骨骼矩阵，并修改Shader逻辑|

**关键结论**：
- **动态合批的静态限制**源于其设计原理，无法绕过。
- **GPU Instancing的灵活性**需要开发者手动管理数据流，但能实现极致的性能优化。
- **推荐工具**：使用Unity的ECS + Jobs System或第三方插件（如GPU Animation）简化开发流程。