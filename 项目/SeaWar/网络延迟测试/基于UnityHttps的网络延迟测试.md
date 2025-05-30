---
tags: SeaWar/网络延迟测试/基于UnityHttps的网络延迟测试 mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/网络延迟测试
dateStart: 2025-05-19
dateFinish: 2025-05-19
finished: false
displayIcon: pixel-banner-images/项目任务.png

---
```CSharp
// ******************************************************************  
//  @file       PingUtil.cs  
//  @brief      基于unity https多地址，返回可达、ping从低到高的地址  
//  @author     xusheng                         
//  @Create    2025-05-15 14:27  //  @Copyright  Copyright (c) 2025-2080, sheng.xu    // ******************************************************************  
  
using System;  
using System.Collections;  
using System.Collections.Generic;  
using System.Linq;  
using Flow.ThinkingAnalytics;  
using UnityEngine;  
using UnityEngine.Networking;  
  
namespace PG  
{  
	[System.Serializable]  
    public class PingResult  
    {  
        /// <summary>  
        /// 通信地址  
        /// </summary>  
        public string Url { get; }  
    
        /// <summary>  
        /// 延迟  
        /// </summary>  
        public float Latency { get; }  
    
        public PingResult(string url, float latency)  
        {        Url = url;  
            Latency = latency;  
        }
    }

    public static class PingUtil  
    {  
        private static List<PingResult> validPingResults = new List<PingResult>();  
  
  
        /// <summary>  
        /// 选择有效地址  
        /// </summary>  
        /// <param name="pingServer"></param>        
        /// <param name="urls"></param>        
        /// <param name="requestTimeout"></param>        
        /// <param name="timeOutEvName"超时打点数据></param>  
        /// <param name="errEvName">错误打点数据</param>  
        /// <returns></returns>        
        public static IEnumerator SelectValidRequestUrls(IPingServer pingServer, 
                                                        string[] urls, 
                                                        int requestTimeout,  
                                                        string timeOutEvName = "", 
                                                        string errEvName = "")  
        {            
            //尝试次数  
            int tryTimes = 1;  
            //最大尝试次数  
            int maxTryTimes = 3;  
            //尝试次数超时偏移量  
            int timeOutOffset = 0;  
            //step1、选择最优路径  
            yield return SelectValidUrls(pingServer, urls, 
                                        requestTimeout, timeOutEvName, errEvName);  
            while (true)  
            {                
                if (pingServer.IsDone)  
                {                    
                    if (pingServer.Results == null || pingServer.Results.Count == 0)  
                    {                        
                        if (tryTimes < maxTryTimes)  
                        {                            
                            timeOutOffset += 2;  
                            tryTimes++;                            
                            yield return SelectValidUrls(pingServer, urls, 
                                                        requestTimeout + timeOutOffset,  
                                                        timeOutEvName, errEvName);                        
                        }                        
                        else  
                        {  
                            //到达重试次数  
                            break;  
                        }                    
                    }                    
                    else  
                    {  
                        //数据合理  
                        break;  
                    }                
                }  
                yield return null;  
            }        
        }  

        /// <summary>  
        /// 选择最优地址  
        /// </summary>  
        /// <param name="pingServer"></param>        
        /// <param name="urls"></param>        
        /// <param name="requestTimeout"></param>        
        /// <param name="timeOutEvName"></param>        
        /// <param name="errEvName"></param>        
        /// <returns></returns>        
        static IEnumerator SelectValidUrls(IPingServer pingServer, 
                                            string[] urls, 
                                            int requestTimeout,  
                                            string timeOutEvName, 
                                            string errEvName)  
        {            //step1、是否有效  
            if (urls == null || urls.Length == 0)  
            {                pingServer.IsDone = true;  
                pingServer.Results = new List<PingResult>();  
                Debug.LogError("检测输入地址是否有效");  
                yield break;  
            }  
            pingServer.IsDone = false;  
            validPingResults.Clear();  
            List<IEnumerator> iEnumerators = new List<IEnumerator>();  
            // 启动所有服务器的延迟检测  
            foreach (string url in urls)  
            {                
                if (!string.IsNullOrEmpty(url))  
                {                    
                    iEnumerators.Add(MeasureSingleServerLatency(url, requestTimeout, 
                                                                timeOutEvName, errEvName));  
                }            
            }  
            yield return WaitForCompletion(iEnumerators);  
            pingServer.Results = SortResults();  
            pingServer.IsDone = true;  
        }  
        /// <summary>  
        ///  ping每一个url  
        /// </summary>        
        /// <param name="url"></param>        
        /// <param name="requestTimeout"></param>        
        /// <param name="timeOutEvName"></param>        
        /// <param name="errEvName"></param>        
        /// <returns></returns>        
        static IEnumerator MeasureSingleServerLatency(string url, int requestTimeout,  
                                                    string timeOutEvName, string errEvName)  
        {            
            using (UnityWebRequest request = UnityWebRequest.Head(url))  
            {                
                var startTime = DateTime.UtcNow;  
                UnityWebRequestAsyncOperation asyncOp = request.SendWebRequest();  
  
                // 等待请求完成或超时  
                while (!asyncOp.isDone)  
                {                    
                    if ((DateTime.UtcNow - startTime).TotalSeconds >= requestTimeout)  
                    {                        
                        Debug.LogWarning($"{url} 请求超时");  
                        //打点  
                        if (!string.IsNullOrEmpty(timeOutEvName))  
                        {                            
                            Log(timeOutEvName, url, request);  
                        }  
                        yield break;  
                    }  
                    yield return null;  
                }  
                HandleMeasurementResult(request, url, startTime, errEvName);  
            }        
        }  
  
        static void HandleMeasurementResult(UnityWebRequest request, 
                                            string url, 
                                            DateTime startTime, 
                                            string errEvName)  
        {            
            if (request.result == UnityWebRequest.Result.Success)  
            {                
                float latency = (float) (DateTime.UtcNow - startTime).TotalMilliseconds;  
                validPingResults.Add(new PingResult(url, latency));  
                Debug.Log($"服务器 {url} 延迟: {latency}ms");  
            }            
            else  
            {  
                //打点  
                if (!string.IsNullOrEmpty(errEvName))  
                {                    
                    Log(errEvName, url, request);  
                }  
                Debug.LogError($"服务器 {url} 检测失败: {request.error}");  
            }        
        }  

        static IEnumerator WaitForCompletion(List<IEnumerator> coroutines)  
        {            
            while (coroutines.Count > 0)  
            {                
                for (int i = coroutines.Count - 1; i >= 0; i--)  
                {                    
                    if (!coroutines[i].MoveNext())  
                    {                        
                        coroutines.RemoveAt(i);  
                    }                
                }  
                yield return null;  
            }        
        }  

        static List<PingResult> SortResults()  
        {            
            if (validPingResults.Count == 0)  
            {                
                Debug.LogError("没有可用的服务器");  
                return default;  
            }  
            // 按延迟从小到大排序  
            var sortedResults = validPingResults.OrderBy(p => p.Latency).ToList();  
#if UNITY_EDITOR  
            // 输出排序结果  
            Debug.Log("   服务器延迟排序结果:  ");  
            for (int i = 0; i < sortedResults.Count; i++)  
            {                
                Debug.Log($"{i + 1}. {sortedResults[i].Url} - {sortedResults[i].Latency}ms");  
            }
#endif  
            validPingResults.Clear();  
            return sortedResults;  
        }  

        /// <summary>  
        /// 数据打点  
        /// </summary>  
        /// <param name="eventName"></param>        
        /// <param name="url"></param>        
        /// <param name="request"></param>        
        static void Log(string eventName, string url, UnityWebRequest request)  
        {            ThinkingAnalyInfo thinkingAnalyInfo = default;  
            thinkingAnalyInfo.code = request.responseCode;  
            thinkingAnalyInfo.msg = request.error;  
            thinkingAnalyInfo.eventName = eventName;  
            thinkingAnalyInfo.url = url;  
            Messenger.Broadcast(eventName, thinkingAnalyInfo);  
        }   
    }
}
```




