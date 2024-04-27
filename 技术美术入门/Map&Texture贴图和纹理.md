---
tags:
  - Unity
  - Shader
---
# 纹理

纹理，就是我们非常熟悉的的位图文件。

Unity 支持的纹理格式有： BMP、EXR、GIF、HDR、IFF、PICT、TGA、PSD、PICT、TIFF、PNG 和 JPG。

## 双通道和三通道、四通道

- 灰度图像： 图像文件中的数据被组织成通道。黑白图像，也称为灰度图像，只有一个通道来指示每个像素中的灰度阴影。
- 彩色图像： 需要三个通道，红色、绿色和蓝色 (RGB)，它们结合起来可以创建您在计算机显示器上看到的颜色。
- 四通道：  
    某些图像文件格式有四个通道：红色、绿色、蓝色和 alpha (RGBA)。Alpha 通道通常包含透明度数据。 ![|420](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/CC_Shad_Text_A.jpg.2000x0x1.jpg)

## 通道

图像文件的每个通道本身就是一个数字矩阵。在材料中，这些数字可以指示除了颜色或透明度之外的其他属性——例如平滑度、镜面反射度或金属度——甚至是每个像素面对的方向以创建物理特征的外观。

# 使用纹理

## 3.1 在 Base Map 上使用纹理改变物体表面颜色

Base Map Texture （也称为漫反射或反照率）是一个常规 RGB 或 RGBA 彩色图像文件，用于定义对象表面的漫反射（即颜色）。
可以使用到 Base Map 上的纹理资源文件，通常命名时，名称中会包含诸如 albedo、diffuse 或 base 之类的词，作为前缀或后缀

### UV 贴图

由 Autodesk® 3ds Max® 和 Maya® 或 Blender® 等建模应用程序制作的网格会生成它们自己的称为 UV 坐标的 2D 坐标集。UV 坐标类似于常规 2D 空间中的 XY 坐标，但它们被称为 UV 以将它们与环境坐标系 (XYZ) 区分开来。UV 坐标相对于网格，而不是场景中的 3D 空间。

UV 映射是展开 3D 模型的表面以创建平面，然后对其应用 2D 纹理贴图的过程。在此过程中，建模应用程序生成 UV 坐标，允许将纹理回绕到模型上。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/a6gds-st4qm.gif)