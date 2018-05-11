+++
read_time = 20
date = "2018-02-05"
title = "微服务设计中文完整版"
description = "微服务是一种分布式系统解决方案，推动细粒度服务的使用，这些服务协同工作，且每个服务都又自己的生命周期。因为微服务主要围绕业务领域建模，所以避免了由传统的分层架构引发的很多问题。微服务也整合了过去十年来的新概念和技术，因此得以避开许多面向服务的架构的陷阱。" 
draft = false
weight = 1
+++


<iframe frameborder="0" scrolling="no" id="frame-preview"  width="100%"></iframe>


<script type="text/javascript">

//更改iframe高度
function changeHeight(){
    document.getElementById('frame-preview').height=document.documentElement.clientHeight-10;
};

window.onload = function () {
    var urlFile = "https://os-qingdao.oss-cn-qingdao.aliyuncs.com/data/unionpay/%E8%B5%84%E6%96%99%E6%96%87%E6%A1%A3/%E5%9B%BE%E4%B9%A6/%E5%BE%AE%E6%9C%8D%E5%8A%A1/%E5%BE%AE%E6%9C%8D%E5%8A%A1%E8%AE%BE%E8%AE%A1%E4%B8%AD%E6%96%87%E5%AE%8C%E6%95%B4%E7%89%88.pdf";
    var url = "http://127.0.0.1:8012/onlinePreview?url="+urlFile;
    var iframeDom = document.getElementById('frame-preview');
    iframeDom.src = url;
    changeHeight(iframeDom);
};

window.onresize = function(){
    changeHeight();
};

</script>



