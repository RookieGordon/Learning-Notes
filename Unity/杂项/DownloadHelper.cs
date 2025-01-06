/*
 * author       : TGD-3-89
 * datetime     : 2025/1/2 20:49:21
 * description  : [description]
 * */

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public enum EDownloadStatus
{
    Start,
    Downloading,
    Retry,
    Succeed,
    Failed,
}

public struct DownloadInfo
{
    public ulong CurrentSize;
    public float Progress;
    public string ErrorMsg;
    public string Result;
}

public struct DownloadConfig
{
    public Action<EDownloadStatus, DownloadInfo> DownloadCallback;
    public int MaxRetryCount;
    public int Timeout;
    public bool EnableBreakpointResume;
}

public class Downloader
{
    private static int _Id = 0;
    private const int _defaultTimeout = 60;
    private const int _waitTimeout = 5;
    private const int _retryInterval = 5;
    public int DownloadId { get; private set; }
    public string ResUrl { get; private set; }
    public string FilePath { get; private set; }
    public string TempFilePath { get; private set; }
    public DownloadConfig Cfg { get; private set; }

    private int _retryCount;

    public DateTime WakeUpTime { get; private set; }

    public Downloader(string p_strUrl, string p_strPath, DownloadConfig p_config)
    {
        DownloadId = _Id++;
        ResUrl = p_strUrl;
        FilePath = p_strPath;
        Cfg = p_config;
        if (Cfg.EnableBreakpointResume && !string.IsNullOrEmpty(FilePath))
        {
            TempFilePath = FilePath + ".temp";
        }
    }

    public IEnumerator StartDownload()
    {
        if (this._retryCount == 0)
        {
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Start, new DownloadInfo());
        }
        else
        {
            Log.RedDebug($"StartDownload {ResUrl}, retry count: {this._retryCount}");
        }

        if (Cfg.EnableBreakpointResume)
        {
            var task = _BreakpointResumeDownloadAsync();
            while (!task.IsCompleted)
            {
                yield return new WaitForEndOfFrame();
            }
        }
        else
        {
            var t = _SimpleDownloadAsync();
            while (!t.IsCompleted)
            {
                yield return new WaitForEndOfFrame();
            }
        }
    }

    public string DownloadSync()
    {
        try
        {
            string r = string.Empty;
            var t = Task.Run(async () => { r = await _SimpleDownloadAsync(); });
            t.Wait();
            return r;
        }
        catch (Exception e)
        {
            return string.Empty;
        }
    }

    private async Task<string> _SimpleDownloadAsync()
    {
        using (var httpClient = new HttpClient())
        {
            httpClient.Timeout =
                Cfg.Timeout == 0 ? TimeSpan.FromSeconds(_defaultTimeout) : TimeSpan.FromSeconds(Cfg.Timeout);
            using (var cts = new CancellationTokenSource())
            {
                cts.CancelAfter(TimeSpan.FromSeconds(_waitTimeout)); // 设置超时时间
                HttpResponseMessage response;
                try
                {
                    response = await httpClient.GetAsync(ResUrl, cts.Token);
                }
                catch (TaskCanceledException)
                {
                    _OnSimpleDownloadError(System.Net.HttpStatusCode.RequestTimeout.ToString());
                    return string.Empty;
                }
                catch (Exception e)
                {
                    _OnSimpleDownloadError($"Error: {e}, InnerError: {e.InnerException?.ToString()}");
                    return string.Empty;
                }

                if (!response.IsSuccessStatusCode)
                {
                    _OnSimpleDownloadError(response.StatusCode.ToString());
                    return string.Empty;
                }

                try
                {
                    var content = await response.Content.ReadAsStringAsync();
                    if (!string.IsNullOrEmpty(FilePath))
                    {
                        await File.WriteAllTextAsync(FilePath, content, cts.Token);
                        Cfg.DownloadCallback?.Invoke(EDownloadStatus.Succeed, new DownloadInfo
                        {
                            Result = FilePath,
                        });
                        return FilePath;
                    }
                    else
                    {
                        Cfg.DownloadCallback?.Invoke(EDownloadStatus.Succeed, new DownloadInfo
                        {
                            Result = content,
                        });
                        return content;
                    }
                }
                catch (Exception e)
                {
                    _OnSimpleDownloadError(
                        $"Error reading response stream: {e}, InnerError: {e.InnerException?.ToString()}");
                    return string.Empty;
                }
            }
        }
    }

    private void _OnSimpleDownloadError(string p_strErrMsg)
    {
        if (this._retryCount < Cfg.MaxRetryCount)
        {
            this._retryCount++;
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Retry, new DownloadInfo());
            WakeUpTime = DateTime.Now.AddSeconds(_retryInterval);
            DownloadHelper.Instance.AddToRetryList(DownloadId);
        }
        else
        {
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Failed, new DownloadInfo
            {
                ErrorMsg = p_strErrMsg,
            });
            DownloadHelper.Instance.RemoveDownloader(DownloadId);
        }
    }

    private async Task _BreakpointResumeDownloadAsync()
    {
        long startByte = 0;

        // 检查是否存在已下载的临时文件
        if (File.Exists(TempFilePath))
        {
            startByte = new FileInfo(TempFilePath).Length;
        }

        using (var httpClient = new HttpClient())
        {
            // 设置Range头以支持断点续传
            httpClient.DefaultRequestHeaders.Range = new System.Net.Http.Headers.RangeHeaderValue(startByte, null);
            httpClient.Timeout =
                Cfg.Timeout == 0 ? TimeSpan.FromSeconds(_defaultTimeout) : TimeSpan.FromSeconds(Cfg.Timeout);

            using (var cts = new CancellationTokenSource())
            {
                cts.CancelAfter(TimeSpan.FromSeconds(_waitTimeout)); // 设置超时时间

                HttpResponseMessage response;
                try
                {
                    response = await httpClient.GetAsync(ResUrl, HttpCompletionOption.ResponseHeadersRead, cts.Token);
                }
                catch (TaskCanceledException)
                {
                    _OnResumeDownloadError(System.Net.HttpStatusCode.RequestTimeout.ToString());
                    return;
                }
                catch (Exception e)
                {
                    _OnResumeDownloadError($"Error: {e}, InnerError: {e.InnerException?.ToString()}");
                    return;
                }

                // 判断连接请求是否成功
                if (!response.IsSuccessStatusCode)
                {
                    _OnResumeDownloadError(response.StatusCode.ToString());
                    return;
                }

                // 使用FileStream进行流式写入
                using (var fileStream = new FileStream(TempFilePath, FileMode.Append, FileAccess.Write, FileShare.None))
                {
                    this._retryCount = 0;
                    Stream contentStream;
                    try
                    {
                        contentStream = await response.Content.ReadAsStreamAsync();
                    }
                    catch (Exception e)
                    {
                        _OnResumeDownloadError(
                            $"Error reading response stream: {e}, InnerError: {e.InnerException?.ToString()}");
                        return;
                    }

                    // 使用CancellationTokenSource包裹文件流写入部分
                    using (var innerCts = new CancellationTokenSource())
                    {
                        innerCts.CancelAfter(TimeSpan.FromSeconds(_waitTimeout)); // 设置超时时间

                        try
                        {
                            // 使用CopyToAsync进行流式写入
                            await contentStream.CopyToAsync(fileStream, 8192, innerCts.Token);
                        }
                        catch (TaskCanceledException)
                        {
                            _OnResumeDownloadError("File write operation timed out.");
                            return;
                        }
                        catch (Exception e)
                        {
                            _OnResumeDownloadError(
                                $"File write error: {e}, InnerError: {e.InnerException?.ToString()}");
                            return;
                        }
                    }
                }

                if (File.Exists(FilePath))
                {
                    File.Delete(FilePath);
                }

                File.Move(TempFilePath, FilePath);
                Cfg.DownloadCallback?.Invoke(EDownloadStatus.Succeed, new DownloadInfo
                {
                    Result = FilePath,
                });
            }
        }
    }

    private void _OnResumeDownloadError(string p_strErrMsg)
    {
        if (this._retryCount < Cfg.MaxRetryCount)
        {
            this._retryCount++;
            Log.RedDebug($"Download {ResUrl} error, prepare to retry. {p_strErrMsg}");
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Retry, new DownloadInfo());
            WakeUpTime = DateTime.Now.AddSeconds(Downloader._retryInterval);
            DownloadHelper.Instance.AddToRetryList(DownloadId);
        }
        else
        {
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Failed, new DownloadInfo
            {
                ErrorMsg = p_strErrMsg,
            });
            DownloadHelper.Instance.RemoveDownloader(DownloadId);
        }
    }
}

public class DownloadHelper : MonoSingleton<DownloadHelper>, IMonoSingleton
{
    private Dictionary<int, Downloader> _dicDownloaders = new Dictionary<int, Downloader>();

    private List<Downloader> _listRetry = new List<Downloader>();

    public int CreateDownloader(string p_strUrl, string p_strPath, DownloadConfig p_config, bool p_bStart = false)
    {
        var downloader = new Downloader(p_strUrl, p_strPath, p_config);
        this._dicDownloaders.Add(downloader.DownloadId, downloader);
        if (p_bStart)
        {
            StartCoroutine(downloader.StartDownload());
        }

        return downloader.DownloadId;
    }

    public void CreateDCFSDownloader(string p_strUrl, string p_strPath, Action<string> p_fnFailCallback,
        Action<string> p_fnSuccessCallback, Action p_fnRetryCallback = null)
    {
        var downloader = new Downloader(p_strUrl, p_strPath, new DownloadConfig()
        {
            MaxRetryCount = 6,
            EnableBreakpointResume = true,
            DownloadCallback = (state, info) =>
            {
                if (state == EDownloadStatus.Failed)
                {
                    p_fnFailCallback?.Invoke(info.ErrorMsg);
                }
                else if (state == EDownloadStatus.Succeed)
                {
                    p_fnSuccessCallback?.Invoke(info.Result);
                }
                else if (state == EDownloadStatus.Retry)
                {
                    p_fnRetryCallback?.Invoke();
                }
            }
        });

        this._dicDownloaders.Add(downloader.DownloadId, downloader);
        StartCoroutine(downloader.StartDownload());
    }

#if UNITY_EDITOR
    public static string DownloadSync(string p_strUrl)
    {
        var downloader = new Downloader(p_strUrl, string.Empty, new DownloadConfig());
        return downloader.DownloadSync();
    }
#endif

    public void StartDownload(int p_id)
    {
        if (this._dicDownloaders.TryGetValue(p_id, out var downloader))
        {
            StartCoroutine(downloader.StartDownload());
        }
    }

    public void RemoveDownloader(int p_id)
    {
        this._dicDownloaders.Remove(p_id);
    }

    public void AddToRetryList(int p_id)
    {
        if (this._dicDownloaders.TryGetValue(p_id, out var downloader))
        {
            this._listRetry.Add(downloader);
            this._dicDownloaders.Remove(p_id);
        }
    }

    public void Update()
    {
        if (this._listRetry.Count == 0)
        {
            return;
        }

        var now = DateTime.Now;
        for (int i = this._listRetry.Count - 1; i >= 0; i--)
        {
            var downloader = this._listRetry[i];
            if (now > downloader.WakeUpTime)
            {
                StartCoroutine(downloader.StartDownload());
                this._listRetry.RemoveAt(i);
                this._dicDownloaders.Add(downloader.DownloadId, downloader);
            }
        }
    }

    public override void Init()
    {
    }
}