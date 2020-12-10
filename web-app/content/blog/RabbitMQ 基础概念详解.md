
+++
read_time = 5
date = "2018-01-05"
title = "RabbitMQ 基础概念详解"
tags = ["RabbitMQ","消息中间件"]
categories = ["general"]
draft = false
description = "了解rabbitmq概念有助于学习理解rabbitmq中的重要组成部分以及设计模型。"
weight = 99
+++

阅读人群：准备学习 RabbitMQ 的人   
您将收获：使用 RabbitMQ 生产化必须思考的问题以及所解决问题的方法


## 一、介绍
RabbitMQ 是一个消息代理：它接受和转发消息。你可以把它想象成一个邮局：当你把你想要发布的邮件放在邮箱中时，你可以确定邮差先生最终将邮件发送给你的收件人。在这个比喻中，RabbitMQ 是邮政信箱，邮局和邮递员。

RabbitMQ 和邮局的主要区别在于它不处理纸张，而是接受，存储和转发二进制数据块 —— 消息。

RabbitMQ 消息传递使用了一些术语，他们分别是： 

##### 消息生产者（Producer）
一个发送消息的程序,主要是发送消息。  

![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/rabbitmq/producer.png)

##### 消息队列（Queue）

队列是生活在 RabbitMQ 中的邮箱的名称。尽管消息流经 RabbitMQ 和您的应用程序，但它们只能存储在队列中。一个队列只受主机内存和磁盘限制的约束，它本质上是一个很大的消息缓冲区。许多生产者可以发送进入一个队列的消息，并且许多消费者可以尝试从一个队列接收数据。这就是我们代表队列的方式：
![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/rabbitmq/queue_name.png)  

##### 消息生产者（Consumer）
一个消费者是一个程序，主要是等待接收消息。 

![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/rabbitmq/consumer.png)

## 二、基础概念
基础结构图：  

![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/rabbitmq/structure.png)

##### Broker
代理人，简单来说就是消息队列服务器实体。

##### Exchange
交换机的主要作用是接收相应的消息并且绑定到指定的队列。简而言之就是消息交换机，它指定消息按什么规则，路由到哪个队列。交换机总共有四种类型,它们分别为：

- **Direct**  
- 是 RabbitMQ 默认的交换机模式,也是最简单的模式.即创建消息队列的时候,指定一个BindingKey.当发送者发送消息的时候,指定对应的Key.当Key和消息队列的BindingKey一致的时候,消息将会被发送到该消息队列中.

- **Topic**
转发信息主要是依据通配符,队列和交换机的绑定主要是依据一种模式(通配符+字符串),而当发送消息的时候,只有指定的Key和该模式相匹配的时候,消息才会被发送到该消息队列中.

- **Headers**  
也是根据一个规则进行匹配,在消息队列和交换机绑定的时候会指定一组键值对规则,而发送消息的时候也会指定一组键值对规则,当两组键值对规则相匹配的时候,消息会被发送到匹配的消息队列中.

- **Fanout**  
是路由广播的形式,将会把消息发给绑定它的全部队列,即便设置了key,也会被忽略.

##### Queue
消息队列载体，每个消息都会被投入到一个或多个队列。

##### Binding
绑定，它的作用就是把 exchange 和 queue 按照路由规则绑定起来。

##### Routing Key
路由关键字，exchange 根据这个关键字进行消息投递。

##### VHost
虚拟主机，一个 broker 里可以开设多个 vhost，用作不同用户的权限分离。

##### Producer
消息生产者，就是投递消息的程序。

##### Consumer
消息消费者，就是接受消息的程序。

##### Channel
消息通道，在客户端的每个连接里，可建立多个channel，每个channel代表一个会话任务。

## 三、代码示例
下面是用上述 Exchange 的 Direct 模式所写的 Java Spring Boot 示例代码:
```
/**
 * 配置队列
 * @author : aoki
 */
@Configuration
public class DirectConfig {

    public static final String QUEUE_NAME = "direct.test";

    @Bean
    public Queue directTestQueue() {
        // 是否持久化
        boolean durable = true;
        // 仅创建者可以使用的私有队列，断开后自动删除
        boolean exclusive = false;
        // 当所有消费客户端连接断开后，是否自动删除队列
        boolean autoDelete = false;
        return new Queue(QUEUE_NAME,durable,exclusive,autoDelete);
    }
}

/**
 * 发送消息
 * @author : aoki
 */
@Slf4j
@Service
public class DirectSender {
	
    @Autowired
    private AmqpTemplate amqpTemplate;
    
    public void send(String messgae) {
    	log.info("Direct模式使用示例");
        amqpTemplate.convertAndSend(DirectConfig.QUEUE_NAME, messgae);
    }
    
}

/**
 * 接收消息
 * @author : aoki
 */
@Slf4j
@Service
public class DirectReceiver {
    
    @RabbitListener(queues = DirectConfig.QUEUE_NAME)
    public void consumerC1(String message) {
        log.info("C1接收Direct模式消息：" + message);
    }

    @RabbitListener(queues = DirectConfig.QUEUE_NAME)
    public void consumerC2(String message) {
        log.info("C2接收Direct模式消息：" + message);
    }
}

/**
 * 测试
 * @author : aoki
 */
public class DirectModeTest extends Tester {
    
	@Autowired
	private DirectSender sender;

	@Test
	public void send() throws Exception {
	    String message = "你好！青木";
		sender.send(message);
		sender.send(message);
	}
}
```
执行结果：

    C1接收Direct模式消息：你好！青木
    C2接收Direct模式消息：你好！青木


## 四、总结
本文先从 RabbitMQ 与现实世界邮局相似的例子出发，为你建立 RabbitMQ 消息传递的重要组成部分。接着通过基础结构图让你清楚 RabbitMQ 的基础流程和重要组成部分（概念）。最后我通过一个代码示例让你落地你的想法。

## 五、参考资料
- [RabbitMQ 官方教程](https://www.rabbitmq.com/tutorials/tutorial-one-java.html)