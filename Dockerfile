FROM publysher/hugo
MAINTAINER qing.muyi@foxmail.com
ENTRYPOINT ["hugo","server"]
CMD [" -v -w -p 80"]