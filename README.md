# hugo-blog
这是一个基于hugo生成的静态站点

## 部署方式
- DaoCloud 自动化部署
- Nginx 部署

### Nginx 部署
1. 安装配置 Nginx，配置示例文件 `./web-app/nginx.conf`；
2. 在 web-app 目录下执行 `hugo` 命令编译生成静态文件到 `public/` 目录下；
3. 将 `public/` 目录下的文件 Copy 到 Nginx 配置文件 `root` 指向的文件夹下。 