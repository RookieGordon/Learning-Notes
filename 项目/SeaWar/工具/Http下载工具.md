---
tags:
  - SeaWar/工具/Http下载工具
  - mytodo
  - Unity/Tools/Download
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/工具
dateStart: 2025-05-25
dateFinish: 2025-05-25
finished: false
displayIcon: pixel-banner-images/项目任务.png
---
# 下载与断点续传
断点续传功能，是一个很简单和普遍的功能，但是该功能，需要资源服和客户端一起支持才可以。
- **HTTP协议依赖**：断点续传基于HTTP协议的`Range`请求头（客户端）和`Content-Range`响应头（服务器）。如果服务器不支持`Range`请求，它不会返回`Content-Range`和`206 Partial Content`状态码，而是直接返回完整文件（`200 OK`）。
- **数据完整性**：若服务器不支持，客户端无法验证已下载部分与服务器资源是否一致（例如文件是否被修改），可能导致数据不一致。
基于如上所述，可以根据资源服返回的状态码来判断资源服是否支持断点续传。





