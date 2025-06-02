---
tags:
  - SeaWar/工具/Http网址检测
  - mytodo
  - Unity/Tools/URL检测
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/工具
dateStart: 2025-05-25
dateFinish: 2025-05-25
finished: true
displayIcon: pixel-banner-images/项目任务.png
---
## **使用HttpClient，实现Ping命令效果**
关键点在于，使用HttpClient发送HEAD请求以减少数据传输量，示例代码如下：
```CSharp
public static async Task<PingResult> PingUrlAsync(string url, int timeoutInSeconds)  
{  
    using (HttpClient client = new HttpClient())  
    {        
	    client.Timeout = TimeSpan.FromSeconds(timeoutInSeconds);  
        try  
        {  
            var startTime = DateTime.UtcNow;  
            using (var request = new HttpRequestMessage(HttpMethod.Head, url))  
            {                
	            var response = await client.SendAsync(request);  
                response.EnsureSuccessStatusCode();  
            }            
            var latency = (float)(DateTime.UtcNow - startTime)
				            .TotalMilliseconds;  
            return new PingResult(url, true, latency);  
        }        
        catch (Exception)  
        {           
	        return new PingResult(url, false, float.MaxValue);  
        }    
    }
}
```




