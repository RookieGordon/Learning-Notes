---
link: https://www.jianshu.com/p/d610d352e1f0
site: 简书
excerpt: 谈谈Unity游戏TCP连接和网络重连
  Unity中通常使用TcpClient来进行Tcp连接，TcpClient支持异步读写，避免了我们需要另外开辟线程管理网络数据发送。当...
twitter: https://twitter.com/@jianshu.com
slurped: 2024-12-19T12:41:54.573Z
title: 谈谈Unity游戏TCP连接和网络重连
---

## 谈谈Unity游戏TCP连接和网络重连

## 谈谈Unity游戏TCP连接和网络重连

Unity中通常使用`TcpClient`来进行Tcp连接，`TcpClient`支持异步读写，避免了我们需要另外开辟线程管理网络数据发送。  
当异步读写经常会让人摸不着头脑，比较困惑。

### 1. 建立连接

```
/// <summary>
/// 连接服务器
/// </summary>
public void ConnectServer (string host, int port)
{
    Log.Instance.infoFormat ("start connect server host:{0}, port:{1}", host, port);
    lock (lockObj) {
        // 关闭老的连接
        if (null != client) {
            Close ();
        }
        // 建立新的连接
        client = new TcpClient ();
        client.SendTimeout = 1000;
        client.ReceiveTimeout = 1000;
        client.NoDelay = true;
        IsConnected = false;
        connectingFlag = true;
        try {
            client.BeginConnect (host, port, new AsyncCallback (OnConnect), client);
            
            // 这里是一个任务管理器，可以用来执行定时任务。连接时候添加一个超时检查的定时任务。
            TimerManager timer = AppFacade.Instance.GetManager<TimerManager> (ManagerName.Timer);
            timer.AddTask (OnConnectTimeout, CONN_TIMEOUT);
        } catch (Exception e) {
            Log.Instance.error ("connect server error", e);
            // 通知连接失败
            NetworkManager.AddEvent (Protocal.ConnectFail, null);
        }
    }
}
```

### 2. 异步处理连接结果

```
/// <summary>
/// 连接上服务器
/// </summary>
void OnConnect (IAsyncResult asr)
{
    lock (lockObj) {
        TcpClient client = (TcpClient)asr.AsyncState;
        bool validConn = (client == this.client);
        connectingFlag = false;
        try {
            // 结束异步连接
            client.EndConnect (asr);

            // 非当前连接
            if (!validConn) {
                client.Close ();
            }

            if (client.Connected) {
                Log.Instance.info ("connect server succ");

                // 异步读socket数据
                socketStream = client.GetStream ();
                socketStream.BeginRead (byteBuffer, 0, MAX_READ, new AsyncCallback (OnRead), new SocketState (client, socketStream));

                // 通知连接成功
                IsConnected = true;
                NetworkManager.AddEvent (Protocal.Connect, null);
            } else {
                // 通知连接失败
                Log.Instance.info ("connect server failed");

                NetworkManager.AddEvent (Protocal.ConnectFail, null);
            }
        } catch (SocketException e) {
            Log.Instance.error ("connect error", e);

            if (validConn) {
                // 通知连接失败
                NetworkManager.AddEvent (Protocal.ConnectFail, null);
            } else {
                client.Close ();
            }
        }
    }
}
```

### 3. 处理连接超时

```
/// <summary>
/// 连接超时
/// </summary>
void OnConnectTimeout ()
{
    lock (lockObj) {
        if (connectingFlag) {
            Log.Instance.error ("connect server timeout");

            // 通知连接失败
            NetworkManager.AddEvent (Protocal.ConnectFail, null);
        }
    }
}
```

### 4. 异步读取数据

```
/// <summary>
/// 读取消息
/// </summary>
void OnRead (IAsyncResult asr)
{
    int bytesRead = 0; // 读取到的字节
    bool validConn = false; // 是否是合法的连接

    SocketState socketState = (SocketState)asr.AsyncState;
    TcpClient client = socketState.client;
    if (client == null || !client.Connected) {
        return;
    }

    lock (lockObj) {
        try {
            validConn = (client == this.client);
            NetworkStream socketStream = socketState.socketStream;

            // 读取字节流到缓冲区
            bytesRead = socketStream.EndRead (asr);

            if (bytesRead < 1) { 
                if (!validConn) {
                    // 已经重新连接过了
                    socketStream.Close ();
                    client.Close ();
                } else {
                    // 被动断开时
                    // 通知连接被断开
                    OnDisconnected (DisType.Disconnect, "bytesRead < 1");
                }
                return;
            }

            // 接受数据包，写入缓冲区
            OnReceive (byteBuffer, bytesRead); 

            // 再次监听服务器发过来的新消息
            Array.Clear (byteBuffer, 0, byteBuffer.Length);   //清空数组
            socketStream.BeginRead (byteBuffer, 0, MAX_READ, new AsyncCallback (OnRead), socketState);
        } catch (Exception e) {
            Log.Instance.errorFormat ("read data error, connect valid:{0}", e, validConn);

            if (validConn) {
                // 通知连接被断开
                OnDisconnected (DisType.Exception, e);
            } else {
                socketStream.Close ();
                client.Close ();
            }
        }
    }

    // 对消息进行解码
    if (bytesRead > 0) {
        OnDecodeMessage ();
    }
}
```

对于数据的解包和封包，推荐`MiscUtil`这个库十分好用，大端小端模式都能很好处理。

### 5. 发送消息

```
/// <summary>
/// 发送消息
/// </summary>
public bool SendMessage (Request request)
{
    try {
        bool ret = WriteMessage (request.ToBytes ());
        request.Clear ();
        return ret;
    } catch (Exception e) {
        Log.Instance.errorFormat ("write message error, requestId:{0}", e, request.GetRequestId ());
    }
    return false;
}
/// <summary>
/// 写数据
/// </summary>
bool WriteMessage (byte[] message)
{
    bool ret = true;
    using (MemoryStream ms = new MemoryStream ()) {
        ms.Position = 0;
        EndianBinaryWriter writer = new EndianBinaryWriter (EndianBitConverter.Big, ms);
        int msglen = message.Length;
        writer.Write (msglen);
        writer.Write (message);
        writer.Flush ();

        lock (lockObj) {
            if (null != socketStream) {
                byte[] bytes = ms.ToArray ();
                socketStream.BeginWrite (bytes, 0, bytes.Length, new AsyncCallback (OnWrite), socketStream);
                
                ret = true;
            } else {
                Log.Instance.warn ("write data, but socket not connected");
                ret = false;
            }
        }
    }
    return ret;
}

/// <summary>
/// 向链接写入数据流
/// </summary>
void OnWrite (IAsyncResult r)
{
    lock (lockObj) {
        try {
            NetworkStream socketStream = (NetworkStream)r.AsyncState;
            socketStream.EndWrite (r);
        } catch (Exception e) {
            Log.Instance.error ("write data error", e);
            if ((e is IOException) && socketStream == this.socketStream) {
                // IO 异常并且还是当前连接
                OnDisconnected (DisType.Exception, e);
            }
        }
    }
}
```

### 6. 总结

为了防止并发，这里使用`lock`对于共享变量`client`、`socketStream`是使用都加了锁。  
在出现异常，连接断开的时候都通过事件机制抛给上层使用者，由上层使用者决定如何  
处理这个异常。

### 7. 断线重连处理

断线重连第一步监听`TcpClient`使用的过程中，对于异常发生之后触发重连逻辑。  
但在移动端比较重要的一点还要做好从后台切回前台过程中及时检查网络连接状态  
及时重连。

**Android后台切回前台的事件流**

```
onPause(切回后台之前) -> onResume -> focusChanged(false) -> focusChanged(true) (后面3个都是要在前台才能收到）
不切出游戏暂停游戏 focusChanged(false) -> focusChanged(true) // 如呼出键盘，或者下拉通知栏
```

**IOS后台切回前台的事件流**

```
IOS的消息顺序  resignActive(切回后台之前) -> enterBackground -> enterForeground -> becomeActive (后面3个都是要在前台才能收到）
不切出游戏暂停游戏 resignctive -> becomeActive
```

由上不难看出：

- Android可以监听focusChanged(false) -> focusChanged(true) ，注意onPause要当做一次focusChanged(false)。记录两次事件的间隔，比如间隔时间过长直接重新建立连接，比较短的话立即做一次  
    网络检查。
- IOS可以监听resignctive -> becomeActive

`TcpClient做网络检查可以发送一个0字节的包，代码如下：`

```
/// <summary>
/// 检查socket状态
/// </summary>
/// <returns><c>true</c>, if socket was checked, <c>false</c> otherwise.</returns>
public bool CheckSocketState ()
{
    Log.Instance.info ("check socket state start");

    // socket流为空
    if (client == null) {
        return true;
    }

    // 不在连接状态
    if (!client.Connected) {
        Log.Instance.info ("check socket state end, socket is not connected");
        return false;
    }

    // 判断连接状态
    bool connectState = true;
    Socket socket = client.Client;
    bool blockingState = socket.Blocking;
    try {
        byte[] tmp = new byte[1];

        socket.Blocking = false;
        socket.Send (tmp, 0, 0);
        connectState = true; // 若Send错误会跳去执行catch体，而不会执行其try体里其之后的代码

        Log.Instance.info("check socket state succ");
    } catch (SocketException e) {
        Log.Instance.warnFormat ("check socket error, errorCode:{0}", e.NativeErrorCode);

        // 10035 == WSAEWOULDBLOCK
        if (e.NativeErrorCode.Equals (10035)) {
            // Still Connected, but the Send would block
            connectState = true;
        } else {
            // Disconnected
            connectState = false;
        }
    } finally {
        socket.Blocking = blockingState;
    }

    return connectState;
}
```

最后编辑于

：2017.12.08 01:21:19

- 序言：七十年代末，一起剥皮案震惊了整个滨河市，随后出现的几起案子，更是在滨河造成了极大的恐慌，老刑警刘岩，带你破解...
    
    [沈念sama](https://www.jianshu.com/u/dcd395522934)阅读 211,042评论 6赞 490
    
- 序言：滨河连续发生了三起死亡事件，死亡现场离奇诡异，居然都是意外死亡，警方通过查阅死者的电脑和手机，发现死者居然都...
    
- 文/潘晓璐 我一进店门，熙熙楼的掌柜王于贵愁眉苦脸地迎上来，“玉大人，你说我怎么就摊上这事。” “怎么了？”我有些...
    
- 文/不坏的土叔 我叫张陵，是天一观的道长。 经常有香客问我，道长，这世上最难降的妖魔是什么？ 我笑而不...
    
- 正文 为了忘掉前任，我火速办了婚礼，结果婚礼上，老公的妹妹穿的比我还像新娘。我一直安慰自己，他们只是感情好，可当我...
    
    [茶点故事](https://www.jianshu.com/u/0f438ff0a55f)阅读 65,404评论 5赞 384
    
- 文/花漫 我一把揭开白布。 她就那样静静地躺着，像睡着了一般。 火红的嫁衣衬着肌肤如雪。 梳的纹丝不乱的头发上，一...
    
- 那天，我揣着相机与录音，去河边找鬼。 笑死，一个胖子当着我的面吹牛，可吹牛的内容都是我干的。 我是一名探鬼主播，决...
    
- 文/苍兰香墨 我猛地睁开眼，长吁一口气：“原来是场噩梦啊……” “哼！你这毒妇竟也来了？” 一声冷哼从身侧响起，我...
    
- 序言：老挝万荣一对情侣失踪，失踪者是张志新（化名）和其女友刘颖，没想到半个月后，有当地人在树林里发现了一具尸体，经...
    
- 正文 独居荒郊野岭守林人离奇死亡，尸身上长有42处带血的脓包…… 初始之章·张勋 以下内容为张勋视角 年9月15日...
    
    [茶点故事](https://www.jianshu.com/u/0f438ff0a55f)阅读 36,451评论 2赞 325
    
- 正文 我和宋清朗相恋三年，在试婚纱的时候发现自己被绿了。 大学时的朋友给我发了我未婚夫和他白月光在一起吃饭的照片。...
    
    [茶点故事](https://www.jianshu.com/u/0f438ff0a55f)阅读 38,577评论 1赞 340
    
- 序言：一个原本活蹦乱跳的男人离奇死亡，死状恐怖，灵堂内的尸体忽然破棺而出，到底是诈尸还是另有隐情，我是刑警宁泽，带...
    
- 正文 年R本政府宣布，位于F岛的核电站，受9级特大地震影响，放射性物质发生泄漏。R本人自食恶果不足惜，却给世界环境...
    
    [茶点故事](https://www.jianshu.com/u/0f438ff0a55f)阅读 39,848评论 3赞 312
    
- 文/蒙蒙 一、第九天 我趴在偏房一处隐蔽的房顶上张望。 院中可真热闹，春花似锦、人声如沸。这庄子的主人今日做“春日...
    
- 文/苍兰香墨 我抬头看了看天上的太阳。三九已至，却和暖如春，着一层夹袄步出监牢的瞬间，已是汗流浃背。 一阵脚步声响...
    
- 我被黑心中介骗来泰国打工， 没想到刚下飞机就差点儿被人妖公主榨干…… 1. 我叫王不留，地道东北人。 一个月前我还...
    
- 正文 我出身青楼，却偏偏与公主长得像，于是被迫代替她去往敌国和亲。 传闻我的和亲对象是个残疾皇子，可洞房花烛夜当晚...
    
    [茶点故事](https://www.jianshu.com/u/0f438ff0a55f)阅读 43,452评论 2赞 348
    

### 推荐阅读[更多精彩内容](https://www.jianshu.com/)

- http://www.jianshu.com/p/d610d352e1f0
    
- Android 自定义View的各种姿势1 Activity的显示之ViewRootImpl详解 Activity...
    
- Spring Cloud为开发人员提供了快速构建分布式系统中一些常见模式的工具（例如配置管理，服务发现，断路器，智...
    
- 写在最前面： 关于这篇散文式的小说，写在09年，当时青春懵懂，以为爱情就是一切，但有谁说的“世事一场冰雪”...
    
- 问:你能想象到的最好的朋友如何相处？ 答:在异性朋友在追她一筹莫展的时候，我可以神气地告诉他，我睡过你的心上人（哈...
    
    [呀_肉串](https://www.jianshu.com/u/4e11c93635af)阅读 468评论 0赞 1