
+++
read_time = 20
date = "2018-01-06"
title = "RabbitMQ消息分发机制以及消息持久化"
tags = ["rabbitmq"]
categories = ["general"]
draft = false
description = "本文旨在深入理解rabbitmq消息的分发机制和消息一致性所产生的各种问题及解决方法。"
weight = 100
+++

  
阅读人群：了解RabbitMQ的工程师   
您将收获：使用Rabbitmq生产化必须思考的问题以及所解决问题的方法

## 角色含义
- Producer：消息生产者
- Broker：消息代理人（也可以理解成RabbitMQ Server）
- Consumer：消息消费者


## Message acknowledgment 消息确认机制

### NO ACK （非消息确认）
Consumer接收到数据后不管处理是否完成，Broker立即把这个Message标记为完成，然后从queue中删除了。

NO ACK 可能会出现的问题：  
当Consumer处理数据的过程中异常退出数据会丢失（多个Consumer处理同一个消息产生同样的结果的除外）

### ACK（消息确认）
消息确认分消息发送端和消息接收端两种。

#### Producer消息确认
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
当消息发送失败时，需要实现重复发送消息的处理机制，也才能保证消息的可靠投递。实现思路是在发送消息的时候本地缓存消息，当消息回调发送失败时则获取缓存中的消息并再次发送，当消息处理成功时删除缓存，否则等待再次重发。通过本地缓存的方式会在应用重启时会丢失消息，可将本地缓存用redis替代。


#### Consumer消息确认
Consumer接收到数据后处理完成后发送ack，Broker收到消息确认后立即把Message
标记为完成并从queue删除。

ack可能会出现的问题：  
当Consumer处理数据的过程中异常退出数据不会丢失（如果只有一个Consumer,Broker会重复不断的发送消息，直到Consumer正常处理完消息并ack；多个Consumer会在异常后会分发给下一个Consumer.）
> 
> $ springboot rabbitmq默认自动ack,即在不抛异常的情况下ack=>true,否则ack=>false；当ack=false时RabbitMQ会不断的重新发送消息，长此以往RabbitMQ会出现“内存泄漏”等错误。可以通过一下命令打印un-acked Messages.

## Round-robin dispatching 循环分发机制

RabbitMQ的循环分发机制非常适合水平扩张，专为并发程序设计的。如果程序负荷加重，可以在启动一个Consumer来进行任务处理。
> 
> $ 个人建议Consumer数量不宜太多，如果一定要很多个才能处理过来的话，建议创建多个Virtual Host来细分消息通信类别。

### 循环分发示例

默认情况下，RabbitMQ 会顺序的分发每个Message。当每个收到ack后，会将该Message删除，然后将下一个Message分发到下一个Consumer。这种分发方式叫做round-robin（优雅分发）。


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

## Message durability消息持久化机制
上一节中我们知道通过消息确定机制和分发机制能保证Consumer发生异常退出时消息不丢失。但我们无法确定消息代发送端，也就是Broker是否也能在异常退出时也能保证消息的不丢失。下面简单介绍RabbitMQ是如何做到不丢失消息的。

1、Producer创建队列时通过设置durable = true来告诉Broker持久化队列的消息。  
#### 创建持久化队列示例：

```

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

#### 发送持久化消息示例

```
public void sendMessage(String messgae) throws UnsupportedEncodingException {
        //设置消息属性
        MessageProperties messageProperties = new MessageProperties();
        //默认就是消息持久的
        messageProperties.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
        Message message = new Message(messgae.getBytes("UTF-8"),messageProperties);
        amqpTemplate.send(DirectConfig.QUEUE_NAME,message);
    }
```
通过设置MessageProperties中的DeliveryMode来确定消息持久化否。

#### ExChange持久化示例

```
    @Bean
    public DirectExchange directExchange() {
        // 是否持久化
        boolean durable = true;
        // 当所有消费客户端连接断开后，是否自动删除队列
        boolean autoDelete = false;
        return new DirectExchange("",durable,autoDelete);
    }
```
同队列的持久化一样，都是通过设置durable = true来持久化Exchange.

<font style="background-color:yellow">Broker接收到消息之后可能仅仅保存到cache中而不是物理磁盘上，在这段时间内Broker发送crash消息将丢失。解决的办法是引入mirrored-queue（镜像队列）。建议生产环境设置Exchange、Queue和Message的消息持久化以及mirrored-queue来保证数据的不丢失。另外消息固定25S将Buffer里的数据及未刷新到磁盘的文件内容刷新到磁盘中。</font>

## Fair dispatch 公平分发机制
当有些Consumer处理任务较慢，有些Consumer处理任务较快时，循环分发就显得不那么优雅了。这时就需要一个相对公平的分发机制，即将任务分发给已处理完的Consumer.

```
# 只有consumer已经处理并确认了上一条message时queue才分派新的message给它  
channel.basicQos(1);
```

## 参考资料
- [RabbitMQ消息队列（三）：任务分发机制](https://blog.csdn.net/anzhsoft/article/details/19607841)  
- [官网-工作队列](https://www.rabbitmq.com/tutorials/tutorial-two-python.html)
