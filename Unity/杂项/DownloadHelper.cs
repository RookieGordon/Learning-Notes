using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

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
    public string RemoteUrl;
    public string LocalFilePath;
    public int MaxRetries;
    public int RequestTimeout;
    public int WakeUpInterval;
}

public abstract class Downloader
{
    private static int _idCounter = 0;
    public int Id { get; set; }
    protected DownloadConfig Cfg { get; set; }

    protected CancellationToken _cancelToken;

    protected int _retryCount = 0;

    public Downloader(DownloadConfig cfg)
    {
        Id = _idCounter++;
        Cfg = cfg;
    }

    public abstract Task<string> Download(CancellationToken cancelToken);

    public async Task<string> WaitForRetry()
    {
        await Task.Delay(TimeSpan.FromSeconds(Cfg.WakeUpInterval), this._cancelToken);
        Console.WriteLine($"Retry count: {this._retryCount}");
        Cfg.DownloadCallback?.Invoke(EDownloadStatus.Retry, new DownloadInfo());
        return await Download(this._cancelToken);
    }
    
    protected async Task<string> _OnDownloadError(string errorMsg)
    {
        if (this._retryCount > Cfg.MaxRetries)
        {
            Console.WriteLine($"Download failed. Error: {errorMsg}");
            Cfg.DownloadCallback?.Invoke(EDownloadStatus.Failed, new DownloadInfo()
            {
                ErrorMsg = errorMsg,
            });
            return String.Empty;
        }

        Console.WriteLine($"Download failed, waiting for retry. Error:{errorMsg}");
        this._retryCount++;
        return await WaitForRetry();
    }
}

public class DCFSDownloader : Downloader
{
    private const int BufferSize = 2048;

    private string _tempFilePath;

    public DCFSDownloader(DownloadConfig cfg) : base(cfg)
    {
        if (string.IsNullOrEmpty(cfg.LocalFilePath))
        {
            throw new ArgumentException("LocalFilePath cannot be null or empty.");
        }

        this._tempFilePath = cfg.LocalFilePath + ".tmp";
    }

    public override async Task<string> Download(CancellationToken cancelToken)
    {
        this._cancelToken = cancelToken;
        cancelToken.ThrowIfCancellationRequested();
        try
        {
            using (var httpClient = new HttpClient())
            {
                if (Cfg.RequestTimeout > 0)
                {
                    httpClient.Timeout = TimeSpan.FromSeconds(Cfg.RequestTimeout);
                }

                await using (var fileStream = new FileStream(
                                 this._tempFilePath, FileMode.OpenOrCreate, FileAccess.Write,
                                 FileShare.Write, BufferSize, true))
                {
                    if (fileStream.Length > 0)
                    {
                        httpClient.DefaultRequestHeaders.Range =
                            new System.Net.Http.Headers.RangeHeaderValue(fileStream.Length, null);
                    }

                    HttpResponseMessage response = await httpClient.GetAsync(Cfg.RemoteUrl,
                        HttpCompletionOption.ResponseHeadersRead, cancelToken);

                    response.EnsureSuccessStatusCode();

                    long totalBytes = response.Content.Headers.ContentLength ?? 0;
                    long bytesRead = 0;
                    await using (var contentStream = await response.Content.ReadAsStreamAsync(cancelToken))
                    {
                        byte[] buffer = new byte[BufferSize];
                        int bytes;
                        while (true)
                        {
                            var readTask = contentStream.ReadAsync(buffer, 0, buffer.Length, cancelToken);
                            if (await Task.WhenAny(readTask, Task.Delay(TimeSpan.FromSeconds(5), cancelToken)) ==
                                readTask)
                            {
                                bytes = await readTask;
                                if (bytes == 0)
                                {
                                    break;
                                }

                                cancelToken.ThrowIfCancellationRequested();

                                await fileStream.WriteAsync(buffer, 0, bytes, cancelToken);
                                bytesRead += bytes;
                                Cfg.DownloadCallback?.Invoke(EDownloadStatus.Downloading, new DownloadInfo()
                                {
                                    CurrentSize = (ulong)bytesRead,
                                    Progress = (float)bytesRead / totalBytes,
                                });

                                cancelToken.ThrowIfCancellationRequested();
                            }
                            else
                            {
                                throw new TimeoutException("Timeout while reading from stream.");
                            }
                        }
                    }
                }
            }
        }
        catch (OperationCanceledException ex)
        {
            Console.WriteLine("Operation was cancelled.");
            return String.Empty;
        }
        catch (HttpRequestException ex)
        {
            return await _OnDownloadError(ex.ToString());
        }
        catch (Exception ex)
        {
            return await _OnDownloadError(ex.ToString());
        }

        try
        {
            if (File.Exists(Cfg.LocalFilePath))
            {
                File.Delete(Cfg.LocalFilePath);
            }

            await using (var sourceFileStream = new FileStream(
                             this._tempFilePath, FileMode.Open, FileAccess.Read,
                             FileShare.Read, BufferSize, true))
            {
                await using (var destFileStream = new FileStream(
                                 Cfg.LocalFilePath, FileMode.OpenOrCreate, FileAccess.Write,
                                 FileShare.Write, BufferSize, true))
                {
                    await sourceFileStream.CopyToAsync(destFileStream, cancelToken);
                }
            }

            File.Delete(this._tempFilePath);
        }
        catch (OperationCanceledException ex)
        {
            Console.WriteLine("Operation was cancelled during file copy.");
            return String.Empty;
        }
        catch (IOException ex)
        {
            return await _OnDownloadError(ex.ToString());
        }
        catch (Exception ex)
        {
            return await _OnDownloadError(ex.ToString());
        }

        Cfg.DownloadCallback?.Invoke(EDownloadStatus.Succeed, new DownloadInfo()
        {
            Result = Cfg.LocalFilePath,
        });
        return Cfg.LocalFilePath;
    }
}

public class SimpleDownloader : Downloader
{
    public SimpleDownloader(DownloadConfig cfg) : base(cfg)
    {
    }

    public override async Task<string> Download(CancellationToken cancelToken)
    {
        this._cancelToken = cancelToken;
        cancelToken.ThrowIfCancellationRequested();
        using (var httpClient = new HttpClient())
        {
            if (Cfg.RequestTimeout > 0)
            {
                httpClient.Timeout = TimeSpan.FromSeconds(Cfg.RequestTimeout);
            }

            try
            {
                var response = await httpClient.GetAsync(Cfg.RemoteUrl, cancelToken);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsStringAsync(cancelToken);
            }
            catch (OperationCanceledException ex)
            {
                Console.WriteLine("Operation was cancelled.");
                return String.Empty;
            }
            catch (HttpRequestException ex)
            {
                return await _OnDownloadError(ex.ToString());
            }
            catch (Exception ex)
            {
                return await _OnDownloadError(ex.ToString());
            }
        }
    }
}

public class DownloadHelper
{
    private Dictionary<int, Downloader> _downloaders = new Dictionary<int, Downloader>();

    public async Task<string> CreateDownloader(DownloadConfig cfg, bool start = true)
    {
        var downloader = new DCFSDownloader(cfg);
        _downloaders.Add(downloader.Id, downloader);
        if (start)
        {
            await downloader.Download(CancellationToken.None);
        }

        return String.Empty;
    }
}