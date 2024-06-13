---
tags:
  - socket
  - 网络编程
---
# [[深入解析OSI七层模型及各层工作原理（我只能帮你到这了）-腾讯云开发者社区-腾讯云]]

# [[ISO七层协议模型架构、各层的解析及其协议_iso协议-CSDN博客]]

# [[计算机网络：OSI七层协议和各种协议介绍]]

# OSI网络七层模型与TCP/IP四层模型对比
![[（图解1）网络模型.png|490]]

# 详细的TCP/IP网络模型
![[（图解2）详细的tcp-ip模型.png|490]]

# TCP/IP定义以及模型各层的概念

TCP/IP(Transmission Control Protocol/Internet Protocol)即传输控制协议/网间协议，是一个工业标准的协议集，它是为广域网(WANs)设计的。UDP(User Data Protocol,用户数据报协议)是与TCP相对应的协议。它是属于TCP/IP协议族中的一种。
- 应用层(Applicatio):应用层是个很广泛的概念，有一些基本相同的系统级TCPP应用以及应用协议，也有许多的企业商业应用和互联网应用。
- 传输层(Transport):传输层包括UDP和TCP,UDP几乎不对报文进行检查，而TCP提供传输保证。
- 网络层(Network):网络层协议由一系列协议组成，包括ICMP、IGMP、RIP、OSPF、IP(v4,v6)等。
- 链路层(Lik:又称为物理数据网络接口层，负责报文传输。

# 网络交互

## 网络编程相关

互联网通过IP定位电脑，通过端口定位电脑中的程序，程序之间通过协议定义通讯数据格式

## Socket相关概念

### IP地址

- 每台联网的电脑都有一个唯一的IP地址。
- 长度32位，分为四段，每段8位，用十进制数字表示，每段范围0~255
- 特殊IP:127.0.0.1用户本地网卡测试
- 版本：V4(32位)和V6(128位，分为8段，每段16位)

### 端口

- 在网络上有很多电脑，这些电脑一般运行了多个网络程序。每种网络程序都打开一个S0ckt,并绑定到一个端口上，不同的端口对应于不同的网络程序。
- 常用端口：21FTP,25SMTP,110POP3,80HTTP,443 HTTPS

### 两种常用的socket类型

- 流式Socket(STREAM)：是一种面向连接的Socket，针对于面向连接的TCP服务应用，安全，但是效率低
- 数据报式Socket(DATAGRAM)：是一种无连接的Socket，对应于无连接的UDP服务应用，不安全（丢失，顺序混乱，在接收端要分析重排及要求重发)，但效率高

## Socket定义

Sockt的英文原义是"孔”或"插座”。作为进程通信机制，取后一种意思。通常也称作"套接字”，用于描述IP地址和端口，是一个通信链的句柄。（其实就是两个程序通信用的。）

Sockt非常类以于电话插座。以一个电话网为例：
- 电话的通话双方相当于相互通信的2个程序，电话号码就是IP地址。任何用户在通话之前，首先要占有一部电话机，相当于申请一个Socket，同时要知道对方的号码，相当于对方有一个国定的Socket。
- 然后向对方拨号呼叫，相当于发出**连接请求**。对方假如在场并空闲，拿起电话话筒，双方就可以正式通话，相当于**连接成功**。双方通话的过程，是一方向电话机发出信号和对方从电话机接收信号的过程，相当于向Socket发送数据和从Socket接收数据。通话结束后，一方挂起电话机相当于关闭Socket，**撤消连接**。
总结来说就是，**人通过【电话】可以通信，而程序通过【Socket】来通信。套接字就是程序间的电话机。**

## Socket流式（服务端和客户端）
![[（图解3）流式Socket.png|510]]
1. 服务端welcoming socket开始监听端口（负责监听客户端连接信息）
2. 客户端client socket连接服务端指定端口（负责接收和发送服务端消息）
3. 服务端welcoming socket监听到客户端连接，创建connection socket负责和客户端通信

### Socket的通讯过程

![[（图解5）socket通讯基本流程图.png|520]]
#### 服务端

- 申请个socket
- 绑定到一个P地址和一个端口上
- 开启侦听，等待接授连接
- 服务器端接到连接请求后，产生一个新的sockt(端口大于1024)与客户端建立连接并进行通讯，原监听sockt继续监听

#### 客户端

- 申请一个socket
- 连接服务器（指明IP地址和端口号）

### Socket的构造函数

#### 连接通过构造函数完成

```CSharp
public Socket(AddressFamily addressFamily,SocketType socketType,ProtocolType protocolType)
```
- AddressFamily成员指定Socket用来解析地址的寻址方察。例如，InterNetwork指示当Socket使用一个IP版本4地址连接。
- SocketType定义要打开的Socket的类型
- Socket类使用ProtocolType枚举向Windows Sockets API通知所请求的协议

如下：
```CSharp
mySocket = new Socket(AddressFamily.InterNetwork,
					  SocketType.Stream,
					  ProtocolType.Tcp);
```

#### Socket方法

![[（图解4）socket类中的方法.png|530]]

## 传输协议

TCP：Transmission Control Protocol传输控制协议TCP是一种面向连接（连接导向）的、可靠的、基于字节流的运输层（Transport layer）通信协议。特点如下：
- 面向连接的协议，数据传输必须要建立连接，所以在TCP中需要连接时间。
- 传输数据大小限制，一旦连接建立，双方可以按统一的格式传输大的数据。
- 一个可靠的协议，确保接收方完全正确地获取发送方所发送的全部数据。

URP：User Datagram Protocol的简称，中文名是用户数据包协议，是OSI参考模型中一种无连接的传输层协议，提供面向事务的简单不可靠信息传送服务。特点如下：
- 每个数据报中都给出了完整的地址信息，因此无需要建立发送方和接收方的连接
- UDP传输数据时是有大小限制的，每个被传输的数据报必须限定在64KB之内。
- UDP是一个不可靠的协议，发送方所发送的数据报并不一定以相同的次序到达接收方。