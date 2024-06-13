---
tags:
  - socket
---
# [[深入解析OSI七层模型及各层工作原理（我只能帮你到这了）-腾讯云开发者社区-腾讯云]]

# [[ISO七层协议模型架构、各层的解析及其协议_iso协议-CSDN博客]]

# [[计算机网络：OSI七层协议和各种协议介绍]]

# OSI网络七层模型与TCP/IP四层模型对比
![[（图解1）网络模型.png|490]]

# 详细的TCP/IP网络模型
![[Pasted image 20240613154301.png|480]]
# TCP/IP定义以及模型各层的概念
TCP/IP(Transmission Control Protocol/Internet Protocol)即传输控制协议/网间协议，是一个工业标准的协议集，它是为广域网(WANs)设计的。UDP(User Data Protocol,用户数据报协议)是与TCP相对应的协议。它是属于TCP/IP协议族中的一种。
- 应用层(Applicatio):应用层是个很广泛的概念，有一些基本相同的系统级TCPP应用以及应用协议，也有许多的企业商业应用和互联网应用。
- 传输层(Transport):传输层包括UDP和TCP,UDP几乎不对报文进行检查，而TCP提供传输保证。
- 网络层(Network):网络层协议由一系列协议组成，包括ICMP、IGMP、RIP、OSPF、IP(v4,v6)等。
- 链路层(Lik:又称为物理数据网络接口层，负责报文传输。