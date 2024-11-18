---
link: https://blog.csdn.net/cj_eryue/article/details/131046881
byline: 成就一亿技术人!
excerpt: TCP协议的粘包和拆包问题是指在数据传输中，发送方和接收方之间数据的粘连或拆散导致数据解析错误的现象。解决方法包括固定数据大小、自定义请求协议和特殊字符结尾。而HTTP协议采用读取请求行/请求头、响应行/响应头的方式来解决粘包问题，但也存在解析复杂和在转发场景下难以处理的问题。
tags:
  - slurp/什么是tcp粘包
  - slurp/拆包。解决方式是什么
slurped: 2024-06-18T05:58:26.477Z
title: 聊聊TCP协议的粘包、拆包以及http是如何解决的？_什么是tcp粘包,拆包。解决方式是什么-CSDN博客
---

**目录**

[一、粘包与拆包是什么？](https://blog.csdn.net/cj_eryue/article/details/131046881#%E4%B8%80%E3%80%81%E7%B2%98%E5%8C%85%E4%B8%8E%E6%8B%86%E5%8C%85%E6%98%AF%E4%BB%80%E4%B9%88%EF%BC%9F)

[二、粘包与拆包为什么发生？](https://blog.csdn.net/cj_eryue/article/details/131046881#%E4%BA%8C%E3%80%81%E7%B2%98%E5%8C%85%E4%B8%8E%E6%8B%86%E5%8C%85%E4%B8%BA%E4%BB%80%E4%B9%88%E5%8F%91%E7%94%9F%EF%BC%9F)

[三、遇到粘包、拆包怎么办？](https://blog.csdn.net/cj_eryue/article/details/131046881#%E4%B8%89%E3%80%81%E9%81%87%E5%88%B0%E7%B2%98%E5%8C%85%E3%80%81%E6%8B%86%E5%8C%85%E6%80%8E%E4%B9%88%E5%8A%9E%EF%BC%9F)

[解决方案1：固定数据大小](https://blog.csdn.net/cj_eryue/article/details/131046881#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%881%EF%BC%9A%E5%9B%BA%E5%AE%9A%E6%95%B0%E6%8D%AE%E5%A4%A7%E5%B0%8F)

[解决方案2：自定义请求协议](https://blog.csdn.net/cj_eryue/article/details/131046881#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%882%EF%BC%9A%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%B7%E6%B1%82%E5%8D%8F%E8%AE%AE)

[解决方案3：特殊字符结尾](https://blog.csdn.net/cj_eryue/article/details/131046881#%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%883%EF%BC%9A%E7%89%B9%E6%AE%8A%E5%AD%97%E7%AC%A6%E7%BB%93%E5%B0%BE)

 [四、HTTP如何解决粘包问题的？](https://blog.csdn.net/cj_eryue/article/details/131046881#%C2%A0%E5%9B%9B%E3%80%81HTTP%E5%A6%82%E4%BD%95%E8%A7%A3%E5%86%B3%E7%B2%98%E5%8C%85%E9%97%AE%E9%A2%98%E7%9A%84%EF%BC%9F)

[4.1、读取请求行/请求头、响应行/响应头](https://blog.csdn.net/cj_eryue/article/details/131046881#4.1%E3%80%81%E8%AF%BB%E5%8F%96%E8%AF%B7%E6%B1%82%E8%A1%8C%2F%E8%AF%B7%E6%B1%82%E5%A4%B4%E3%80%81%E5%93%8D%E5%BA%94%E8%A1%8C%2F%E5%93%8D%E5%BA%94%E5%A4%B4)

[4.2、 怎么读取body数据呢？](https://blog.csdn.net/cj_eryue/article/details/131046881#4.2%E3%80%81%20%E6%80%8E%E4%B9%88%E8%AF%BB%E5%8F%96body%E6%95%B0%E6%8D%AE%E5%91%A2%EF%BC%9F)

[4.2.1、 Content-Length 描述](https://blog.csdn.net/cj_eryue/article/details/131046881#4.2.1%E3%80%81%C2%A0Content-Length%20%E6%8F%8F%E8%BF%B0)

[4.2.2、 chunked描述](https://blog.csdn.net/cj_eryue/article/details/131046881#4.2.2%E3%80%81%C2%A0chunked%E6%8F%8F%E8%BF%B0)

[4.2.3 优/缺点](https://blog.csdn.net/cj_eryue/article/details/131046881#4.3.%20%E4%BC%98%2F%E7%BC%BA%E7%82%B9)

---

TCP的粘包和拆包问题往往出现在基于TCP协议的通讯中，比如RPC框架、Netty等。

## 一、粘包与拆包是什么？

TCP在接受数据的时候，有一个滑动窗口来控制接受数据的大小，这个滑动窗口你就可以理解为一个缓冲区的大小。缓冲区满了就会把数据发送。数据包的大小是不固定的，有时候比缓冲区大有时候小。  
如果一次请求发送的数据量比较小，没达到缓冲区大小，TCP则会将多个请求合并为同一个请求进行发送，这就形成了粘包问题；  
如果一次请求发送的数据量比较大，超过了缓冲区大小，TCP就会将其拆分为多次发送，这就是拆包，也就是将一个大的包拆分为多个小包进行发送。

![](https://img-blog.csdnimg.cn/864571e427ea43eeb8db63e4bcd53455.png) 

## 二、粘包与拆包为什么发生？

1.TCP会发生粘包问题：TCP 是面向连接的传输协议,TCP 传输的数据是以流的形式,而流数据是没有明确的开始结尾边界,所以 TCP 也没办法判断哪一段流属于一个消息;TCP协议是流式协议;所谓流式协议,即协议的内容是像流水一样的字节流,内容与内容之间没有明确的分界标志,需要认为手动地去给这些协议划分边界。  
粘包时：发送方每次写入数据 < 接收方套接字(Socket)缓冲区大小。  
拆包时：发送方每次写入数据 > 接收方套接字(Socket)缓冲区大小。

2.UDP不会发生粘包问题：UDP具有保护消息边界,在每个UDP包中就有了消息头(UDP长度、源端口、目的端口、校验和)。

粘包拆包问题在数据链路层、网络层以及传输层都有可能发生。日常的网络应用开发大都在传输层进行，由于UDP有消息保护边界，不会发生粘包拆包问题，因此粘包拆包问题只发生在TCP协议中

## 三、遇到粘包、拆包怎么办？

先用简单的代码来演示一下粘包和拆包问题

```
package com.cjian.socket.stickBagAndUnpack;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 10:18
 * @Des:
 */
public class Server {
    // 字节数组的长度
    private static final int BYTE_LENGTH = 20;

    public static void main(String[] args) throws IOException {
        // 创建 Socket 服务器
        ServerSocket serverSocket = new ServerSocket(8888);
        // 获取客户端连接
        Socket clientSocket = serverSocket.accept();
        // 得到客户端发送的流对象
        InputStream is = clientSocket.getInputStream();
        while (true) {
            // 循环获取客户端发送的信息
            byte[] bytes = new byte[BYTE_LENGTH];
            // 读取客户端发送的信息
            try {
                int count = is.read(bytes, 0, BYTE_LENGTH);
                if (count > 0) {
                    // 成功接收到有效消息并打印
                    System.out.println("接收到客户端的信息是:" + new String(bytes));
                }
                count = 0;
            } catch (Exception e) {
                // ignore
            }
        }
    }
}
```

```
package com.cjian.socket.stickBagAndUnpack;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 10:20
 * @Des:
 */
public class Client {
    public static void main(String[] args) throws IOException {
        // 创建 Socket 客户端并尝试连接服务器端
        Socket socket = new Socket("127.0.0.1", 8888);
        // 发送的消息内容
        final String message = "Hi,ChenJian.";
        // 使用输出流发送消息
        OutputStream os = socket.getOutputStream();
        // 给服务器端发送 10 次消息
        for (int i = 0; i < 10; i++) {
            // 发送消息
            os.write(message.getBytes());
        }
    }
}
```

![](https://img-blog.csdnimg.cn/c868c93bc1644e9dbbe5f1e2d102df97.png)

通过结果我们可以看出，服务器端有时发生了粘包问题，因为客户端发送了 10 次固定的“Hi,ChenJian.”的消息，正确的结果应该是服务器端也接收到了 10 次固定消息“Hi,ChenJian.”才对，但实际执行结果并非如此，不够长度的还使用了空格字符填充！

**对于粘包和拆包问题，常见的解决方案有四种：**

1、客户端在发送数据包的时候，每个包都固定长度，比如1024个字节大小，如果客户端发送的数据长度不足1024个字节，则通过补充空格的方式**补全到指定长度**；

2、客户端在每个包的末尾使用固定的分隔符，例如\r\n，如果一个包被拆分了，则等待下一个包发送过来之后找到其中的\r\n，然后对其拆分后的头部部分与前一个包的剩余部分进行合并，这样就得到了一个完整的包；

3、将消息分为头部和消息体，在头部中保存有当前整个消息的长度，只有在读取到足够长度的消息之后才算是读到了一个完整的消息；

4、通过自定义协议进行粘包和拆包的处理。

### 解决方案1：固定数据大小

```
package com.cjian.socket.stickBagAndUnpack;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 14:27
 * @Des:
 */
public class Server1 {

    private static final int BYTE_LENGTH = 1024;  // 字节数组长度（收消息用）

    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket(8888);
        // 获取到连接
        Socket clientSocket = serverSocket.accept();
        InputStream inputStream = clientSocket.getInputStream();
        while (true) {
            byte[] bytes = new byte[BYTE_LENGTH];
            try {
                // 读取客户端发送的信息
                int count = inputStream.read(bytes, 0, BYTE_LENGTH);
                if (count > 0) {
                    // 接收到消息打印
                    System.out.println("接收到客户端的信息是:" + new String(bytes).trim());
                }
                count = 0;
            } catch (Exception e) {
                // ignore
            }
        }
    }
}
```

```
package com.cjian.socket.stickBagAndUnpack;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 14:28
 * @Des:
 */
public class Client1 {
    private static final int BYTE_LENGTH = 1024;  // 字节长度

    public static void main(String[] args) throws IOException {
        Socket socket = new Socket("127.0.0.1", 8888);
        final String message = "Hi,ChenJian."; // 发送消息
        OutputStream outputStream = socket.getOutputStream();
        // 将数据组装成定长字节数组
        byte[] bytes = new byte[BYTE_LENGTH];
        int idx = 0;
        for (byte b : message.getBytes()) {
            bytes[idx] = b;
            idx++;
        }
        // 给服务器端发送 10 次消息
        for (int i = 0; i < 10; i++) {
            outputStream.write(bytes, 0, BYTE_LENGTH);
        }

    }
}
```

![](https://img-blog.csdnimg.cn/34196ec9f3764ceb9c893febfda8c808.png)

**优缺点分析**

从以上代码可以看出，虽然这种方式可以解决粘包问题，但这种**固定数据大小的传输方式，当数据量比较小时会使用空字符来填充，所以会额外的增加网络传输的负担**，因此不是理想的解决方案。

### 解决方案2：自定义请求协议

这种解决方案的实现思路是将请求的数据封装为两部分：消息头（发送的数据大小）+消息体（发送的具体数据），它的格式如下图所示：

![](https://img-blog.csdnimg.cn/297c4137845f43dea3beadc21260b527.png)

定义一个消息封装类：

消息的封装类中提供了两个方法：一个是将消息转换成消息头 + 消息体的方法，另一个是读取消息头的方法，具体实现代码如下

```
package com.cjian.socket.stickBagAndUnpack.customprotocol;

import java.io.IOException;
import java.io.InputStream;
import java.text.NumberFormat;

/**
 * @Author: cjian
 * @Date: 2023/6/5 14:42
 * @Des:
 */
public class SocketUtils {
    // 消息头存储的长度(占 8 字节)
    static final int HEAD_SIZE = 8;

    /**
     * 将协议封装为:协议头 + 协议体
     *
     * @param context 消息体(String 类型)
     * @return byte[]
     */
    public byte[] toBytes(String context) {
        // 协议体 byte 数组
        byte[] bodyByte = context.getBytes();
        int bodyByteLength = bodyByte.length;
        // 最终封装对象
        byte[] result = new byte[HEAD_SIZE + bodyByteLength];
        // 借助 NumberFormat 将 int 转换为 byte[]
        NumberFormat numberFormat = NumberFormat.getNumberInstance();
        numberFormat.setMinimumIntegerDigits(HEAD_SIZE);
        numberFormat.setGroupingUsed(false);
        // 协议头 byte 数组
        byte[] headByte = numberFormat.format(bodyByteLength).getBytes();
        // 封装协议头
        System.arraycopy(headByte, 0, result, 0, HEAD_SIZE);
        // 封装协议体
        System.arraycopy(bodyByte, 0, result, HEAD_SIZE, bodyByteLength);
        return result;
    }

    /**
     * 获取消息头的内容(也就是消息体的长度)
     *
     * @param inputStream
     * @return
     */
    public int getHeader(InputStream inputStream) throws IOException {
        int result = 0;
        byte[] bytes = new byte[HEAD_SIZE];
        inputStream.read(bytes, 0, HEAD_SIZE);
        // 得到消息体的字节长度
        result = Integer.valueOf(new String(bytes));
        return result;
    }

}
```

```
package com.cjian.socket.stickBagAndUnpack.customprotocol;

import java.io.IOException;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 15:00
 * @Des:
 */
public class CustomServer {
    public static void main(String[] args) throws IOException {
        // 创建 Socket 服务器端
        ServerSocket serverSocket = new ServerSocket(8888);
        // 获取客户端连接
        Socket clientSocket = serverSocket.accept();
        // 获取客户端发送的消息对象
        InputStream inputStream = clientSocket.getInputStream();
        while (true) {
            // 获取消息头(也就是消息体的长度)
            try {
                int bodyLength = SocketUtils.getHeader(inputStream);
                // 消息体 byte 数组
                byte[] bodyByte = new byte[bodyLength];
                // 每次实际读取字节数
                int readCount = 0;
                // 消息体赋值下标
                int bodyIndex = 0;
                // 循环接收消息头中定义的长度
                while (bodyIndex < bodyLength &&
                        (readCount = inputStream.read(bodyByte, bodyIndex, bodyLength)) != -1) {
                    bodyIndex += readCount;
                }
                bodyIndex = 0;
                // 成功接收到客户端的消息并打印
                System.out.println("接收到客户端的信息:" + new String(bodyByte));
            } catch (IOException ioException) {
                System.out.println(ioException.getMessage());
                break;
            }
        }
    }
}
```

```
package com.cjian.socket.stickBagAndUnpack.customprotocol;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Random;

/**
 * @Author: cjian
 * @Date: 2023/6/5 14:46
 * @Des:
 */
public class CustomClient {
    public static void main(String[] args) throws IOException {
        // 启动 Socket 并尝试连接服务器
        Socket socket = new Socket("127.0.0.1", 8888);
        // 发送消息合集（随机发送一条消息）
        final String[] message = {"Hi,Chenjian.", "Hi,LiXi~", "江苏省南京市雨花台区."};
        // 创建协议封装对象
        OutputStream outputStream = socket.getOutputStream();
        // 给服务器端发送 10 次消息
        for (int i = 0; i < 10; i++) {
            // 随机发送一条消息
            String msg = message[new Random().nextInt(message.length)];
            // 将内容封装为:协议头+协议体
            byte[] bytes = SocketUtils.toBytes(msg);
            // 发送消息
            outputStream.write(bytes, 0, bytes.length);
            outputStream.flush();
        }
    }
}
```

![](https://img-blog.csdnimg.cn/a83fb8cf5a5b4407bb62698dcf789357.png)

从上述结果可以看出，消息通讯正常，客户端和服务器端的交互中并没有出现粘包问题。

**优缺点分析**

此解决方案虽然可以解决粘包问题，但消息的设计和代码的实现复杂度比较高，所以也不是理想的解决方案

### 解决方案3：特殊字符结尾

以特殊字符结尾就可以知道流的边界了，它的具体实现是：使用 Java 中自带的 BufferedReader 和 BufferedWriter，也就是带缓冲区的输入字符流和输出字符流，通过写入的时候加上 \n 来结尾，读取的时候使用 readLine 按行来读取数据，这样就知道流的边界了，从而解决了粘包的问题。

服务器端实现代码如下：

```
package com.cjian.socket.stickBagAndUnpack.specialchar;

import com.cjian.socket.stickBagAndUnpack.customprotocol.SocketUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 15:00
 * @Des:
 */
public class SpecialCharServer {
    public static void main(String[] args) throws IOException {
        // 创建 Socket 服务器端
        ServerSocket serverSocket = new ServerSocket(8888);
        // 获取客户端连接
        Socket clientSocket = serverSocket.accept();
        while (true) {
            try {
                // 获取客户端发送的消息流对象
                BufferedReader bufferedReader = new BufferedReader(
                        new InputStreamReader(clientSocket.getInputStream()));
                while (true) {
                    // 按行读取客户端发送的消息
                    String msg = bufferedReader.readLine();
                    if (msg != null) {
                        // 成功接收到客户端的消息并打印
                        System.out.println("接收到客户端的信息:" + msg);
                    }
                }
            } catch (IOException ioException) {
                System.out.println(ioException.getMessage());
                break;
            }
        }
    }
}
```

客户端代码：

```
package com.cjian.socket.stickBagAndUnpack.specialchar;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.net.Socket;

/**
 * @Author: cjian
 * @Date: 2023/6/5 15:36
 * @Des:
 */
public class SpecialCharClient {
    public static void main(String[] args) throws IOException {
        // 启动 Socket 并尝试连接服务器
        Socket socket = new Socket("127.0.0.1", 8888);
        final String message = "Hi,ChenJian."; // 发送消息
        BufferedWriter bufferedWriter = new BufferedWriter(
                new OutputStreamWriter(socket.getOutputStream()));
        // 给服务器端发送 10 次消息
        for (int i = 0; i < 10; i++) {
            // 注意:结尾的 \n 不能省略,它表示按行写入
            bufferedWriter.write(message + "\n");
            // 刷新缓冲区(此步骤不能省略)
            bufferedWriter.flush();
        }
    }
}
```

![](https://img-blog.csdnimg.cn/6b6d54fd407a4c9eb3020b181d06874a.png)

**优缺点分析**

以特殊符号作为粘包的解决方案的最大优点是实现简单，但存在一定的局限性，比如当一条消息中间如果出现了结束符就会造成半包的问题，所以如果是复杂的字符串要对内容进行编码和解码处理，这样才能保证结束符的正确性。

##  四、HTTP如何解决粘包问题的？

http请求报文格式  
1）请求行：以\r\n结束；  
2）请求头：以\r\n结束；  
3）\r\n；  
3）数据；

http响应报文格式  
1）响应行：以\r\n结束；  
2）响应头：以\r\n结束；  
3）\r\n；  
4）数据；

### 4.1、读取请求行/请求头、响应行/响应头

1、遇到第一个\r\n表示读取请求行或响应行结束；  
2、遇到\r\n\r\n表示读取请求头或响应头结束；

###   
**4.2、 怎么读取body数据呢？**

- HTTP协议通常使用Content-Length来标识body的长度。在服务器端，需要先申请对应长度的buffer，然后再赋值。

![](https://img-blog.csdnimg.cn/1279a01571164f2ba3c2a8141a0e996a.png)

- **如果需要一边生产数据一边发送数据，就需要使用"Transfer-Encoding: chunked" 来代替Content-Length，也就是对数据进行分块传输。**

![](https://img-blog.csdnimg.cn/de563592ba4c4d42b9d1acfbda2af5f5.png)

#### 4.2.1、 Content-Length 描述

1. http server接收数据时，发现header中有Content-Length属性，则读取Content-Length的值，确定需要读取body的长度。
2. http server发送数据时，根据需要发送byte的长度，在header中增加Content-Length项，其中value为byte的长度，然后将byte数据当做body发送到客户端。

#### 4.2.2、 chunked描述

1. http server接收数据时，发现header中有Transfer-Encoding: chunked，则会按照chunked协议分批读取数据。
2. http server发送数据时，如果需要分批发送到客户端，则需要在header中加上Transfer-Encoding:chunked，然后按照chunked协议分批发送数据。

chunked协议具体如下图：

![](https://img-blog.csdnimg.cn/8ba16c3c85684457a1bfa01ce4014491.png)

1、主要包含三部分: chunk，last-chunk和trailer。如果分多次发送，则chunk有多份。

2、 chunk主要包含大小和数据，大小表示这个这个chunk包的大小，使用16进制标示。其中chunk之间的分隔符为CRLF。

3、通过last-chunk来标识chunk发送完成。一般读取到last-chunk(内容为0)的时候，代表chunk发送完成。

4、trailer表示增加header等额外信息，一般情况下header是空。通过CRLF来标识整个chunked数据发送完成。

#### 4.2.3 优/缺点

**优点**

1、假如body的长度是10K，对于Content-Length则需要申请10K连续的buffer，而对于Transfer-Encoding:chunked可以申请1k的空间，然后循环使用10次。节省了内存空间的开销。

2、如果内容的长度不可知，则可使用chunked方式能有效的解决Content-Length的问题

3、http服务器压缩可以采用分块压缩，而不是整个块压缩。分块压缩可以一边进行压缩，一般发送数据，来加快数据的传输时间。

**缺点**

1、chunked协议解析比较复杂。

2、在http转发的场景下(比如nginx)难以处理，比如如何对分块数据进行转发。