+++
read_time = 20
date = "2018-08-13"
title = "Spring Boot 2.x 使用https"
tags = ["Reactive Programming"]
categories = ["general"]
draft = false
description = "Spring Boot 2.x快速集成https。"
weight = 88
+++

## 一、生成证书
本次示例使用阿里云提供的免费证书服务

#### 1、购买免费证书
[购买地址](https://common-buy.aliyun.com/?spm=a2c4e.11155515.0.0.weWkDo&commodityCode=cas#/buy)
![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/20180816/WX20180816-170805.png)

#### 2、证书订单流程
进入云盾控制台-证书服务，根据证书订单流程操作。见下图：
![image](https://os-qingdao.oss-cn-qingdao.aliyuncs.com/note/image/20180816/WX20180816-171540.png)

## 二、证书转换

#### 1、下载证书
点击下载-选中tomcat-下载证书for tomcat

#### 2、转换成JKS格式证书

```
# 会提示设置支付密码，最好将密码保持一致，这里用“214882835160958”作为密码
openssl pkcs12 -export -out bugjc.pfx -inkey 214882835160958.key -in 214882835160958.pem
```

## 三、SpringBoot 集成证书服务
- 1、将生成的bugjc.pfx文件移动到 resources 目录中
- 2、在 application.properties 中增加如下配置：

```
server.ssl.key-store=classpath:bugjc.jks
server.ssl.key-store-password=214882835160958
```
- 3、启动项目并运行

## 参考资料
[证书服务快速入门](https://help.aliyun.com/document_detail/28548.html?spm=5176.11065259.1996646101.searchclickresult.3f16254abX5XFg)

