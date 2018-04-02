+++
date = "2017-03-02T21:56:55+01:00"
title = "（基础系列）object clone 的用法、原理和用途"
tags = ["Java","clone"]
categories = ["general"]
draft = false
description = "object clone（对象克隆）网上资料很多，那我为什么还要写下这篇文章呢？主要是想汇聚多篇文章的优秀之处以及我对于对象克隆的理解来加深印象，也使读者能更全面的理解对象克隆的用法、原理和用途。"
weight = 10
+++

## 前言

object clone（对象克隆）网上资料很多，那我为什么还要写下这篇文章呢？主要是想汇聚多篇文章的优秀之处以及我对于对象克隆的理解来加深印象，也使读者能更全面的理解对象克隆的用法、原理和用途。

### 一、何谓 “object clone”
> 顾名思义clone就是一个相同东西的副本,是一个具体存在的复制体，是一个从生物科学开始变得熟悉的术语。在计算机行业，该术语被广泛用于指Compaq，戴尔等人对IBM PC的模仿。而在java语言中，clone方法被对象调用，所以会复制对象。

### 二、object clone的用法

（1）方法摘要  

| 作用域 | 类型 | 方法 | 描述 |
| :---- | :---- | :---- | :---- |
| protected | Object | clone() | 克隆实现了Cloneable接口的对象

注意事项：clone方法是被native修饰的，简单的讲就是被Native修饰的方法在被调用时指向的是一个非java代码的具体实现，这个实现可能是其他语言或者操作系统。

（2）clone规则：  

    1、 基本类型  
        如果变量是基本类型，则拷贝其值，比如int、float等。
    2、 对象  
        如果变量是一个实例对象，则拷贝其地址引用，也就是说新对象和原来对象是共用实例变量的。
    3、 String字符串  
        若变量为String字符串，则拷贝其地址引用。但是在修改时，它会从字符串池中重新生成一个新的字符串，原有的对象保持不变。

（2）示例1：

    实现clone方法的步骤：
    1. 实现Cloneable接口 
    2. 重载Object类中的clone()方法，重载时需定义为public 
    3. 在重载方法中，调用super.clone()

```
public class Book implements Cloneable {

    private int id;

    private String name;

    public Book() {}

    public Book(int id, String name) {
        this.id = id;
        this.name = name;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        return (Book)super.clone();
    }

    public static void main(String[] args) throws CloneNotSupportedException {
        Book book1 = new Book();
        book1.setName("基础系列1");
        Book book2 = (Book) book1.clone();

        System.out.println("图书1:" + book1.getName());
        System.out.println("图书2:" + book2.getName());

        book2.setName("基础系列2");

        System.out.println("图书1:" + book1.getName());
        System.out.println("图书2:" + book2.getName());

    }
}
```
运行结果：  
    
    图书1:基础系列1
    图书2:基础系列1
    图书1:基础系列1
    图书2:基础系列2
    
从运行结果看这应该是深克隆的，但为什么是浅克隆呢？从==string不可变==（原对象和克隆对象中的string属性引用的是同一地址）的角度出发结果应该是浅克隆，但从结果出发却又是深克隆，所以从这一角度来说clone对string是深克隆。

注意事项：如果没有implements Cloneable的类调用Object.clone()方法就会抛出CloneNotSupportedException

（3）示例2：

```
public class Book implements Cloneable {

    //在示例1的基础上增加bookBorrow的引用
    private BookBorrow bookBorrow;

    public Book() {}

    public Book(int id, String name, BookBorrow bookBorrow) {
        this.id = id;
        this.name = name;
        this.bookBorrow = bookBorrow;
    }

    public BookBorrow getBookBorrow() {
        return bookBorrow;
    }

    public void setBookBorrow(BookBorrow bookBorrow) {
       this.bookBorrow = bookBorrow;
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        Book book = (Book)super.clone();
        //这里注释掉就是浅克隆，否则就是深克隆
        book.bookBorrow = (BookBorrow)bookBorrow.clone();
        return book;
    }

    @Override
    public String toString() {
        return "BOOK[id="+id+",name="+name+",bookBorrow:"+bookBorrow+"]";
    }

    public static void main(String[] args) throws CloneNotSupportedException {

        BookBorrow bookBorrow = new BookBorrow(1,1);
        Book book1 = new Book(1,"基础系列1",bookBorrow);
        Book book2 = (Book) book1.clone();

        System.out.println("图书1:" + book1.toString());
        System.out.println("图书2:" + book2.toString());

        book2.setName("基础系列2");
        book2.setBookBorrow(new BookBorrow(5,5));

        System.out.println("图书1:" + book1.toString());
        System.out.println("图书2:" + book2.toString());

    }
}

public class BookBorrow  implements Cloneable{

    private int id;

    private int borstate;


    public BookBorrow(int id, int borstate) {
        this.id = id;
        this.borstate = borstate;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getBorstate() {
        return borstate;
    }

    public void setBorstate(int borstate) {
        this.borstate = borstate;
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        return (BookBorrow)super.clone();
    }

    @Override
    public String toString() {
        return "BookBorrow[id="+id+",borstate="+borstate+"]";
    }

}
```

运行结果：  
    
    图书1:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书2:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书1:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书2:BOOK[id=1,name=基础系列2,bookBorrow:BookBorrow[id=5,borstate=5]]

从结果看这里是一个标准的深克隆实现，深克隆实现的一个主要前提是当前对象引用的对象或对象的对象引用的对象都实现了==常规用法1==并且在重载clone方法中调用其引用对象的clone方法。

例：

```
 @Override
    public Object clone() throws CloneNotSupportedException {
        Book book = (Book)super.clone();
        //这里注释掉就是浅克隆，否则就是深克隆
        book.bookBorrow = (BookBorrow)bookBorrow.clone();
        return book;
    }
```
注意事项：示例2给出的例子是相对简单且常见的类，在实际开发中clone的对象可能依赖第三方的jar包或者引用层级过深不好修改的对象，如果是这种情况则建议采用示例3的做法，使用序列化clone。


（3）示例3： 
    
序列化clone类
```
public class CloneUtils {

    public static <T extends Serializable> T clone(T obj){

        T cloneObj = null;
        try {
            //写入字节流
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ObjectOutputStream obs = new ObjectOutputStream(out);
            obs.writeObject(obj);
            obs.close();

            //分配内存，写入原始对象，生成新对象
            ByteArrayInputStream ios = new ByteArrayInputStream(out.toByteArray());
            ObjectInputStream ois = new ObjectInputStream(ios);
            //返回生成的新对象
            cloneObj = (T) ois.readObject();
            ois.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return cloneObj;
    }
}

public class BookBorrow implements Serializable{
    ...
    //去掉clone方法，继承Serializable
    
}

public class Book implements Serializable {
    ...
    //去掉clone方法，继承Serializable
    
    public static void main(String[] args) throws CloneNotSupportedException {

        BookBorrow bookBorrow = new BookBorrow(1,1);
        Book book1 = new Book(1,"基础系列1",bookBorrow);
        Book book2 = CloneUtils.clone(book1);

        System.out.println("图书1:" + book1.toString());
        System.out.println("图书2:" + book2.toString());

        book2.setName("基础系列2");
        book2.setBookBorrow(new BookBorrow(5,5));

        System.out.println("图书1:" + book1.toString());
        System.out.println("图书2:" + book2.toString());

    }
}

```
执行结果：

    图书1:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书2:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书1:BOOK[id=1,name=基础系列1,bookBorrow:BookBorrow[id=1,borstate=1]]
    图书2:BOOK[id=1,name=基础系列2,bookBorrow:BookBorrow[id=5,borstate=5]]
    
序列化克隆无需继承，通过序列化工具类可实现深克隆同等效果。然而克隆没有银弹，==序列化这种方式在效率上比之原clone有所不如==。


### 二、object clone原理  

==本次讲解将基于示例1做出解释：==

为了不丢失上下文而贴出的测试代码，将会以2部分讲解object clone的原理
```
public static void main(String[] args) throws CloneNotSupportedException {
    //第一部分
    Book book1 = new Book();
    book1.setName("基础系列1");
    Book book2 = (Book) book1.clone();

    System.out.println("图书1:" + book1.getName());
    System.out.println("图书2:" + book2.getName());
    
    //第二部分
    book2.setName("基础系列2");

    System.out.println("图书1:" + book1.getName());
    System.out.println("图书2:" + book2.getName());

}
```

**第一部分执行结果**： 

    图书1:基础系列1
    图书2:基础系列1


浅克隆原理图：
![image](https://i.imgur.com/bhh4HBc.png)

从图中可以看出clone的name引用的是同一个值，那为什么前面又说是深克隆呢？原因就是在这一步中并没有修改name所以他们是浅克隆，引用的是同一个name变量值。那接下来执行第二部分得出的结果和原理图如你所想对象完全隔离了。

**第二部分执行结果**： 

    图书1:基础系列1
    图书2:基础系列2


深克隆原理图： 
![image](https://i.imgur.com/Gmdbqw3.png)

从图可以看出修改了name属性值，clone会从堆中重新生成一个对象被克隆对象引用，而原对象保持不变，从这一角度出发的确是深克隆。

##### clone原理小结 ： 


前面的原理介绍是以示例1做为蓝本介绍的，示例2 的原理和示例1类似，唯一区别是多了属性对象而属性对象在clone中也只会拷贝引用地址，要想实现深克隆就只能在引用的对象或引用对象的对象中中添加clone方法实现即可实现深克隆。



### 三、object clone的实际用途

1、精心设计一个浅克隆对象被程序缓存，作为功能模块模板；每次有用户调用这个模块则将可变部分替换成用户需要的信息即可。  
示例：  
功能：发邮件  
描述：给同组的用户发送邮件，邮件内容相同（不可变）发送的用户不同（可变）  

2、精心设计一个深克隆对象本程序缓存，作为功能模块的初始对象，例如：“游客模式”每个游客进入系统访问的都是初始对象，基于初始对象发展出多条变化不一的游览路线。只要你想的到设计巧妙，很多功能都能应用object clone。


### 四、总结

本文分3部分介绍了object clone，分别介绍了clone的用法、原理和用途； object clone归结就是可变和不可变两个特性，在实际的开发中我们可以基于这2个特性设计出性能良好的功能模块。
