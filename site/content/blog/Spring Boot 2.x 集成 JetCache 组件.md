+++
read_time = 8
date = "2018-08-13"
title = "Spring Boot 2.x 集成 JetCache 组件"
tags = ["Reactive Programming"]
categories = ["general"]
draft = false
description = "JetCache 是一个基于 Java 的缓存系统封装，提供统一的 API 和注解来简化缓存的使用。"
weight = 89
+++

阅读人群：软件工程师   
您将收获：知道 JetCache 是干什么的以及如何使用。


## 一、JetCache 是什么？

来自项目主页的介绍
> JetCache 是一个基于 Java 的缓存系统封装，提供统一的 API 和注解来简化缓存的使用.TrayCache 提供了比 SpringCache 更加强大的注解，可以原生的支持 TTL，两级缓存，分布式自动刷新，还提供了 Cache 接口用于手工缓存操作。当前有四个实现，RedisCache， （TairCache 此部分未在github上开源）， （CaffeineCache 在存储器中）和一个简易的 LinkedHashMapCache（在存储器中），要添加新的实现也是非常简单的。

#### 全部特性
- 通过统一的API访问Cache系统
- 通过注解实现声明式的方法缓存，支持TTL和两级缓存
- 通过注解创建并配置Cache实例
- 针对所有Cache实例和方法缓存的自动统计
- Key的生成策略和Value的序列化策略是可以配置的
- 分布式缓存自动刷新，分布式锁 (2.2+)
- 异步Cache API (2.2+，使用Redis的lettuce客户端时)
- Spring Boot支持

## 二、集成JetCache

### 2.1. 环境要求

- JDK1.8
- Spring Framework 4.0.8 以上
- Spring Boot 1.19 以上

##### 注意
spring boot 2.0 默认使用 redis lettuce 客户端实现方式，如果你想用jedis方式实现需排除 lettuce 依赖并引入 jetcache-starter-redis 即可。

### 2.2. Maven

```
<dependency>
    <groupId>com.alicp.jetcache</groupId>
    <artifactId>jetcache-starter-redis-lettuce</artifactId>
    <version>2.5.6</version>
</dependency>

<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
    <version>2.6.0</version>
</dependency>

<!-- 可选 -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>fastjson</artifactId>
    <version>1.2.47</version>
</dependency>

<!-- 编译设置指定版本，项目编译设置target必须为1.8格式，并且指定javac的-parameters参数，否则就要使用key="args[0]"这样按下标访问的形式。 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.7.0</version>
    <configuration>
        <source>1.8</source>
        <target>1.8</target>
        <compilerArgument>-parameters</compilerArgument>
    </configuration>
</plugin>

```


### 2.3. 配置

这里我使用 properties 文件进行配置，你也可以通过 yml 文件进行配置，可以根据个人喜好选择配置方式。
```
# JetCache 配置
## 统计间隔，0表示不统计
jetcache.statIntervalMinutes=15

## jetcache-anno把cacheName作为远程缓存key前缀，2.4.3以前的版本总是把areaName加在cacheName中，因此areaName也出现在key前缀中。2.4.4以后可以配置，为了保持远程key兼容默认值为true，但是新项目的话false更合理些。
jetcache.areaInCacheName=false

## @Cached和@CreateCache自动生成name的时候，为了不让name太长，hiddenPackages指定的包名前缀被截掉
jetcache.hiddenPackages=com.bugjc.ea

## 缓存类型。tair、redis为当前支持的远程缓存；linkedhashmap、caffeine为当前支持的本地缓存类型
jetcache.local.default.type=caffeine

## 每个缓存实例的最大元素的全局配置，仅local类型的缓存需要指定。注意是每个缓存实例的限制，而不是全部，比如这里指定100，然后用@CreateCache创建了两个缓存实例（并且注解上没有设置localLimit属性），那么每个缓存实例的限制都是100
jetcache.local.default.limit=100

## key转换器的全局配置，当前只有一个已经实现的keyConvertor：fastjson。仅当使用@CreateCache且缓存类型为LOCAL时可以指定为none，此时通过equals方法来识别key。方法缓存必须指定keyConvertor
jetcache.local.default.keyConvertor=fastjson

## 全局超时时间（单位：秒）
jetcache.local.default.expireAfterWriteInMillis=100000

## redis 远程配置属性通本地一致，具体可参考配置详解
jetcache.remote.default.type=redis.lettuce
jetcache.remote.default.keyConvertor=fastjson
jetcache.remote.default.valueEncoder=java
jetcache.remote.default.valueDecoder=java
jetcache.remote.default.uri=redis://192.168.36.39:6379
```


### 2.4. 程序入口Main配置

```
/** 分别激活Cached 和 CreateCache注解  **/
@EnableMethodCache(basePackages = "com.bugjc.ea")
@EnableCreateCacheAnnotation
@SpringBootApplication
public class JetCacheServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodeServerApplication.class, args);
    }
}
```

## 三、JetCache 使用示例

### 3.1. 缓存实例 API

#### 3.1.1. 异步 API

```
/**
 * 异步 API
 * @author qingyang
 * @date 2018/8/12 19:41
 */
@Slf4j
public class JetCacheAsyncApiTest extends Tester {


    private static final String KEY_1 = "member:1";

    /**
     * @CreateCache 创建缓存实例
     * @CacheRefresh refresh + timeUnit = 60秒刷新，stopRefreshAfterLastAccess = 如果key长时间未被访问，则相关的刷新任务就会被自动移除。
     * @CachePenetrationProtec 表示在多线程环境中同步加载数据
     */
    @CreateCache
    @CacheRefresh(refresh = 60,stopRefreshAfterLastAccess = 120,timeUnit = TimeUnit.SECONDS)
    @CachePenetrationProtect
    private Cache<String, Member> cache;

    @Before
    public void testBefore(){
        Member member = new Member();
        member.setCreateDate(new Date());
        member.setAge(10);
        member.setNickname("jack");
        cache.PUT(KEY_1, member);
    }

    @Test
    public void testAsync() throws InterruptedException {
        CacheGetResult<Member> r = cache.GET(KEY_1);
        CompletionStage<ResultData> future = r.future();
        future.thenRun(() -> {
            if(r.isSuccess()){
                log.info("异步获取到缓存值"+r.getValue());
            }
        });
        Thread.sleep(10000);
    }
}
```
#### 3.1.2. 自动 load

```
/**
 * 自动load
 * @author qingyang
 * @date 2018/8/12 19:41
 */
@Slf4j
public class JetCacheLoaderApiTest extends Tester {

    private static final String KEY_1 = "member:1";

    /**
     * @CreateCache 创建缓存实例
     * @CacheRefresh refresh + timeUnit = 60秒刷新，stopRefreshAfterLastAccess = 如果key长时间未被访问，则相关的刷新任务就会被自动移除。
     * @CachePenetrationProtec 表示在多线程环境中同步加载数据
     */
    @CreateCache
    @CacheRefresh(refresh = 60,stopRefreshAfterLastAccess = 120,timeUnit = TimeUnit.SECONDS)
    @CachePenetrationProtect
    private Cache<String, Member> cache;

    @PostConstruct
    public void init(){
        //指定每分钟刷新一次，30分钟如果没有访问就停止刷新。
        RefreshPolicy policy = RefreshPolicy.newPolicy(1, TimeUnit.MINUTES)
                .stopRefreshAfterLastAccess(30, TimeUnit.MINUTES);
        //缓存未命中的情况下，会调用loader
        cache.config().setLoader(this::loadMemberFromDatabase);
        cache.config().setRefreshPolicy(policy);
    }

    //缓存未命中的情况下，会调用该方法
    //需要注意：
    //GET、GET_ALL这类大写API只纯粹访问缓存，不会调用loader。
    //如果使用多级缓存，loader应该安装在MultiLevelCache上，不要安装在底下的缓存上。
    private Member loadMemberFromDatabase(String key) {
        if (key.equals(KEY_1)){
            Member member = new Member();
            member.setCreateDate(new Date());
            member.setAge(12);
            member.setNickname("aoki");
            return member;
        }
        return null;
    }

    @Before
    public void testBefore(){
        Member member = new Member();
        member.setCreateDate(new Date());
        member.setAge(10);
        member.setNickname("jack");
        cache.put(KEY_1, member);
    }

    @Test
    public void testLoadMember() {
        Member member = cache.get(KEY_1);
        log.info("获取缓存结果："+member.toString());
    }
}
```

#### 3.1.3. 分布式锁

```
/**
 * 分布式锁
 * @author qingyang
 * @date 2018/8/12 19:41
 */
@Slf4j
public class JetCacheLockApiTest extends Tester {

    /**
     * @CreateCache 创建缓存实例
     * @CacheRefresh refresh + timeUnit = 60秒刷新，stopRefreshAfterLastAccess = 如果key长时间未被访问，则相关的刷新任务就会被自动移除。
     * @CachePenetrationProtec 表示在多线程环境中同步加载数据
     */
    @CreateCache
    @CacheRefresh(refresh = 60,stopRefreshAfterLastAccess = 120,timeUnit = TimeUnit.SECONDS)
    @CachePenetrationProtect
    private Cache<String, Member> cache;


    @Test
    public void testLock() throws InterruptedException {
        int count = 100;
        AtomicInteger sum = new AtomicInteger(0);
        CountDownLatch countDownLatch = new CountDownLatch(count);
        Runnable runnable = () -> {
            cache.tryLockAndRun("LockKeyAndRunKey", 2, TimeUnit.MILLISECONDS,() -> {
                log.info("获取锁成功，计数加1。");
                sum.incrementAndGet();

            });
            countDownLatch.countDown();
        };

        for (int i = 0; i < count; i++) {
            new Thread(runnable).start();
        }

        countDownLatch.await();

        log.info(sum.get() + "");
        Thread.sleep(10000);
    }
}
```

#### 3.1.4. 大写 API

```
/**
 * 大写API
 * @author qingyang
 * @date 2018/8/12 19:41
 */
@Slf4j
public class JetCacheUppercaseApiTest extends Tester {

    private static final String KEY_1 = "member:1";

    /**
     * @CreateCache 创建缓存实例
     * @CacheRefresh refresh + timeUnit = 60秒刷新，stopRefreshAfterLastAccess = 如果key长时间未被访问，则相关的刷新任务就会被自动移除。
     * @CachePenetrationProtec 表示在多线程环境中同步加载数据
     */
    @CreateCache
    @CacheRefresh(refresh = 60,stopRefreshAfterLastAccess = 120,timeUnit = TimeUnit.SECONDS)
    @CachePenetrationProtect
    private Cache<String, Member> cache;

    @Test
    public void testUppercaseApi() throws InterruptedException {
        CacheGetResult<Member> r = cache.GET(KEY_1);
        if (r.isSuccess()) {
            Member member = r.getValue();
            log.info("cache:" + member.toString());
        } else if (r.getResultCode() == CacheResultCode.NOT_EXISTS) {
            log.info("cache miss:" + KEY_1);
        } else if (r.getResultCode() == CacheResultCode.EXPIRED) {
            log.info("cache expired:" + KEY_1);
        } else {
            log.info("cache get error:" + KEY_1);

        }
    }
}
```

大写 API 和小写的 API 作用基本一样，唯一的差别是大写 API 提供完整的错误返回值。

JetCache API 实际上实现的是JSR 107规范Cache接口，具体操作方法看项目主页wiki。


### 3.2. 注解方法缓存


```

public interface MemberService {


    /**
     * 创建会员
     * @param member
     */
    void createMember(Member member);

    /**
     * 获取会员信息
     * @param memberId
     * @return
     */
    @Cached(name = "member:", key = "#memberId", expire = 300, cacheType = CacheType.BOTH)
    Member findByMemberId(Integer memberId);

    /**
     * 更新会员信息
     * @param member
     */
    @CacheUpdate(name="member:", key="#member.memberId", value="#member")
    void updByMemberId(Member member);

    /**
     * 删除会员信息
     * @param memberId
     */
    @CacheInvalidate(name="member:", key="#memberId")
    void delByMemberId(Integer memberId);


}
```

##### 常用注解解释

<font color=#3B200C>@Cached</font> 创建缓存  
- <font color=#DE8100>name</font> (可选，如果没有指定，JetCache将自动生成一个。此名称用于显示统计信息，并在使用远程缓存时作为密钥前缀的一部分。不要将相同的名称分配给具有相同区域的不同@Cached注释。)  
- <font color=#DE8100>key</font> (可选，通过表达式脚本指定键，如果不指定,使用目标方法和keyConvertor的所有参数生成一个。)  
- <font color=#DE8100>expire</font> (可选，到期时间。如果属性值不存在，请使用全局配置，
如果全局配置也没有定义，那么使用infinity。到期时间单位属性通过timeUnit配置。)  
- <font color=#DE8100>cacheType</font> (可选，缓存实例的类型，通过CacheType枚举配置是使用本地、远程还是两者一起用。)  

[集成示例源码](https://github.com/bugjc/sboot-integration-samples/tree/master/shoot-integration-jetcache)

## 四、总结
本文介绍了 JetCache 是什么以及在 Spring Boot 2.x 集成 JetCache 和一些常用的示例，目的是为项目中使用缓存提供一种新的可选方案。

## 五、参考资料
- [JetCache官方文档](https://github.com/alibaba/jetcache/wiki)
- [阿里巴巴开源的通用缓存访问框架JetCache介绍](https://yq.aliyun.com/articles/584312?utm_content=m_47346)
- [阿里巴巴JetCache整理](https://blog.csdn.net/yujiak/article/details/80257192)
- [jetcache官网教程](https://blog.csdn.net/sinat_32366329/article/details/80260944)
