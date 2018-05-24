
+++
read_time = 5
date = "2018-02-05"
title = "使用GoReplay捕获真实流量测试应用程序"
tags = ["goreplay"]
categories = ["general"]
draft = false
description = "GoReplay是一款开源工具，用于捕获实时HTTP流量并将其重播到测试环境中，以便持续用真实数据测试您的系统。它可用于增加代码部署，配置更改和基础结构更改的可信度。"
weight = 90
+++

阅读人群：软件工程师   
您将收获：使用GoReplay进行应用测试

## 什么是GoReplay

> GoReplay是一款开源工具，用于捕获实时HTTP流量并将其重播到测试环境中，以便持续用真实数据测试您的系统。它可用于增加代码部署，配置更改和基础结构更改的可信度。

## GoReplay使用

#### 安装GoReplay

从[下载最新的Gor二进制文件](https://github.com/buger/gor/releases)（我们为Windows，Linux x64和Mac OS提供预编译的二进制文件），或者您可以自己[编译编译](https://github.com/buger/goreplay/wiki/Compilation)。

下载并解压缩，您可以从当前目录运行Gor，或者您可能想要将二进制文件复制到您的PATH（可用于Linux和Mac OS /usr/local/bin）。

#### 捕获和重放流量

- 重播

```
# 监听8000端口的所有网络活动并将其转发到http://localhost:8001服务
./goreplay --input-raw :8000 --output-http="http://localhost:8001"

```
- 重播多个地址

将流量转发到多个端点
```
## 监听8000端口的所有网络活动并将其转发到多个地址
./goreplay --input-tcp :8000 --output-http "http://staging.com"  --output-http "http://dev.com"
```

- 循环分发

默认情况下，它会将相同的流量发送到所有输出，但您可以使用选项来平分它（循环） --split-output。
```
./goreplay --input-raw :80 --output-http "http://staging.com"  --output-http "http://dev.com" --split-output true
```


- 将请求保存到文件并稍后重播

```
## 将请求保存到requests.gor文件中
sudo ./goreplay --input-raw :8000 --output-file=requests.gor

## 从requests.gor文件中溯源网络请求
./goreplay --input-file requests.gor --output-http="http://localhost:8001"
```

- 跟踪原始IP地址  
可以使用--input-raw-realip-header选项指定标题名称：如果不是空白，则将具有给定名称和真实IP值的标题注入请求有效内容。通常，这个标题应该被命名为：X-Real-IP，但是你可以指定任何名字。


```
./goreplay  --input-raw :80 --input-raw-realip-header "X-Real-IP" ...
```

- [请求重写](https://github.com/buger/goreplay/wiki/Request-rewriting)

```
# Rewrites all `/v1/user/<user_id>/ping` requests to `/v2/user/<user_id>/ping`
./goreplay --input-raw :8080 --output-http staging.com --http-rewrite-url /v1/user/([^\\/]+)/ping:/v2/user/$1/ping
```

- [请求过滤](https://github.com/buger/goreplay/wiki/Request-filtering)


```
## 允许URL正则表达式
# only forward requests being sent to the /api endpoint
./goreplay --input-raw :8080 --output-http staging.com --http-allow-url /api
```
- [限速](https://github.com/buger/goreplay/wiki/Rate-limiting)

```
# 限制重播使用绝对数量
# staging.server will not get more than ten requests per second
./goreplay --input-tcp :28020 --output-http "http://staging.com|10"
```


## 参考资料

- [GoReplay](https://github.com/buger/goreplay/wiki)


