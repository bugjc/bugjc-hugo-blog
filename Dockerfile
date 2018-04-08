FROM publysher/hugo
MAINTAINER qing.muyi@foxmail.com
ENTRYPOINT ["hugo","server"]
CMD ["hugo server -v -w -p 8080"]