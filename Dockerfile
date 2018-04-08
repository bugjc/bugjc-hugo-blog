FROM publysher/hugo
MAINTAINER qing.muyi@foxmail.com
ENTRYPOINT ["hugo","server"," -v -w -p 80"]