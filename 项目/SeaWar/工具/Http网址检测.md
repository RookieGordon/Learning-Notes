---
tags:
  - SeaWar/工具/Http网址检测
  - Unity/Tools/URL检测
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




