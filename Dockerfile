FROM publysher/hugo
MAINTAINER qing.muyi@foxmail.com
ENTRYPOINT ["hugo","server"]
CMD ["--bind="0.0.0.0" -v -w -p 80 -b http://www.bugjc.com"]