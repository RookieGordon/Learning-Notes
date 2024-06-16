---
link: https://blog.csdn.net/weixin_42264818/article/details/128831821?ops_request_misc=%257B%2522request%255Fid%2522%253A%2522171850619616800178574217%2522%252C%2522scm%2522%253A%252220140713.130102334.pc%255Fblog.%2522%257D&request_id=171850619616800178574217&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~hot_rank-5-128831821-null-null.nonecase&utm_term=unity%20%E6%96%AD%E7%BA%BF%E9%87%8D%E8%BF%9E
byline: 成就一亿技术人!
excerpt: 文章浏览阅读2.3k次，点赞5次，收藏15次。Unity-TCP-网络聊天功能实现_unity 聊天
tags:
  - slurp/unity-聊天
slurped: 2024-06-16T03:15:48.738Z
title: "Unity-TCP-网络聊天功能(四): 消息粘包、心跳机制保活(心跳包)、断线重连_unity 聊天-CSDN博客"
---


```cardlink
url: https://blog.csdn.net/weixin_42264818/category_12186180.html
title: "网络通信_我是刘咩咩阿的博客-CSDN博客"
description: "Unity-UDP-客户端/服务器通信功能,Unity-TCP-网络聊天功能(四): 消息粘包、心跳机制保活(心跳包)、断线重连,Unity-TCP-网络聊天功能(三): 公共/私人聊天、添加好友、好友上下线、新消息提醒、点击好友聊天、退出登录,unity,网络"
host: blog.csdn.net
```

# 粘包

bug1：下线后，如果发送多条消息，在客户端上线时，一瞬间接收到，效果如同粘包，需要拆包。举例，连续发送三条160长度消息，可能实际显示2条消息，原因，第三条消息和第二条消息粘包，第二条消息长度变为320，但是Receive方法没有考虑这个问题，相当于这段代码只运行了两次，只接收了两次消息

```CSharp
int length = await client.GetStream().ReadAsync(buff, 0, buff.Length);
if (length > 0)
{
    Debug.Log($"接收到的数据长度：{length}");
    MessageHelper.Instance.CopyToData(buff, length);//接收到处理CopyToData给MessageHelper处理信息  
}
```

需要在CopyToData方法中的Handle处理一下粘包。

```CSharp
private void Handle()
{
    //包体大小(4) 协议ID(4) 包体(byte[])
    if (msgLength >= 8)
    {
        byte[] _size = new byte[4];
        Array.Copy(data, 0, _size, 0, 4);//把包体大小从第0位缓存4位长度
        int size = BitConverter.ToInt32(_size, 0);//获得包体大小

        //本次要拿的长度
        var _length = 8 + size;//实际完整消息的长度：包体大小(4)+协议ID(4)+包体(byte[])

        while (msgLength>=_length)//判断数据缓冲区的长度是否大于一条完整消息的长度。
        {
            //拿出id
            byte[] _id = new byte[4];
            Array.Copy(data, 4, _id, 0, 4);//把协议ID从第4位缓存4位长度
            int id = BitConverter.ToInt32(_id, 0);//获得协议ID

            //包体
            byte[] body = new byte[size];
            Array.Copy(data, 8, body, 0, size);//把包体从第8位缓存size位长度

            if (msgLength>_length)//如果接收到的数据长度大于这次取出的完整一条数据的长度，说明还有数据
            {
                for (int i = 0; i < msgLength - _length; i++)
                {
                    data[i] = data[_length + i];//前面取完一次完整消息了，把后面的消息前挪
                }
            }
            msgLength -= _length;//减掉已经取完的消息长度
            Debug.Log($"收到服务器响应:{id}");
            Debug.Log($"接收到的数据内容:{Encoding.UTF8.GetString(body, 0, body.Length)}");
            //根据id进行处理,,实际项目一般使用观察者模式，监听id和Action事件绑定
            switch (id)
            {
                case 1001://注册请求
                    RigisterMsgHandle(body);
                    break;
                case 1002://登录业务
                    LoginMsgHandle(body);
                    break;
                case 1003://聊天业务
                    ChatMsgHandle(body);
                    break;
                case 1004://添加好友
                    AddFriendHandle(body);
                    break;
                case 1005://朋友上线下线
                    FriendOnOfflineHandle(body);
                    break;
            }
        }
    }
}
```

# 心跳机制，通过心跳包维持连接

TCP通信会自动断开。造成这种情况的原因是保持连接的通道如果长时间不通信就会被路由关闭连接 。
## 长连接短连接概念

短连接：仅进行一次通信即关闭连接

长连接：每次通信完毕后不关闭连接

## 连接的保活

当双方已经建立了连接，但因为网络问题，链路不通，这样长连接就不能使用了。因此，需要使用一些机制对长连接进行保活
## 应用层心跳

客户端会开启一个定时任务，定时对已经建立连接的对端应用发送请求（这里的请求是特殊的心跳请求），服务端则需要特殊处理该请求，返回响应。如果心跳持续多次没有收到响应，客户端会认为连接不可用，主动断开连接。

使用服务器向客户端发送心跳包，服务器每一个客户端连接后根据前文都有一个Client保存，在Client构造函数中只有保存客户端的tcpClient和Receive，需要加上PingPong心跳，维持客户端连接。

```CSharp
public Client(TcpClient tcpClient)
{
    client = tcpClient;
    Receive();
    PingPong();
}
//Handle的Switch(id)最后一个PingMsg处理收到的客户端Pong消息
private void Handle()
{
    //包体大小(4) 协议ID(4) 包体(byte[])
    if (msgLength >= 8)
    {
        byte[] _size = new byte[4];
        Array.Copy(data, 0, _size, 0, 4);//把包体大小从第0位缓存4位长度
        int size = BitConverter.ToInt32(_size, 0);//获得包体大小
    
        //本次要拿的长度
        var _length = 8 + size;//实际完整消息的长度：包体大小(4)+协议ID(4)+包体(byte[])
        if (msgLength>=_length)//判断数据缓冲区的长度是否大于一条完整消息的长度。
        {
            //拿出id
            byte[] _id = new byte[4];
            Array.Copy(data, 4, _id, 0, 4);//把协议ID从第4位缓存4位长度
            int id = BitConverter.ToInt32(_id, 0);//获得协议ID
    
            //包体
            byte[] body = new byte[size];
            Array.Copy(data, 8, body, 0, size);//把包体从第8位缓存size位长度
    
            if (msgLength>_length)//如果接收到的数据长度大于这次取出的完整一条数据的长度，说明还有数据
            {
                for (int i = 0; i < msgLength - _length; i++)
                {
                    data[i] = data[_length + i];//前面取完一次完整消息了，把后面的消息前挪
                }
            }
            msgLength -= _length;//减掉已经取完的消息长度
            if (id != (int)MsgID.PingMsg)
            {
                Console.WriteLine($"{DateTime.Now} | Message | 从{client.Client.RemoteEndPoint} | 接收的消息类型:{id} | 接收的消息内容:{Encoding.UTF8.GetString(body, 0, body.Length)}");
            }
            else
            {
                Console.WriteLine($"{DateTime.Now} | Pong    | 从{client.Client.RemoteEndPoint} | 接收的消息内容:Pong");
            }
            //根据id进行处理,,实际项目一般使用观察者模式，监听id和Action事件绑定
            switch (id)
            {
                case (int)MsgID.RegisterMsg://注册请求
                    RegisterMsgHandle(body);
                    break;
                case (int)MsgID.LoginMsg://登录业务
                    LoginMsgHandle(body);
                    break;
                case (int)MsgID.ChatMsg://聊天业务
                    ChatMsgHandle(body);
                    break;
                case (int)MsgID.AddFriend://添加好友
                    AddFriendHandle(body);
                    break;
                case (int)MsgID.OnOffline://账号下线
                    OnOfflineHandle(body);
                    break;
                case (int)MsgID.PingMsg:
                    PingPongHandle(body);
                    break;
            }
        }
    }
}

//接收客户端返回pong的处理，停止等待计时器，重置离线计数器
private void PingPongHandle(byte[] obj)
{
    waitTimer.Change(Timeout.Infinite, Timeout.Infinite);
    offlineCounter = 0;
}

//发送一个ping信号，维持链接
public void SendPing()
{
    SendToClient((int)MsgID.PingMsg, "ping");
}

bool waitPong = true;
int offlineCounter = 0;
Timer waitTimer;

//PingPong心跳维持客户端连接
private async void PingPong()
{
    while (client.Connected && waitPong)
    {
        //await Task.Delay(5000);
        SendPing();
        //开启计时器等待回复，若无回复，开始离线计数
        waitTimer = new Timer(CounterCallBack, null, 4000, Timeout.Infinite);
        await Task.Delay(6000);
    }
    //一旦退出循环说明客户端断开，移除客户端
    PlayerData.Instance.RemoveDisconnectClient(this);
}

//每隔5s执行一次，累计offlineCounter到3，表明没有收到客户端返回pong。说明离线
private void CounterCallBack(object state)
{
    ++offlineCounter;
    if (client.Client.Connected)
        Console.WriteLine($"{DateTime.Now} | Ping    | 等待客户端{client.Client.RemoteEndPoint}的Pong回复 | 正在离线计数...{offlineCounter}");
    if (offlineCounter == 3)
    {
        offlineCounter = 0;
        waitTimer.Change(Timeout.Infinite, Timeout.Infinite);
        waitTimer.Dispose();
        waitPong = false;
        Console.WriteLine($"{DateTime.Now} | Ping    | 客户端{client.Client.RemoteEndPoint}已断开连接...");
    }
}
```

客户端登录后，服务器开始发送ping维持连接，客户端回复pong。断开网络连接。服务器向客户端发送ping，没有等到pong开始进行离线计数，计数到3没收到pong说明客户端离线。

![](https://img-blog.csdnimg.cn/img_convert/48b8a8ee434459236f51ab1183f16f9e.png)

如果计数到3之前客户端重新连接，服务器将不移除登录客户端。

![](https://img-blog.csdnimg.cn/img_convert/a994ec6cf6b90e3e4d7b8442ececb348.png)

# 断线重连

Unity-Client运行时，Start就连接一次服务器（这里不论连接成功与否，不影响后面重连），下面都是客户端的脚本。

断线重连逻辑：当使用到的业务发送消息到服务器，等待回复，等待超时开始重连，等待回复的过程收到无论什么回复，只要收到了消息，说明连接到了服务器；如果没接收到消息，继续尝试重连，并再次发送消息等待回复。

```CSharp
private void Handle()
{
    //包体大小(4) 协议ID(4) 包体(byte[])
    if (msgLength >= 8)
    {
        byte[] _size = new byte[4];
        Array.Copy(data, 0, _size, 0, 4);//把包体大小从第0位缓存4位长度
        int size = BitConverter.ToInt32(_size, 0);//获得包体大小

        //本次要拿的长度
        var _length = 8 + size;//实际完整消息的长度：包体大小(4)+协议ID(4)+包体(byte[])

        while (msgLength>=_length)//判断数据缓冲区的长度是否大于一条完整消息的长度。
        {
            //拿出id
            byte[] _id = new byte[4];
            Array.Copy(data, 4, _id, 0, 4);//把协议ID从第4位缓存4位长度
            int id = BitConverter.ToInt32(_id, 0);//获得协议ID

            //包体
            byte[] body = new byte[size];
            Array.Copy(data, 8, body, 0, size);//把包体从第8位缓存size位长度

            if (msgLength>_length)//如果接收到的数据长度大于这次取出的完整一条数据的长度，说明还有数据
            {
                for (int i = 0; i < msgLength - _length; i++)
                {
                    data[i] = data[_length + i];//前面取完一次完整消息了，把后面的消息前挪
                }
            }
            msgLength -= _length;//减掉已经取完的消息长度
            if (id != (int)MsgID.PingMsg)
            {
                Debug.Log($"{DateTime.Now} | Message | 发送的消息类型:{id} | 接收的消息内容:{Encoding.UTF8.GetString(body, 0, body.Length)}");
            }
            else
            {
                Debug.Log($"{DateTime.Now} | Ping | 接收的消息内容:Ping");
            }
            WaitHandle?.Invoke(id, false, Encoding.UTF8.GetString(body, 0, body.Length));
            //根据id进行处理,,实际项目一般使用观察者模式，监听id和Action事件绑定
            switch (id)
            {
                case (int)MsgID.RegisterMsg://注册请求
                    RigisterMsgHandle(body);
                    break;
                case (int)MsgID.LoginMsg://登录业务
                    LoginMsgHandle(body);
                    break;
                case (int)MsgID.ChatMsg://聊天业务
                    ChatMsgHandle(body);
                    break;
                case (int)MsgID.AddFriend://添加好友
                    AddFriendHandle(body);
                    break;
                case (int)MsgID.OnOffline://朋友上线下线
                    FriendOnOfflineHandle(body);
                    break;
                case (int)MsgID.PingMsg://维持连接
                    PingHandle(body);
                    break;
            }
        }
    }
}

//一旦开始发送消息，就让客户端等待消息回复，开启定时器，如果定时器结束前没有收到回复，说明断开连接，在GameManager中进行重连
public event Action<int, bool, string> WaitHandle;
//按格式封装消息，发送到服务器
public void SendToServer(int id, string str)
{
    //Debug.Log("ID:" + id);
    var body = Encoding.UTF8.GetBytes(str);
    byte[] send_buff = new byte[body.Length + 8];

    int size = body.Length;

    var _size = BitConverter.GetBytes(size);
    var _id = BitConverter.GetBytes(id);

    Array.Copy(_size, 0, send_buff, 0, 4);
    Array.Copy(_id, 0, send_buff, 4, 4);
    Array.Copy(body, 0, send_buff, 8, body.Length);
    if (id != (int)MsgID.PingMsg)
    {
        Debug.Log($"{DateTime.Now} | Message | 发送的消息类型:{id} | 发送的消息内容:{Encoding.UTF8.GetString(body, 0, body.Length)}");
    }
    else
    {
        Debug.Log($"{DateTime.Now} | Pong | 发送的消息内容:Pong");
    }
    
    Client.Instance.Send(send_buff);
    //把发送的消息和id传递给订阅WaitHandle的方法，一旦断联，需要重连并重新发送消息。
    WaitHandle?.Invoke(id, true, Encoding.UTF8.GetString(body, 0, body.Length));
}
```

GameManager作用是监听是否发送了消息WaitHandle是否执行，发送了消息开始计时器（只要不是退出业务和pong业务，都不需要服务器回复，不需要即使），并且缓存WaitHandle传进来刚刚尝试发送的消息。计时结束前，如果收到了消息WaitHandle执行，就停止等待，说明没有断网，，，如果计时结束前，没收到消息WaitHandle没有执行，说明断网，调用Client.Instance.ReConnect重连，重连时传进去刚刚未发送成功的消息和id，重连-再次发送-等待（计时-失败-重连-再次发送-等待），知道重连成功，发送消息-收到回复。

```CSharp
public class GameManager : MonoBehaviour
{
    public bool beginWait = false;
    private int id = 0;
    private string msg = "";
    // Start is called before the first frame update
    void Start()
    {
        MessageHelper.Instance.WaitHandle += StartTimer;
        Client.Instance.Start();
        //打开登录界面
        var loginPrefab = Resources.Load<GameObject>("LoginView");
        var loginView = GameObject.Instantiate<GameObject>(loginPrefab);
        loginView.AddComponent<LoginView>();
    }

    private void StartTimer(int msgID, bool wait, string body)
    {
        //只有timer没满以及不是发送下线信息时和ping消息，才等待，超时需要重连
        if (currentCount != waitCount && msgID != (int)MsgID.OnOffline && msgID != (int)MsgID.PingMsg)
        {
            beginWait = wait;
            currentCount = 0;
            id = msgID;
            msg = body;
        }
    }

    private void FixedUpdate()
    {
        if (beginWait)
        {
            Timer(id, msg);
        }
    }
    
    public int currentCount;
    public int waitCount = 100;
    public void Timer(int msgID, string body)
    {
        currentCount++;
        if (currentCount == waitCount)
        {
            currentCount = 0;
            beginWait = false;
            Client.Instance.IsConnected = false;
            Client.Instance.ReConnect(msgID, body);
        }
    }

    private void OnDestroy()
    {
        Client.Instance.isRunning = false;
        MessageHelper.Instance.WaitHandle -= StartTimer;
        //退出账号
        if (PlayerData.Instance.LoginMsgS2C != null)
        {
            MessageHelper.Instance.SendOnOfflineMsg(PlayerData.Instance.LoginMsgS2C.account, 0);
        }
        Client.Instance.CloseClient();
    }
}
```

Client主要负责ReConnect，尝试重连成功会发送刚刚未发送成功的消息，再次等待回复，计时，若失败继续调用重连。

```CSharp
public class Client
{
    private static Client instance = new Client();
    public static Client Instance => instance;//单例模式便于调用

    private TcpClient client;//跟服务器通信需要调用client
    private static bool isConnected = false;
    private Thread checkStateThread;
    public bool isRunning = true;
    public bool IsConnected
    {
        get { return isConnected; }
        set { isConnected = value; }
    }

    public void Start()
    {
        //client = new TcpClient();
        Connect();
    }

    //连接服务器接口，开始时调用
    public async void Connect()
    {
        while (!isConnected)
        {
            try
            {
                if (client != null)
                {
                    client.Close();
                }
                client = new TcpClient();
                await client.ConnectAsync("6517382f5e.zicp.fun", 39047);
                if (client.Connected)
                {
                    Debug.Log("TCP 连接成功");
                    isConnected = true;

                    Receive();
                }
            }
            catch (Exception e)
            {
                Debug.Log(e.Message);
                client.Close();
            }
        }
    }
    
    public async void ReConnect(int msgID, string body)
    {
        while (!isConnected)
        {
            try
            {
                if (client != null)
                {
                    client.Close();
                }
                client = new TcpClient();
                await client.ConnectAsync("6517382f5e.zicp.fun", 39047);
                isConnected = true;
                if (client.Connected)
                {
                    Debug.Log("重连成功");
                    //根据对应界面的功能，实现不同的重连网络需求
                    MessageHelper.Instance.SendToServer(msgID, body);

                    Receive();
                }
            }
            catch (Exception e)
            {
                Debug.Log(e.Message);
                client.Close();
            }
        }
    }

    //接收接口
    public async void Receive()
    {
        while (client.Connected)
        {
            try
            {
                byte[] buff = new byte[4096];
                int length = await client.GetStream().ReadAsync(buff, 0, buff.Length);
                if (length > 0)
                {
                    //Debug.Log($"{DateTime.Now} | 接收到的数据长度：{length}");
                    MessageHelper.Instance.CopyToData(buff, length);//接收到处理CopyToData给MessageHelper处理信息
                }
                else
                {
                    client.Close();
                    isConnected = false;
                }
            }
            catch (Exception e)
            {
                Debug.Log(e.Message);
                isConnected = false;
                client.Close();
            }
        }
    }
    
    //发送接口
    public async void Send(byte[] data)
    {
        try
        {
            await client.GetStream().WriteAsync(data, 0, data.Length);
            //Debug.Log("发送成功! " + $"发送的消息内容：{Encoding.UTF8.GetString(data, 0, data.Length)}");
        }
        catch (Exception e)
        {
            Debug.Log(e.Message);
            isConnected = false;
            client.Close();
        }
    }

    public void CloseClient()
    {
        client?.Close();
    }
}
```

# 输出消息格式化

```CSharp
Console.WriteLine($"{DateTime.Now} | Message | 向{client.Client.RemoteEndPoint} | 发送的消息类型:{id} | 发送的消息内容:{Encoding.UTF8.GetString(body, 0, body.Length)}");
```

![](https://img-blog.csdnimg.cn/img_convert/0bca08be7d92fe2ae16d91b674adc144.png)

![](https://img-blog.csdnimg.cn/img_convert/3a1a90bf425d718402a35ad526873743.png)