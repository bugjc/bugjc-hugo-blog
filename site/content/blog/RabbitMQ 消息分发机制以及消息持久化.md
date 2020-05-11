
+++
read_time = 10
date = "2018-01-06"
title = "RabbitMQ 消息分发机制以及消息持久化"
tags = ["rabbitmq"]
categories = ["general"]
draft = false
description = "本文旨在深入理解rabbitmq消息的分发机制和消息一致性所产生的各种问题及解决方法。"
weight = 100
+++


阅读人群：了解 RabbitMQ 的工程师   
您将收获：使用 RabbitMQ 生产化必须思考的问题以及所解决问题的方法。

## 一、角色含义
- Producer：消息生产者
- Broker：消息代理人（也可以理解成RabbitMQ Server）
- Consumer：消息消费者


## 二、Message acknowledgment（消息确认机制）

Message acknowledgment 有 no ack 和 ack 两种。

### 2.1. NO ACK （非消息确认）
Consumer 接收到数据后不管处理是否完成，Broker 立即把这个 Message 标记为完成，然后从 queue 中删除了。

**no ack 可能会出现的问题**：  
当 Consumer 处理数据的过程中异常退出数据会丢失（多个 Consumer 处理同一个消息产生同样的结果的除外）

### 2.2. ACK（消息确认）
消息确认分消息发送端（Producer）和消息接收端（Consumer）两种。

#### 2.2.1. 发送端消息确认
Producer发送消息时通过实现ConfirmCallback接口来确定消息是否发送成功。下面是实现示例：

```
@Slf4j
@Component
public class RabbitSender implements RabbitTemplate.ConfirmCallback, RabbitTemplate.ReturnCallback {

    /***延迟一分钟*/
    private final static int DELAY = 1;

    @Resource
    private RabbitTemplate rabbitTemplate;

    @PostConstruct
    public void init() {
        rabbitTemplate.setConfirmCallback(this);
        rabbitTemplate.setReturnCallback(this);
    }

    @Override
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {
        if (ack) {

            if (correlationData !=null && HAUtil.containsCacheKey(correlationData.getId())){
                HAUtil.delCache(correlationData.getId());
            }
            log.info("消息发送成功" );
        } else {
            HAUtil.addTask(new RabbitSenderRetryTask(correlationData.getId(),this),DELAY);
            log.info("消息发送失败:" + cause+",等待重发");
        }

    }

    @Override
    public void returnedMessage(Message message, int replyCode, String replyText, String exchange, String routingKey) {
        System.out.println(message.getMessageProperties().getCorrelationIdString() + " 发送失败");
    }

    /**发送消息**/
    public void convertAndSend(String msgId,Object msg){
        HAUtil.addCache(msgId,msg,DateUnit.MINUTE.getMillis()*3);
        log.info("开始发送消息 : " + msg);
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE_MEMBER,RabbitConfig.ROUTING_KEY_MEMBER,msg,new CorrelationData(msgId));
    }

}
```
当消息发送失败时，需要实现重复发送消息的处理机制，也才能保证消息的可靠投递。实现思路是在发送消息的时候本地缓存消息，当消息回调发送失败时则获取缓存中的消息并再次发送，当消息处理成功时删除缓存，否则等待再次重发。通过本地缓存的方式会在应用重启时会丢失消息，可将本地缓存用 redis 替代。


#### 2.2.2. 接收端消息确认
接收端接收到数据后处理完成后发送 ack，Broker 收到消息确认后立即把 Message
标记为完成并从 queue 删除。

**ack 可能会出现的问题**：  
当 Consumer 处理数据的过程中异常退出数据不会丢失（如果只有一个 Consumer, Broker 会重复不断的发送消息，直到 Consumer 正常处理完消息并 ack；多个 Consumer 会在异常后会分发给下一个 Consumer.）
> 
> $ springboot rabbitmq 默认自动 ack,即在不抛异常的情况下 ack=>true,否则 ack=>false；当 ack=false 时 RabbitMQ 会不断的重新发送消息，长此以往 RabbitMQ 会出现“内存泄漏”等错误。可以通过一下命令打印 un-acked Messages.

## 三、Round-robin dispatching（循环分发机制）

RabbitMQ 的循环分发机制非常适合水平扩张，专为并发程序设计的。如果程序负荷加重，可以在启动一个 Consumer 来进行任务处理。
> 
> $ 个人建议 Consumer 数量不宜太多，如果一定要很多个才能处理过来的话，建议创建多个 Virtual Host 来细分消息通信类别。

##### 循环分发示例

默认情况下，RabbitMQ 会顺序的分发每个 Message。当每个都收到 ack 后，会将该 Message 删除，然后将下一个 Message 分发到下一个 Consumer。这种分发方式叫做 round-robin（优雅分发）。


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

    C1 接收 Direct 模式消息：你好！青木
    C2 接收 Direct 模式消息：你好！青木

## 四、Message durability（消息持久化机制）
上一节中我们知道通过消息确定机制和分发机制能保证 Consumer 发生异常退出时消息不丢失。但我们无法确定消息代发送端，也就是 Broker 是否也能在异常退出时也能保证消息的不丢失。下面简单介绍 RabbitMQ 是如何做到不丢失消息的。

**1. Producer 创建队列时通过设置 durable = true 来告诉 Broker 持久化队列的消息。**  
```
/**创建持久化队列示例**/
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
```
> $ 当队列创建后修改其属性的行为是无效的，除非删除队列在重新创建。

**2. 通过设置 MessageProperties 中的 DeliveryMode 来确定消息持久化否。** 

```
/**发送持久化消息示例**/
public void sendMessage(String messgae) throws UnsupportedEncodingException {
    //设置消息属性
    MessageProperties messageProperties = new MessageProperties();
    //默认就是消息持久的
    messageProperties.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
    Message message = new Message(messgae.getBytes("UTF-8"),messageProperties);
    amqpTemplate.send(DirectConfig.QUEUE_NAME,message);
}
```


**3. 同队列的持久化一样，都是通过设置 durable = true 来持久化 Exchange。**
```
/**ExChange 持久化示例**/
@Bean
public DirectExchange directExchange() {
    // 是否持久化
    boolean durable = true;
    // 当所有消费客户端连接断开后，是否自动删除队列
    boolean autoDelete = false;
    return new DirectExchange("",durable,autoDelete);
}
```

Broker 接收到消息之后可能仅仅保存到 cache 中而不是物理磁盘上，在这段时间内 Broker 发送 crash 消息将丢失。解决的办法是引入 mirrored-queue（镜像队列）。**建议生产环境设置 Exchange、Queue 和 Message 的消息持久化以及 mirrored-queue 来保证数据的不丢失**。另外消息固定 25S 将 Buffer 里的数据及未刷新到磁盘的文件内容刷新到磁盘中。

## 五、Fair dispatch（公平分发机制）
当有些 Consumer 处理任务较慢，有些 Consumer 处理任务较快时，循环分发就显得不那么优雅了。这时就需要一个相对公平的分发机制，即将任务分发给已处理完的 Consumer.

```
# 只有 consumer 已经处理并确认了上一条 message 时 queue 才分派新的 message 给它  
channel.basicQos(1);
```

## 六、总结
本分主要介绍了 RabbitMQ 的四种消息分发机制和消息持久生产化必须面对的问题和它的解决方案。

## 七、参考资料
- [RabbitMQ消息队列（三）：任务分发机制](https://blog.csdn.net/anzhsoft/article/details/19607841)  
- [官网-工作队列](https://www.rabbitmq.com/tutorials/tutorial-two-python.html)


