using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

public class ProcessResult<TIn, TOut>
{
    public TIn Input { get; }
    public TOut Output { get; }
    public Exception Error { get; }

    public bool IsSuccess => Error == null;

    public ProcessResult(TIn input, TOut output)
    {
        Input = input;
        Output = output;
    }

    public ProcessResult(TIn input, Exception error)
    {
        Input = input;
        Error = error;
    }
}

public class ParallelTaskProcessor<TIn, TOut>
{
    private readonly Func<TIn, CancellationToken, Task<TOut>> _processor;
    private readonly int _maxDegreeOfParallelism;
    private readonly int _boundedCapacity;

    public ParallelTaskProcessor(Func<TIn, CancellationToken, Task<TOut>> processor,
        int maxDegreeOfParallelism = -1,
        int boundedCapacity = 100)
    {
        _processor = processor;
        _maxDegreeOfParallelism = maxDegreeOfParallelism > 0
            ? maxDegreeOfParallelism
            : Environment.ProcessorCount * 2;
        _boundedCapacity = boundedCapacity;
    }

    public async Task ProcessAsync(IEnumerable<TIn> inputs,
        IProgress<ProcessResult<TIn, TOut>> progress = null,
        CancellationToken cancellationToken = default)
    {
        var collection = new BlockingCollection<TIn>(_boundedCapacity);
        var progressQueue = new ConcurrentQueue<ProcessResult<TIn, TOut>>();
        var tasks = new List<Task>();
        var consumeCount = 0;
        var totalCount = inputs.Count();
        Debug.Log($"Input count: {totalCount}");

        // 启动一个单独的任务处理进度上报
        var progressTask = Task.Run(() =>
        {
            while (consumeCount < totalCount && !cancellationToken.IsCancellationRequested)
            {
                if (progressQueue.TryDequeue(out var result))
                {
                    progress?.Report(result);
                }
            }
        }, cancellationToken);

        // 生产者线程
        var producer = Task.Run(() =>
        {
            try
            {
                foreach (var item in inputs)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        break;
                    }

                    collection.Add(item, cancellationToken);
                }
            }
            finally
            {
                collection.CompleteAdding();
            }
        }, cancellationToken);

        // 消费者线程
        for (int i = 0; i < _maxDegreeOfParallelism; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                foreach (var item in collection.GetConsumingEnumerable(cancellationToken))
                {
                    try
                    {
                        var result = await _processor(item, cancellationToken);
                        progressQueue.Enqueue(new ProcessResult<TIn, TOut>(item, result));
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        Debug.LogError(
                            $"Consume {item} error, \n msg：{ex}, \n inner msg: {ex.InnerException}");
                        progressQueue.Enqueue(new ProcessResult<TIn, TOut>(item, ex));
                    }
                    finally
                    {
                        Interlocked.Increment(ref consumeCount);
                    }
                }
            }, cancellationToken));
        }

        await Task.WhenAll(tasks);
        Debug.Log("All tasks completed.");
        await producer; // 确保生产者完成
        Debug.Log("Producer completed.");
        collection.CompleteAdding();
        Debug.Log("Collection completed.");
        await progressTask; // 确保进度上报完成
        Debug.Log("Progress task completed.");
    }
}