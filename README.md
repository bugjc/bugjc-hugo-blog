## 1. 简介
这是一个基于 hugo 生成的静态站点

## 2. 部署方式
- DaoCloud 自动化部署
- Nginx 部署
### 2.1. DaoCloud 自动化部署
TODO

### 2.2. Nginx 部署
1. 安装配置 Nginx，安装目录：`cd /usr/local/nginx-proxy/`
2. 创建 Nginx `nginx-proxy/wen/blog` 目录
3. 配置修改示例文件 `./web-app/nginx.conf`；
4. 在 web-app 目录下执行 `hugo` 命令编译生成静态文件到 `public/` 目录下；
5. 将 `public/` 目录下的文件 Copy 到 Nginx 配置文件 `root` 指向的文件夹下。 
6. 启动 Nginx :
    ```
    cd /usr/local/nginx-proxy/
    ./sbin/nginx
    ```
