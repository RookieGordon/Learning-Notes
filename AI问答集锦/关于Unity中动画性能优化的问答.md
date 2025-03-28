---
tags:
  - AI/Unity/动画性能优化
sourceLink: https://chat.deepseek.com/a/chat/s/aa1fb74b-c963-40ec-8095-46ab4794f043
banner: AI
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
# 使用GPU Instancing来进行动画优化的方案有哪些？方案的具体实施流程是怎么样的？有何优缺点？
## **一、GPU蒙皮与骨骼矩阵传递**
### **实施流程**
1. **修改Shader支持骨骼动画**
    - 在Shader中定义骨骼矩阵的`StructuredBuffer`，通过`UNITY_INSTANCE_ID`索引每实例的骨骼数据。        
    - 示例代码：
	```C
	StructuredBuffer<float4x4> _BoneMatricesBuffer;
	v2f vert(appdata v) {
	    UNITY_SETUP_INSTANCE_ID(v);
	    int instanceID = unity_InstanceID;
	    float4x4 boneMatrix = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.x];
	    // 应用骨骼变换...
	}
	```
2. **脚本传递骨骼数据**
    - 使用`ComputeBuffer`或`MaterialPropertyBlock`传递每实例的骨骼矩阵：
	```C#
	ComputeBuffer boneBuffer = new ComputeBuffer(boneCount * instanceCount, 64);
	boneBuffer.SetData(boneMatrices);
	MaterialPropertyBlock props = new MaterialPropertyBlock();
	props.SetBuffer("_BoneMatricesBuffer", boneBuffer);
	renderer.SetPropertyBlock(props);
	```
3. **动画数据更新**
    - 每帧通过`SkinnedMeshRenderer.BakeMesh`获取当前骨骼矩阵，或手动计算后更新至GPU。
### **优点**
- **显著减少Draw Call**：单次Draw Call可渲染数百个实例。
- **CPU负载低**：骨骼计算部分转移到GPU，减少CPU压力10。
### **缺点**
- **实现复杂**：需手动处理骨骼数据同步，Shader需定制化。
- **内存消耗高**：骨骼矩阵数据可能占用较大显存，尤其骨骼数量多时3。
## **二、预生成动画纹理（Animation Texture）**10
### **实施流程**
1. **离线生成动画纹理**
    - 将角色动画的骨骼矩阵序列烘焙到纹理（如RGBAHalf格式），每像素存储一个矩阵分量。
    - 示例：50骨骼的动画帧占用50x4x帧数像素。
2. **运行时采样动画纹理**
    - 在Shader中根据当前动画时间和实例ID采样纹理，获取骨骼矩阵：
	```C
	float4 boneData = tex2Dlod(_AnimationTex, float4(uv, 0, 0));
	```
3. **结合GPU Instancing**
    - 使用`Graphics.DrawMeshInstanced`批量提交实例数据，并通过`MaterialPropertyBlock`传递动画参数（如帧索引）。
### **优点**
- **极致性能**：动画计算完全在GPU完成，适合大规模同屏角色。
- **支持复杂动画**：可预烘焙多种动作序列10。
### **缺点**
- **内存占用高**：动画纹理可能占用数百MB。
- **灵活性差**：无法支持动态动画（如物理交互、IK）10。
## **三、粒子系统GPU Instancing**
### **实施流程**
1. **启用粒子系统实例化**
    - 在粒子系统Renderer模块勾选“Enable GPU Instancing”。
    - 使用内置`Particles/Standard Surface`着色器或自定义Shader。
2. **自定义粒子着色器**
    - 在Shader中声明实例化属性（如速度、颜色）：
	```C
	#pragma instancing_options procedural:vertInstancingSetup
	#include "UnityStandardParticleInstancing.cginc"
	```
3. **处理动态属性**
    - 通过`MaterialPropertyBlock`传递粒子属性（如生命周期、大小）。
### **优点**
- **高效渲染网格粒子**：适合火焰、烟雾等动态效果。
- **兼容Unity原生系统**：无需深度定制4。
### **缺点**
- **功能受限**：仅支持简单粒子动画，无法处理骨骼层级关系。
- **光源限制**：默认仅支持单点光源，需切换至延迟渲染路径11。
## **四、2D精灵动画实例化**
### **实施流程**
1. **替换SpriteRenderer为MeshRenderer**
    - 使用Quad网格代替Sprite的默认Mesh，统一顶点结构。  
2. **动态UV与缩放计算**
    - 在Shader中根据精灵图集位置动态计算UV偏移：
	```C
	half4 pivot = UNITY_ACCESS_INSTANCED_PROP(Props, _Pivot);
	o.uv.xy = (uv.xy * pivot.xy) + pivot.zw;
	```
3. **合并贴图至TextureArray**
    - 运行时动态生成Texture2DArray，通过`Graphics.CopyTexture`合并多张精灵图。
### **优点**
- **Draw Call极低**：全屏2D角色可合并至单次Draw Call。
- **兼容动态图集**：支持运行时动态加载精灵6。
### **缺点**
- **UV计算复杂**：需处理不同尺寸精灵的缩放和偏移。
- **内存管理难度高**：动态图集分配需高效算法支持6。
## **五、ECS + GPU Instancing**
#### **实施流程**
1. **使用Unity ECS架构**
    - 将动画角色转换为Entity，通过`IComponentData`存储实例属性（如位置、动画帧）。
2. **并行计算骨骼矩阵**
    - 利用Burst+Job System多线程计算骨骼变换，结果写入`NativeArray`。   
3. **批量提交至GPU**
    - 通过`Graphics.RenderMeshInstanced`或`ComputeBuffer`提交数据。
### **优点**
- **极致性能**：适合万人同屏场景，CPU利用率接近100%。
- **高扩展性**：支持LOD、视锥剔除等高级特性10。
### **缺点**
- **开发门槛高**：需掌握ECS、Job System等高级技术。
- **兼容性差**：部分动画功能（如动画过渡）需自行实现10。
## **总结与选型建议**

|方案|适用场景|性能提升|实现复杂度|
|---|---|---|---|
|GPU蒙皮+骨骼矩阵|3D角色动画（僵尸群、NPC）|★★★★☆|高|
|预生成动画纹理|固定动画序列（人群循环）|★★★★★|中|
|粒子系统实例化|特效类动画（火焰、烟雾）|★★★☆☆|低|
|2D精灵实例化|2D游戏角色（战棋、像素风）|★★★★☆|中|
|ECS+GPU Instancing|超大规模场景（MMO、RTS）|★★★★★|极高|

**关键注意事项**：
1. **版本兼容性**：部分方案需Unity 2018+或URP/HDRP渲染管线49。
2. **平台限制**：移动端需确保支持OpenGL ES 3.0+或Metal10。
3. **调试工具**：使用Frame Debugger和Profiler验证实例化效果711。
# 详细描述一下方案1和方案2的实现思路，具体的实现流程，关键技术点
## **方案1：GPU蒙皮与骨骼矩阵传递**
### **核心思想**
通过GPU Instancing批量渲染多个骨骼动画角色，将每实例的骨骼矩阵数据通过ComputeBuffer传递至Shader，在GPU端完成顶点蒙皮计算，从而减少CPU与GPU间的数据交互和Draw Call数量。 ^2d5863
### **实现流程**
#### **1. 模型与动画准备**
- 确保角色使用**Skinned Mesh Renderer**且骨骼层级已优化（合并冗余骨骼）。
- 导出角色T-Pose的静态网格（用于合并顶点数据）。
#### **2. Shader改造**
**关键技术点**：在Shader中声明骨骼矩阵的实例化缓冲区，并基于实例ID索引数据。
```C
// 声明支持实例化的骨骼矩阵缓冲区（每个实例的骨骼矩阵数组）
StructuredBuffer<float4x4> _BoneMatricesBuffer; 
#pragma multi_compile_instancing

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

    // 获取当前实例的骨骼矩阵（假设每实例64骨骼）
    float4x4 bone0 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.x];
    float4x4 bone1 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.y];
    float4x4 bone2 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.z];
    float4x4 bone3 = _BoneMatricesBuffer[instanceID * 64 + v.boneIndices.w];

    // 混合骨骼权重
    float4x4 skinMatrix = 
        bone0 * v.boneWeights.x +
        bone1 * v.boneWeights.y +
        bone2 * v.boneWeights.z +
        bone3 * v.boneWeights.w;

    // 应用蒙皮变换
    float4 pos = mul(skinMatrix, v.vertex);
    o.pos = UnityObjectToClipPos(pos);
    return o;
}
```
#### **3. 骨骼矩阵数据传递**
**关键技术点**：在C#脚本中提取骨骼矩阵，通过`ComputeBuffer`传递给Shader。
```C#
public class InstancedSkinning : MonoBehaviour {
    public SkinnedMeshRenderer skinnedMeshRenderer;
    private ComputeBuffer boneBuffer;
    public int instanceCount = 100;

    void Start() {
        // 初始化骨骼矩阵缓冲区（假设每个实例64个骨骼，100个实例）
        boneBuffer = new ComputeBuffer(64 * instanceCount, 64); // 64字节（一个float4x4）
        skinnedMeshRenderer.material.SetBuffer("_BoneMatricesBuffer", boneBuffer);
    }

    void Update() {
        // 每帧更新骨骼矩阵
        Matrix4x4[] bones = new Matrix4x4[64];
        for (int instanceID = 0; instanceID < instanceCount; instanceID++) {
            // 获取当前实例的骨骼矩阵（需自定义逻辑）
            bones = GetBoneMatricesForInstance(instanceID); 
            // 将数据写入缓冲区偏移位置
            boneBuffer.SetData(bones, 0, instanceID * 64, 64);
        }
    }
}
```
#### **4. 动画数据提取**
**关键技术点**：从`SkinnedMeshRenderer`中提取骨骼矩阵。
- **方法1：BakeMesh**  
    通过`SkinnedMeshRenderer.BakeMesh`将当前骨骼影响的顶点数据烘焙到Mesh，再反向计算骨骼矩阵（需复杂数学推导）。
- **方法2：直接访问骨骼Transform**  
    手动遍历骨骼层级，计算每根骨骼的`localToWorldMatrix`：
    ```C#
    Matrix4x4[] GetBoneMatrices(SkinnedMeshRenderer renderer) {
        Matrix4x4[] matrices = new Matrix4x4[renderer.bones.Length];
        for (int i = 0; i < renderer.bones.Length; i++) {
            matrices[i] = renderer.bones[i].localToWorldMatrix;
        }
        return matrices;
    }
    ```
#### **4. 批量渲染**
使用`Graphics.DrawMeshInstanced`或`CommandBuffer`批量提交渲染指令：
```C#
Mesh staticMesh = GetStaticMeshFromSkinnedRenderer();
Material instancedMaterial = skinnedRenderer.material;
Matrix4x4[] matrices = GenerateInstanceTransforms(); // 实例的Transform矩阵
Graphics.DrawMeshInstanced(staticMesh, 0, instancedMaterial, matrices);
```
---
### **关键技术点总结**
1. **骨骼矩阵压缩**
    - 将骨骼矩阵从`Matrix4x4`压缩为`float3x4`，减少显存占用（从64字节/矩阵降至48字节）。
2. **实例化ID的分段管理**
    - 若单次Draw Call实例数超过GPU限制（通常1023），需分段提交数据：
	```C#
	for (int i=0; i<totalInstances; i+=1023) {
	    int batchSize = Mathf.Min(1023, totalInstances - i);
	    Graphics.DrawMeshInstanced(mesh, 0, material, matrices, batchSize);
	}
	```
3. **避免CPU端骨骼计算**
    - 若使用`SkinnedMeshRenderer.BakeMesh`，需在CPU端计算骨骼，可能导致性能瓶颈。
    - **替代方案**：将动画逻辑移至GPU（如通过顶点纹理或ComputeShader）。
### **方案1优缺点**

|**优点**|**缺点**|
|---|---|
|大幅减少Draw Call（20→1）|需手动管理骨骼矩阵，开发复杂度高|
|支持动态动画（如实时物理、IK）|内存占用高（每实例骨骼矩阵数据量大）|
|兼容复杂骨骼层级|移动端需验证ComputeBuffer性能|

## **方案2：预生成动画纹理（Animation Texture Baking）**
### **核心思想**
将动画的骨骼矩阵序列 **离线烘焙到纹理**，运行时通过 **采样纹理** 获取骨骼矩阵，结合GPU Instancing批量渲染。
### **实现流程**
#### **1. 离线烘焙动画纹理**
**关键技术点**：将骨骼矩阵编码为纹理像素（RGBA32/RGBAHalf格式）。
```C#
// 示例：将50根骨骼的100帧动画烘焙到纹理
Texture2D BakeAnimationToTexture(AnimationClip clip, int boneCount, int frameRate) {
    int width = boneCount * 4; // 每骨骼4行矩阵
    int height = Mathf.CeilToInt(clip.length * frameRate);  // frameRate采样频率
    Texture2D tex = new Texture2D(width, height, TextureFormat.RGBAHalf, false);

    for (int frame = 0; frame < height; frame++) {
        clip.SampleAnimation(gameObject, frame / frameRate);
        Matrix4x4[] bones = skinnedRenderer.bones.Select(b => b.localToWorldMatrix).ToArray();
        for (int bone = 0; bone < boneCount; bone++) {
		    Matrix4x4 matrix = bones[b];
            // 将矩阵的每一行写入纹理
            tex.SetPixel(bone*4 + 0, frame, MatrixToColor(matrix.GetRow(0)));
            tex.SetPixel(bone*4 + 1, frame, MatrixToColor(matrix.GetRow(1)));
            tex.SetPixel(bone*4 + 2, frame, MatrixToColor(matrix.GetRow(2)));
        }
    }
    tex.Apply();
    return tex;
}
```
#### **2. Shader中采样动画纹理**
**关键技术点**：根据实例ID和动画时间计算UV坐标，解码骨骼矩阵。
```C
sampler2D _AnimationTex;
float _AnimTime; // 当前动画时间（0~1）
float _AnimLength; // 动画总时长（秒）

// 采样并重建骨骼矩阵
float4x4 GetBoneMatrix(int boneIndex, int instanceID) {
    // 计算UV：横坐标=骨骼索引*4 + 行号，纵坐标=当前帧
    float frame = _AnimTime * _AnimLength * 30.0; // 假设30FPS
    float2 uv = float2(
        (boneIndex * 4 + row) / (64.0 * 4.0), 
        (frame + 0.5) / _AnimationTex_TexelSize.w // 避免采样缝隙
    );
    float4 row0 = tex2Dlod(_AnimationTex, float4(uv.x, uv.y, 0, 0));
    float4 row1 = tex2Dlod(_AnimationTex, float4(uv.x + 1.0/256.0, uv.y, 0, 0));
    float4 row2 = tex2Dlod(_AnimationTex, float4(uv.x + 2.0/256.0, uv.y, 0, 0));
    return float4x4(row0, row1, row2, float4(0,0,0,1));
}

// v2f vert(appdata v) {
//     // 计算UV：x轴根据骨骼索引，y轴根据时间
//     float2 uv = float2(
//         (v.boneIndices.x * 4 + 0) / _AnimationTex_TexelSize.z, 
//         _AnimTime * _AnimationTex_TexelSize.w
//     );
//     float4 row0 = tex2Dlod(_AnimationTex, float4(uv, 0, 0));
//     float4 row1 = tex2Dlod(_AnimationTex, float4(uv + float2(1,0)*_AnimationTex_TexelSize.x, // 0, 0));
//     // 重构矩阵...
// }
```
#### **3. 结合GPU Instancing**
通过`MaterialPropertyBlock`传递每实例的动画参数（如起始时间、速度）：
```C#
MaterialPropertyBlock props = new MaterialPropertyBlock();
props.SetFloat("_AnimStartTime", Time.time);
renderer.SetPropertyBlock(props);
```
### **关键技术点**
1. **纹理格式选择**
    - **RGBAHalf**：每个通道16位浮点，精度足够存储矩阵分量。
    - **BC6H压缩**（DX11+）：高动态范围压缩格式，减少显存占用（需测试精度损失）。
2. **纹理寻址优化**
    - **分块存储**：将多个角色的动画数据打包到同一纹理，通过UV偏移区分不同角色。
    - **Mipmap禁用**：避免插值导致骨骼矩阵数据错误。
3. **动画混合支持**
    - **双帧插值**：采样相邻两帧纹理数据，在Shader中进行线性插值：
```C
float frame = _AnimTime * 30.0;
int frame0 = floor(frame);
int frame1 = frame0 + 1;
float t = frame - frame0;
float4x4 bone0 = GetBoneMatrix(boneIndex, frame0);
float4x4 bone1 = GetBoneMatrix(boneIndex, frame1);
float4x4 boneMatrix = lerp(bone0, bone1, t);
```
### **方案2优缺点**

|**优点**|**缺点**|
|---|---|
|动画计算完全在GPU，性能极致|仅支持预烘焙动画，无法动态修改|
|适合大规模同屏角色（如人群）|纹理内存占用高（50骨骼x100帧≈8MB）|
|减少CPU负载|UV计算复杂，易出现采样精度问题|

## **关键技术点对比**

|**技术点**|**方案1**|**方案2**|
|---|---|---|
|**骨骼数据来源**|实时从Transform计算或BakeMesh|预烘焙到纹理|
|**动画灵活性**|支持实时动态修改（物理、IK）|仅支持固定动画序列|
|**内存占用**|高（每实例独立骨骼矩阵）|中（纹理共享）|
|**适用场景**|中规模动态角色（NPC、敌人）|超大规模静态动画（人群、背景）|
|**开发难度**|高（需处理矩阵同步）|中（需工具链支持烘焙）|

## **最终选型建议**
- 选择 **方案1** 若需支持动态动画（如战斗中的角色），且有足够开发资源。
- 选择 **方案2** 若需渲染万人同屏且动画固定（如观众席），或目标平台为移动端（减少CPU计算）。
- **混合方案**：对主要角色使用方案1，对背景人群使用方案2。
# 有几点疑问：1、方案1中，如何将骨骼矩阵从Matrix4x4压缩为float3x4；2、方案2中，采样并重建骨骼矩阵部分，示例代码解释不是很清晰；
## **一、方案1：骨骼矩阵压缩（Matrix4x4 → float3x4）**
### **1. 压缩原理**
骨骼动画的变换矩阵通常是**仿射变换矩阵**（Affine Transformation Matrix），其第四行固定为 `[0, 0, 0, 1]`。因此，可以将 `Matrix4x4` 简化为 `float3x4`，仅存储前三行数据，显存占用从 **64字节**（16个float）降至 **48字节**（12个float），节省25%显存。
### **2. 实现步骤**
#### **(1) CPU端压缩**
在脚本中将 `Matrix4x4` 转换为 `float3x4` 并存入ComputeBuffer：
```C#
// 将骨骼矩阵前三行存入数组
List<float> compressedData = new List<float>();
foreach (Matrix4x4 matrix in boneMatrices) {
    // 提取前三行数据（每行4个float）
    for (int row = 0; row < 3; row++) {
        Vector4 rowData = matrix.GetRow(row);
        compressedData.Add(rowData.x);
        compressedData.Add(rowData.y);
        compressedData.Add(rowData.z);
        compressedData.Add(rowData.w);
    }
}

// 创建ComputeBuffer（每个骨骼占12个float）
ComputeBuffer boneBuffer = new ComputeBuffer(compressedData.Count / 12, 12 * sizeof(float));
boneBuffer.SetData(compressedData.ToArray());
```
#### **(2) Shader端解压**
在Shader中重建 `float4x4` 矩阵：
```C
// 定义骨骼矩阵缓冲区
StructuredBuffer<float> _CompressedBoneBuffer; // 每骨骼占12个float

float4x4 GetDecompressedMatrix(int boneIndex) {
    int baseIndex = boneIndex * 12; // 每骨骼12个float
    float4 row0 = float4(
        _CompressedBoneBuffer[baseIndex], 
        _CompressedBoneBuffer[baseIndex+1],
        _CompressedBoneBuffer[baseIndex+2],
        _CompressedBoneBuffer[baseIndex+3]
    );
    float4 row1 = float4(
        _CompressedBoneBuffer[baseIndex+4],
        _CompressedBoneBuffer[baseIndex+5],
        _CompressedBoneBuffer[baseIndex+6],
        _CompressedBoneBuffer[baseIndex+7]
    );
    float4 row2 = float4(
        _CompressedBoneBuffer[baseIndex+8],
        _CompressedBoneBuffer[baseIndex+9],
        _CompressedBoneBuffer[baseIndex+10],
        _CompressedBoneBuffer[baseIndex+11]
    );
    float4 row3 = float4(0, 0, 0, 1); // 固定第四行
    return float4x4(row0, row1, row2, row3);
}
```
### **3. 性能优化**
- **数据对齐**：确保ComputeBuffer的Stride为48字节（12 * 4 bytes）。
- **避免分支**：在Shader中直接通过索引计算，无需条件判断。
## **二、方案2：动画纹理采样与骨骼矩阵重建**
### **1. 纹理存储规则**
假设动画纹理尺寸为 `Width x Height`：
- **横向（U轴）**：每个骨骼的矩阵占用4个像素（每行存储一个矩阵的4个分量）。
- **纵向（V轴）**：每行对应一帧动画数据。

|骨骼索引|矩阵行|像素位置 (U)|
|---|---|---|
|0|Row0|0|
|0|Row1|1|
|0|Row2|2|
|0|Row3|3|
|1|Row0|4|
|...|...|...|
### **2. 采样与重建代码详解**
```C
// 动画纹理参数
sampler2D _AnimationTex;
float4 _AnimationTex_TexelSize; // 纹理尺寸信息（1/width, 1/height, width, height）
float _AnimTime; // 归一化时间 [0,1]

// 从纹理中重建骨骼矩阵
float4x4 GetBoneMatrix(int boneIndex) {
    // 计算当前帧（假设动画30FPS，总时长10秒）
    float totalFrames = 10.0 * 30.0;
    float frame = _AnimTime * totalFrames;
    
    // 计算UV坐标
    float u = (boneIndex * 4) / _AnimationTex_TexelSize.z; // 横向：骨骼索引*4
    float v = (frame + 0.5) / _AnimationTex_TexelSize.w;    // 纵向：当前帧（+0.5避免采样缝隙）

    // 采样四行数据
    float4 row0 = tex2Dlod(_AnimationTex, float4(u + 0 * _AnimationTex_TexelSize.x, v, 0, 0));
    float4 row1 = tex2Dlod(_AnimationTex, float4(u + 1 * _AnimationTex_TexelSize.x, v, 0, 0));
    float4 row2 = tex2Dlod(_AnimationTex, float4(u + 2 * _AnimationTex_TexelSize.x, v, 0, 0));
    float4 row3 = float4(0, 0, 0, 1); // 固定第四行

    return float4x4(row0, row1, row2, row3);
}
```
### **3. 关键细节解释**
- **纹理坐标计算**
    - `_AnimationTex_TexelSize.x` = `1/纹理宽度`，用于横向偏移到下一个矩阵行。
    - `+0.5` 的纵向偏移：避免纹理过滤时采样到相邻帧（确保精确对齐像素中心）。
- **帧间插值（平滑动画）**  
    若需要帧间插值，可采样相邻两帧并混合：
	```C
	float frame = _AnimTime * totalFrames;
	float frameFloor = floor(frame);
	float frameFrac = frame - frameFloor;
	
	// 采样当前帧和下一帧
	float4x4 matrix0 = GetBoneMatrix(boneIndex, frameFloor);
	float4x4 matrix1 = GetBoneMatrix(boneIndex, frameFloor + 1);
	
	// 线性插值
	return lerp(matrix0, matrix1, frameFrac);
	```
### **4. 优化技巧**
- **纹理分块（Tile）**  
    若角色有多个动画（走、跑、跳），可将不同动画存储在纹理的不同区域（Tile），通过UV偏移切换：
```C
float2 uvOffset = _AnimType * float2(4.0 / _AnimationTex_TexelSize.z, 0); // 横向偏移
float u = (boneIndex * 4) / _AnimationTex_TexelSize.z + uvOffset.x;
float v = (frame + 0.5) / _AnimationTex_TexelSize.w + uvOffset.y;
```
- **BC6H压缩**  
    在支持DX11的平台上，使用BC6H压缩动画纹理（需测试数据精度）：
```C#
Texture2D animTex = new Texture2D(..., TextureFormat.BC6H);
```