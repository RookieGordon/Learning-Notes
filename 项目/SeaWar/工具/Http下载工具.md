---
tags:
  - SeaWar/工具/Http下载工具
  - Unity/Tools/Download
---
断点续传功能，是一个很简单和普遍的功能，但是该功能，需要资源服和客户端一起支持才可以，具体原因如下：
- **HTTP协议依赖**：断点续传基于HTTP协议的`Range`请求头（客户端）和`Content-Range`响应头（服务器）。如果服务器不支持`Range`请求，它不会返回`Content-Range`和`206 Partial Content`状态码，而是直接返回完整文件（`200 OK`）。
- **数据完整性**：若服务器不支持，客户端无法验证已下载部分与服务器资源是否一致（例如文件是否被修改），可能导致数据不一致。
基于如上所述，可以根据资源服返回的状态码来判断资源服是否支持断点续传。
## 避免文件损坏的关键点
某些特殊的情况下，如果不做文件校验，会导致文件错误。例如：资源服务器上，不同文件上传到了同一个地址，此时如果客户端产生断点续传，但是不校验文件，那么就会导致文件错误。可以使用`ETag或Last-Modified头验证文件`来进行文件校验。
### 如何使用`ETag`或`Last-Modified`验证文件变更？
#### (1) 核心原理
- **`ETag`（实体标签）**：服务器为资源生成的唯一标识符（如哈希值），资源变化时`ETag`会改变。
- **`Last-Modified`**：资源最后修改时间，用于判断资源是否被更新。
- **验证逻辑**：在续传请求中，客户端携带之前保存的`ETag`或`Last-Modified`值，通过`If-Match`、`If-None-Match`、`If-Modified-Since`等请求头，要求服务器校验资源是否未变更。
#### (2) 实现步骤
1. **首次下载时保存校验信息**  
    在第一次下载（或HEAD请求）时，记录`ETag`和`Last-Modified`值。
```CSharp
	string initialEtag = response.Headers.ETag?.Tag;
    DateTimeOffset? initialLastModified = response.Content.Headers.LastModified;
```
2. **续传时发送条件请求**  
    在后续断点续传请求中，添加`If-Range`头（结合`ETag`或`Last-Modified`），要求服务器仅在资源未变化时返回剩余部分。
```CSharp
var request = new HttpRequestMessage(HttpMethod.Get, fileUrl);
request.Headers.Range = new RangeHeaderValue(startByte, null);

// 使用ETag或Last-Modified作为条件
// 优先使用ETag（因为Last-Modified可能存在时间同步问题）。
if (!string.IsNullOrEmpty(initialEtag))
{
    request.Headers.IfRange = new RangeConditionHeaderValue(new EntityTagHeaderValue(initialEtag));
}
else if (initialLastModified.HasValue)
{
    request.Headers.IfRange = new 
RangeConditionHeaderValue(initialLastModified.Value);
}
```



