+++
date = "2017-03-02T21:56:55+01:00"
title = "Atomic原子变量类的用法、原理和用途"
tags = ["Java","Atomic"]
categories = ["general"]
draft = false
description = "自JDK1.5开始提供了java.util.concurrent.atomic包，方便程序员在多线程环境下，无锁的进行原子操作。原子变量的底层使用了处理器提供的原子指令，但是不同的CPU架构可能提供的原子指令不一样，也有可能需要某种形式的内部锁,所以该方法不能绝对保证线程不被阻塞。- 总的来说就是提供非阻塞的线程安全编程"
weight = 1
+++

## 前言
> 在当今科技高速发展的时代，计算机的高速发展早已超越“摩尔定律”；在这个计算机相对廉价的时代，作为开发者操作的机器早已不是单核处理器了，早已进入多核时代，业务早已进入并行执行；开发高并发的程序所要掌握的技能也不再是使用没有效率的锁，所幸jdk1.5提供在多线程情况下无锁的进行原子操作，也就是这篇文章将要写的内容。
> 

## 什么是“原子变量类”？

自JDK1.5开始提供了java.util.concurrent.atomic包，方便程序员在多线程环境下，无锁的进行原子操作。原子变量的底层使用了处理器提供的原子指令，但是不同的CPU架构可能提供的原子指令不一样，也有可能需要某种形式的内部锁,所以该方法不能绝对保证线程不被阻塞。- **总的来说就是提供非阻塞的线程安全编程**


## 原子变量类的简单用法  

在介绍用法前先了解jdk软件包 java.util.concurrent.atomic 中为我们提供了哪些原子类和方法：  

**（1）类摘要** 

|类 | 描述
|:--- |:---
|AtomicBoolean  | 可以用原子方式更新的 boolean 值。
|AtomicInteger  | 可以用原子方式更新的 int 值。
|AtomicIntegerArray  | 可以用原子方式更新其元素的 int 数组。
|AtomicIntegerFieldUpdater<T>  | 基于反射的实用工具，可以对指定类的指定 volatile int 字段进行原子更新。
|AtomicLong	|可以用原子方式更新的 long 值。
|AtomicLongArray	|可以用原子方式更新其元素的 long 数组。
|AtomicLongFieldUpdater<T>	|基于反射的实用工具，可以对指定类的指定 volatile long 字段进行原子更新。
|AtomicMarkableReference<V>	|AtomicMarkableReference 维护带有标记位的对象引用，可以原子方式对其进行更新。
|AtomicReference<V>	|可以用原子方式更新的对象引用。
|AtomicReferenceArray<E>	|可以用原子方式更新其元素的对象引用数组。
|AtomicReferenceFieldUpdater<T,V>	|基于反射的实用工具，可以对指定类的指定 volatile 字段进行原子更新。
|AtomicStampedReference<V>	|AtomicStampedReference 维护带有整数“标志”的对象引用，可以用原子方式对其进行更新。


**（2）常用方法摘要**

|返回类型 | 方法 | 描述
|:---|:---|:---
|boolean	| compareAndSet(boolean expect, boolean update) | 如果当前值 == 预期值，则以原子方式将该值设置为给定的更新值
|boolean	|get() | 返回当前值。
|void	|set(boolean newValue) |无条件地设置为给定值。
|boolean	|weakCompareAndSet(boolean expect, boolean update) |如果当前值 == 预期值，则以原子方式将该值设置为给定的更新值。 
            
这里介绍只列出常用的方法，实际中据原子类不同方法略有变化。如需了解更多的方法请查看“在线文档-jdk-z”

[在线文档-jdk-zh](http://tool.oschina.net/apidocs/apidoc?api=jdk-zh)

**（3）简单使用示例**  

示例一：原子更新基本类型类--生成序列号

```Java
public class Example1 {

    private final AtomicLong sequenceNumber = new AtomicLong(0);
    public long next() {
        //原子增量方法,执行的是i++，所以需要在获取一次。
        sequenceNumber.getAndIncrement();
        return sequenceNumber.get();
    }

    public void radixNext(int radix){
        for (;;) {
            long i = sequenceNumber.get();
            // 该方法不一定执行成功，所以用无限循环来保证操作始终会执行成功一次。
            boolean suc = sequenceNumber.compareAndSet(i, i + radix);
            if (suc) {
                break;
            }
        }
    }


    public static void main(String[] args) {
        Example1 sequencer = new Example1();

        //生成序列号
        for (int i = 0; i < 10; i++) {
            System.out.println(sequencer.next());
        }

        //生成自定义序列号
        for (int i = 0; i < 10; i++) {
            sequencer.radixNext(3);
            System.out.println(sequencer.sequenceNumber.get());
        }


    }

}
```
执行结果：


    1
    2
    3
    4
    5
    ---------------
    8
    11
    14
    17
    20


示例二：原子方式更新数组


```Java
public class Example2 {

    static AtomicIntegerArray arr = new AtomicIntegerArray(10);

    public static class AddThread implements Runnable{
        public void run(){
            for(int k=0;k<10000;k++){
                // 以原子方式将索引 i 的元素加 1。
                arr.getAndIncrement(k%arr.length());
            }

        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread[]ts=new Thread[10];
        //创建10个线程
        for(int k=0;k<10;k++){
            ts[k] = new Thread(new AddThread());
        }

        //开启10个线程
        for(int k=0;k<10;k++){
            ts[k].start();
        }

        //等待所有线程执行完成
        for(int k=0;k<10;k++){
            ts[k].join();
        }

        //打印最终执行结果
        System.out.println(arr);
    }
}
```
执行结果：

    [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]


示例三：原子方式更新引用

```Java
public class Node {
    private int val;
    private volatile Node left, right;

    private static final AtomicReferenceFieldUpdater leftUpdater = AtomicReferenceFieldUpdater.newUpdater(Node.class, Node.class, "left");
    private static AtomicReferenceFieldUpdater rightUpdater = AtomicReferenceFieldUpdater.newUpdater(Node.class, Node.class, "right");

    boolean compareAndSetLeft(Node expect, Node update) {
        return leftUpdater.compareAndSet(this, expect, update);
    }

    public Node() {
        this.left = this.right = null;
    }

    public Node(int val) {
        this.val = val;
        this.left = this.right = null;
    }

    public Node(Node left,Node right) {
        this.left = left;
        this.right = right;
    }


    public static void main(String[] args) {
        Node node = new Node(1);
        node.left = new Node(new Node(2),new Node(3));
        node.right = new Node(new Node(4),new Node(5));
        System.out.println(JSON.toJSON(node));
        node.compareAndSetLeft(node.left,node.right);
        System.out.println(JSON.toJSON(node));
    }



    // get and set ...
    
}
```
执行结果：  

    {"val":1,"left":{"val":0,"left":{"val":2},"right":{"val":3}},"right":{"val":0,"left":{"val":4},"right":{"val":5}}}
    {"val":1,"left":{"val":0,"left":{"val":4},"right":{"val":5}},"right":{"val":0,"left":{"val":4},"right":{"val":5}}}


**（4）小结**  

原子访问和更新的内存效果一般遵循以下可变规则中的声明：
- get 具有读取 volatile 变量的内存效果。
- set 具有写入（分配）volatile 变量的内存效果。
除了允许使用后续（但不是以前的）内存操作，其自身不施加带有普通的非 volatile 写入的重新排序约束，lazySet 具有写入（分配）volatile 变量的内存效果。在其他使用上下文中，当为 null 时（为了垃圾回收），lazySet 可以应用不会再次访问的引用。
- weakCompareAndSet 以原子方式读取和有条件地写入变量但不 创建任何 happen-before 排序，因此不提供与除 - weakCompareAndSet 目标外任何变量以前或后续读取或写入操作有关的任何保证。
- compareAndSet 和所有其他的读取和更新操作（如 getAndIncrement）都有读取和写入 volatile 变量的内存效果。


## 原子操作的实现原理


关键源码：

```java
 // setup to use Unsafe.compareAndSwapInt for updates
private static final Unsafe unsafe = Unsafe.getUnsafe();
```

查看源码发现Atomic包里的类基本都是使用Unsafe实现的，Unsafe只提供了以下三种CAS方法。

关键源码：
```java
public final native boolean compareAndSwapObject(Object var1, long var2, Object var4, Object var5);

public final native boolean compareAndSwapInt(Object var1, long var2, int var4, int var5);

public final native boolean compareAndSwapLong(Object var1, long var2, long var4, long var6);
```

查看方法不难发现是被native修饰的，即被Native修饰的方法在被调用时指向的是一个非java代码的具体实现，这个实现可能是其他语言或者操作系统。这里是借助C来调用CPU底层指令来实现的，具体实现原理请点击下面的“实现原理”。


[实现原理](http://www.infoq.com/cn/articles/atomic-operation)



## 原子对象的用途

原子变量类主要用作各种构造块，用于实现非阻塞数据结构和相关的基础结构类。compareAndSet方法不是锁的常规替换方法。仅当对象的重要更新限定于单个变量时才应用它。

例：多线程高并发计数器 

## 总结 （摘自网上）
原子变量类相对于基于锁的版本有几个性能优势。首先，它用硬件的原生形态代替 JVM 的锁定代码路径，从而在更细的粒度层次上（独立的内存位置）进行同步，失败的线程也可以立即重试，而不会被挂起后重新调度。更细的粒度降低了争用的机会，不用重新调度就能重试的能力也降低了争用的成本。即使有少量失败的 CAS 操作，这种方法仍然会比由于锁争用造成的重新调度快得多。