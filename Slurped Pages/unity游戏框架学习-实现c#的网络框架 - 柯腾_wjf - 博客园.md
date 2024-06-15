---
link: https://www.cnblogs.com/wang-jin-fu/p/11121654.html
excerpt: 概述链接：https://www.cnblogs.com/wang-jin-fu/p/10975660.html
  前面说道Socket负责和游服的通信，包括网络的连接、消息的接收、心跳包的发送、断线重连的监听和处理 那一个完整的网络模块包括几方面呢？（仅讨论客户端）
  1.建立和服务端的socket连
tags:
  - slurp/unity
  - slurp/c#
  - slurp/Socket链接
  - slurp/框架、设计模式
slurped: 2024-06-15T15:03:48.228Z
title: unity游戏框架学习-实现c#的网络框架 - 柯腾_wjf - 博客园
---

概述链接：[https://www.cnblogs.com/wang-jin-fu/p/10975660.html](https://www.cnblogs.com/wang-jin-fu/p/10975660.html "框架结构")

前面说道Socket负责和游服的通信，包括网络的连接、消息的接收、心跳包的发送、断线重连的监听和处理

那一个完整的网络模块包括几方面呢？（仅讨论客户端）

1.建立和服务端的socket连接，实现客户端-服务端两端的接收和发送功能。

2.消息协议的选择，网络消息的解析可以是json、xml、protobuf,本篇使用的是protobuf

3.消息缓存

4.消息的监听、分发、移除

5.客户端身份验证，由客户端、服务端生成密钥进行验证。

6.心跳包的实现，主要是检测客户端的连接情况，避免浪费服务端资源

如上所述，一套完整的unity的socket网络通信模块所包含的内容大概就是这些。

示例工程：链接: https://pan.baidu.com/s/1vJbo0ThXhShk9eJv3VNCuw 提取码: fngy  本篇文章资源连接

该工程主要是实现客户端-服务端两端的连接，以及消息的监听、派发、发送、接受等功能，心跳包未实现。

**一、创建一个socekt连接**

客户端代码如下：创建一个Socket对象，这个对象在客户端是唯一的，连接指定服务器IP和端口号

public void Connect(string host, int port)
    {
        if (string.IsNullOrEmpty(host))
        {
            Debug.LogError("NetMgr.Connect host is null");
            return;
        }

        //IP验证
        IPEndPoint ipEndPoint = null;
        Regex regex = new Regex("((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|[1-9])");
        Match match = regex.Match(host);
        if (match.Success)
        {
            // IP
            ipEndPoint = new IPEndPoint(IPAddress.Parse(host), port);
        }
        else
        {
            // 域名
            IPAddress[] addresses = Dns.GetHostAddresses(host);
            ipEndPoint = new IPEndPoint(addresses[0], port);
        }

        //新建连接，连接类型
        mSocket = new Socket(ipEndPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
        
        try
        {           
            mSocket.Connect(ipEndPoint);//链接IP和端口
        }
        catch (System.Exception e)
        {
            Debug.LogError(e.Message);
        }
    }

服务端代码：创建一个服务器Socket对象，并绑定服务器IP地址和端口号

public void InitSocket(string host, int port)
    {
        if (string.IsNullOrEmpty(host))
        {
            Debug.LogError("NetMgr.Connect host is null");
            return;
        }

        //IP验证
        IPEndPoint ipEndPoint = null;
        Regex regex = new Regex("((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|[1-9])");
        Match match = regex.Match(host);
        if (match.Success)
        {
            // IP
            ipEndPoint = new IPEndPoint(IPAddress.Parse(host), port);
        }
        else
        {
            // 域名
            IPAddress[] addresses = Dns.GetHostAddresses(host);
            ipEndPoint = new IPEndPoint(addresses[0], port);
        }

        //新建连接，连接类型
        mSocket = new Socket(ipEndPoint.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
        
        try
        {
            mSocket.Bind(ipEndPoint);//绑定IP和端口          
            mSocket.Listen(5);//设置监听数量   
        }
        catch (System.Exception e)
        {
            Debug.LogError(e.Message);
        }
    }

**二.protobuf协议生成、解析**

我们在存储一串数据的时候，无论这串数据里包含了哪些数据以及哪些数据类型，当我们拿到这串数据在解析的时候能够知道该怎么解析，这是定义协议格式的目标。它是协议解析的规则。

简单的来说就是，当你传给我一串数据的时候，我是用什么样的规则知道这串数据里的内容的。JSON就制定了这么一个规则，这个规则以字符串KEY-VALUE，以及一些辅助的符号‘{’,'}','[',']'组合而成，这个规则非常通用，以至于任何人拿到任何JSON数据都能知道里面有什么数据。

protobuf优势：这里只比较json（JSON与同是纯文本类型格式的XML相比较，JSON不需要结束标签，JSON更短，JSON解析和读写的速度更快，所以json是优于xml的）

序列化和反序列化效率比 xml 和 json 都高，序列化的二进制文件更小（传输就更快，节省流量）适合网络传输节省io，Protobuf 数据使用二进制形式，把原来在JSON,XML里用字符串存储的数字换成用byte存储，大量减少了浪费的存储空间。与MessagePack相比，Protobuf减少了Key的存储空间，让原本用字符串来表达Key的方式换成了用整数表达，不但减少了存储空间也加快了反序列化的速度。  
Json明文，维护麻烦。  
protobuf提供的多语言支持，所以使用protobuf作为数据载体定制的网络协议具有很强的跨语言特性

缺点：  
通用性差  
二进制存储易读性很差，除非你有 .proto 定义，否则你没法直接读出 Protobuf 的任何内容  
需要依赖于工具生成代码  
需要生成数据解析类，占用空间  
协议序号也要占空间，序号越大占空间越大，当序号小于16时无需额外增加字节就可以表示。

1.protobuf语法：官方网站:https://developers.google.com/protocol-buffers/docs/proto3，英文不好可参考下面的中文语法，这边不做赘述

中文语法：https://blog.csdn.net/u011518120/article/details/54604615

大概样子如下：

package protocol;

//握手验证
message Handshake{
    required string token= 1;
}

//玩家信息
message PlayerInfo{
    required int32 account= 1;
    required string password= 2;    
    required string name= 3;
}

2.协议解析类的生成，如下图所示，双击protoToCs.bat文件就可以把proto文件夹下的.proto协议生成c#文件并存储在generate目录下，proto和生成的cs目录更改在protoToCs文件里面

![](https://img2018.cnblogs.com/blog/1268375/201907/1268375-20190702162341611-1488288356.png)

@echo off
 @rem 对该目录下每个*.prot文件做转换
 set curdir=%cd%
 set protoPath=%curdir%\proto\
 set generate=%curdir%\generate\
 echo %curdir%
 echo %protoPath%

 for /r %%j in (*.proto) do ( 
    echo %%j
    protogen -i:"%%j" -o:%generate%%%~nj.cs 
 )
 pause

3.协议的解包、封包（解析类的使用），这边协议的格式是  协议数据长度+协议id+协议数据

当要发送消息给服务端（或客户端）时，调用PackNetMsg封装成二进制流数据，接受到另一端的消息时调用UnpackNetMsg解析成对应的数据类，在分发给客户端使用

协议封包：

/// <summary>  
    /// 序列化  
    /// </summary>  
    /// <typeparam name="T"></typeparam>  
    /// <param name="msg"></param>  
    /// <returns></returns>  
    static public byte[] Serialize<T>(T msg)
    {
        byte[] result = null;
        if (msg != null)
        {
            using (var stream = new MemoryStream())
            {
                Serializer.Serialize<T>(stream, msg);
                result = stream.ToArray();
            }
        }
        return result;
    }
  
　　//封包，依次写入协议数据长度、协议id、协议内容
    public static byte[] PackNetMsg(NetMsgData data)
    {
        ushort protoId = data.ProtoId;
        MemoryStream ms = null;
        using (ms = new MemoryStream())
        {
            ms.Position = 0;
            BinaryWriter writer = new BinaryWriter(ms);
            byte[] pbdata = Serialize(data.ProtoData);
            ushort msglen = (ushort)pbdata.Length;
            writer.Write(msglen);
            writer.Write(protoId);
            writer.Write(pbdata);
            writer.Flush();
            return ms.ToArray();
        }
    }

解包：

/// <summary>  
    /// 反序列化  
    /// </summary>  
    /// <typeparam name="T"></typeparam>  
    /// <param name="message"></param>  
    /// <returns></returns>  
    static public T Deserialize<T>(byte[] message)
    {
        T result = default(T);
        if (message != null)
        {
            using (var stream = new MemoryStream(message))
            {
                result = Serializer.Deserialize<T>(stream);
            }
        }
        return result;
    }
  
　　//解包，依次写出协议数据长度、协议id、协议数据内容
    public static NetMsgData UnpackNetMsg(byte[] msgData)
    {
        MemoryStream ms = null;

        using (ms = new MemoryStream(msgData))
        {
            BinaryReader reader = new BinaryReader(ms);
            ushort msgLen = reader.ReadUInt16();
            ushort protoId = reader.ReadUInt16();

            if (msgLen <= msgData.Length - 4)
            {
                IExtensible protoData = CreateProtoBuf.GetProtoData((ProtoDefine)protoId, reader.ReadBytes(msgLen));
                return NetMsgDataPool.GetMsgData((ProtoDefine)protoId, protoData, msgLen);
            }
            else
            {
                Debug.LogError("协议长度错误");
            }
        }

        return null;
    }

然后这边会需要根据协议的id去生成对应的解析类，有两种方式，一种使用switch，一种是用反射的方式去生成，放射应该效率会高一点，本篇使用的是第一种（反射玩不转，我知道怎么根据类名生成指定的类，但是当参数是泛型是就盟了，评论如果有知道欢迎指出来，例如我知道类名xxx,我怎么调用Serializer.Deserialize<T>(stream);这个方法呢，就是我要怎么用xxx替换T呢）

switch实现方式：

//动态修改，不要手动修改

using protocol;
public class CreateProtoBuf
{
  public static ProtoBuf.IExtensible GetProtoData(ProtoDefine protoId, byte[] msgData)
  {
      switch (protoId)
      {
            case ProtoDefine.Handshake:
                return NetUtilcs.Deserialize<Handshake>(msgData);
            case ProtoDefine.ReqLogin:
                return NetUtilcs.Deserialize<ReqLogin>(msgData);
            case ProtoDefine.ReqRegister:
                return NetUtilcs.Deserialize<ReqRegister>(msgData);
            case ProtoDefine.RetLogin:
                return NetUtilcs.Deserialize<RetLogin>(msgData);
            case ProtoDefine.RetRegister:
                return NetUtilcs.Deserialize<RetRegister>(msgData);
          default:
              return null;
      }
  }
}

createbuf这个类如果手撸的话，几百种协议还是很头疼的，所以我这边是写了个工具去生成这个类，模板也是可以实现这个功能的

public static void WriteCreateBufClass()
    {
        using (StreamWriter sw = new StreamWriter(Application.dataPath + "/Scripts/Engine/Net/CreateProtoBuf.cs", false))
        {
            sw.WriteLine("//动态修改，不要手动修改\n");
            sw.WriteLine("using protocol;");
            sw.WriteLine("public class CreateProtoBuf");
            sw.WriteLine("{");
            sw.WriteLine("  public static ProtoBuf.IExtensible GetProtoData(ProtoDefine protoId, byte[] msgData)");
            sw.WriteLine("  {");
            sw.WriteLine("      switch (protoId)");
            sw.WriteLine("      {");

            foreach (int value in Enum.GetValues(typeof(ProtoDefine)))
            {
                string strName = Enum.GetName(typeof(ProtoDefine), value);//获取名称
                sw.WriteLine(string.Format("            case ProtoDefine.{0}:", strName));
                sw.WriteLine(string.Format("                return NetUtilcs.Deserialize<{0}>(msgData);", strName));
            }

            sw.WriteLine("          default:");
            sw.WriteLine("              return null;");
            sw.WriteLine("      }");
            sw.WriteLine("  }");
            sw.WriteLine("}");
        }
    }

这样协议的生成、解析都有了，剩下的就是消息的管理了

 **三、消息的缓存、接受、发送**

客户端消息队列：总共生成四个缓存队列，两个子线程，一个用于发送消息，一个用于接收消息，主要是防止同时接受、发送多条信息，以及实现转菊花的效果（发送消息开始转菊花，服务器回包后结束菊花，防止重复发送消息）

发送代码如下：创建两个队列，一个用于存储主线程的等待发送的队列（由各模块调用），一个用于子线程向服务器发送消息（使用支线程向socket发送消息，减少主线程压力）

void Send()
    {
        while (this.mIsRunning)
        {
            if (mSendingMsgQueue.Count == 0)
            {
                lock (this.mSendLock)
                {
                    while (this.mSendWaitingMsgQueue.Count == 0)
                        Monitor.Wait(this.mSendLock);
                    Queue<NetMsgData> temp = this.mSendingMsgQueue;
                    this.mSendingMsgQueue = this.mSendWaitingMsgQueue;
                    this.mSendWaitingMsgQueue = temp;
                }                
            }
            else
            {
                try
                {
                    NetMsgData msg = this.mSendingMsgQueue.Dequeue();
                    byte[] data = NetUtilcs.PackNetMsg(msg);
                    mSocket.Send(data, data.Length, SocketFlags.None);
                    Debug.Log("client send: " + (ProtoDefine)msg.ProtoId);
                }
                catch (System.Exception e) {
                    Debug.LogError(e.Message);
                    Disconnect();
                }
            }
        }

        this.mSendingMsgQueue.Clear();
        this.mSendWaitingMsgQueue.Clear();
    }
  
　　//业务调用接口
    public void SendMsg(ProtoDefine protoType, IExtensible protoData)
    {
        if (!this.mIsRunning) return;
        lock (this.mSendLock)
        {
            mSendWaitingMsgQueue.Enqueue(NetMsgDataPool.GetMsgData(protoType, protoData));
            Monitor.Pulse(this.mSendLock);
        }
    }

数据的接受：创建两个队列，一个用于缓存子线程从服务器接受的消息，一个用于向主线程分发消息

这边的update方法需要由主线程调用，或者使用协程也是可以实现的。

void Receive()
    {
        byte[] data = new byte[1024];
        while (this.mIsRunning)
        {
            try
            {
                //将收到的数据取出来
                int len = mSocket.Receive(data);
                NetMsgData receive = NetUtilcs.UnpackNetMsg(data);
                Debug.Log("client receive : " + (ProtoDefine)receive.ProtoId);

                lock (this.mRecvLock)
                {
                    this.mRecvWaitingMsgQueue.Enqueue(receive);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError(e.Message);
                Disconnect();
            }
            
        }
    }

    public void Update()
    {
        if (!this.mIsRunning) return;

        if (this.mRecvingMsgQueue.Count == 0)
        {
            lock (this.mRecvLock)
            {
                if (this.mRecvWaitingMsgQueue.Count > 0)
                {
                    Queue<NetMsgData> temp = this.mRecvingMsgQueue;
                    this.mRecvingMsgQueue = this.mRecvWaitingMsgQueue;
                    this.mRecvWaitingMsgQueue = temp;
                }
            }
        }
        else
        {
            while (this.mRecvingMsgQueue.Count > 0)
            {
                NetMsgData msg = this.mRecvingMsgQueue.Dequeue();
                //发送给逻辑处理
                NetMsg.DispatcherMsg(msg);
            }
        }
    }

**四、消息的监听、派发，业务通过这个类和socket交互**

using System;
using System.Collections.Generic;
using ProtoBuf;
using protocol;

public delegate void NetCallBack(IExtensible msgData);

/// <summary>
/// 业务和socket交互的中间层
/// </summary>
public class NetMsg
{
    private static Dictionary<ProtoDefine, Delegate> m_EventTable = new Dictionary<ProtoDefine, Delegate>();

    /// <summary>
    /// 监听指定的消息协议
    /// </summary>
    /// <param name="protoType"></param> 需要监听的消息
    /// <param name="callBack"></param> 当接收到服务端的消息时，需要触发的消息
    public static void ListenerMsg(ProtoDefine protoType, NetCallBack callBack)
    {
        if (!m_EventTable.ContainsKey(protoType))
        {
            m_EventTable.Add(protoType, null);
        }

        m_EventTable[protoType] = (NetCallBack)m_EventTable[protoType] + callBack;
    }

    /// <summary>
    /// 移除监听某条消息
    /// </summary>
    /// <param name="protoType"></param>
    /// <param name="callBack"></param>
    public static void RemoveListenerMsg(ProtoDefine protoType, NetCallBack callBack)
    {
        if (m_EventTable.ContainsKey(protoType))
        {
            m_EventTable[protoType] = (NetCallBack)m_EventTable[protoType] - callBack;

            if (m_EventTable[protoType] == null)
            {
                m_EventTable.Remove(protoType);
            }
        }     
    }

    /// <summary>
    /// 接收到服务端消息时，会调用这个接口通知监听这调协议的业务
    /// </summary>
    /// <param name="msgData"></param>
    public static void DispatcherMsg(NetMsgData msgData)
    {
        ProtoDefine protoType = (ProtoDefine)msgData.ProtoId;
        Delegate d;
        if (m_EventTable.TryGetValue(protoType, out d))
        {
            NetCallBack callBack = d as NetCallBack;
            if (callBack != null)
            {
                callBack(msgData.ProtoData);
            }
        }
    }

    /// <summary>
    /// 向服务端发送消息
    /// </summary>
    /// <param name="protoType"></param>
    /// <param name="protoData"></param>
    public static void SendMsg(ProtoDefine protoType, IExtensible protoData)
    {
        SocketClint.Instance.SendMsg(protoType, protoData);
    }
}

**五、客户端身份验证**，做完上面的步骤，你已经可以生成、解析、使用消息协议，也可以和服务端通信了，其实通信功能就已经做完了，但是客户端验证和心跳包又是游戏绕不过去的一个步骤，所以  我们继续～

认证的过程大概是这样子的（以我当前的项目为例）

1.客户端随机生成一个密钥client_key，使用某种加密算法通过刚生成的密钥client_key将自己的client_token加密，然后将加密后的client_token和密钥发送给登录服（client_token只是一个字符串，客户端和服务端都有，这边的加密算法加密时需要一个密钥，服务端和客户端的加密算法是一样的）

2.登录服收到客户端的消息，通过客户端发送的密钥client_key解密出客户端的client_token，通过比对这个client_token能确定是不是正确的客户端，如果是，登录服随机生成一个密钥server_key，并将使用server_key加密后的登录服server_token连同server_key发送给客户端

3.客户端收到登录服返回的消息，通过登录服发送的密钥server_key解密出登录服的server_token，通过比对这个server_token能确定是不是正确的登录服

4.双方身份验证后进行账号验证，客户端重新生成密钥client_key2，将自己的账号、密码、设备id等信息加密成client_info连同client_key2发送给登录服

5.登录服接收到客户端消息后，过客户端发送的密钥client_key2解密出客户端的client_info，通过比对账号、密码信息，返回一个游服的token，并把该token同步给游服

6.客户端通过登录服返回的游服token登录游服，关闭登录服连接

那么为什么要有登录服呢，我个人的理解是1.登录服可以很大的分摊游服的压力，特别是开服的时候2.游戏服一般会有很多（例如slg的王国），而登录服只会有一个？好吧  这个有知道的大神麻烦在评论告诉我下

**六、心跳包**，具体可以参考[https://gameinstitute.qq.com/community/detail/101837](https://gameinstitute.qq.com/community/detail/101837 "Socket心跳包机制")

心跳包主要用于长连接的保活和断线处理，socket本身的断开通知不是很靠谱，有时候客户端断开网络，Socket并不能实时监测到，服务器还维持这个客户端不必要的引用

心跳包之所以叫心跳包是因为：它像心跳一样每隔固定时间发一次，以此来告诉服务器，这个客户端还活着加了服务器的负荷

怎么发送心跳？

1：轮询机制：概括来说是服务端定时主动的与客户端通信，询问当前的某种状态，客户端返回状态信息，客户端没有返回，则认为客户端已经宕机，然后服务端把这个客户端的宕机状态保存下来，如果客户端正常，那么保存正常状态。如果客户端宕机或者返回的是定义

的失效状态那么当前的客户端状态是能够及时的监控到的，如果客户端宕机之后重启了那么当服务端定时来轮询的时候，还是可以正常的获取返回信息，把其状态重新更新。

2：心跳机制：最终得到的结果是与轮询一样的但是实现的方式有差别，心跳不是服务端主动去发信息检测客户端状态，而是在服务端保存下来所有客户端的状态信息，然后等待客户端定时来访问服务端，更新自己的当前状态，如果客户端超过指定的时间没有来更新状态，则认为客户端已经宕机。  
心跳比起轮询有两个优势：1.避免服务端的压力2.灵活好控制