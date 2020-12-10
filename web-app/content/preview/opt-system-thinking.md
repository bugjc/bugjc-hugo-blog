+++
read_time = 20
date = "2018-02-05"
title = "操作系统思考中文版"
description = "在许多计算机科学的课程中，操作系统都是高级话题。学生在上这门课之前，它们已经知道了如何使用C语言编程，他们也可能上过计算机体系结构（组成原理）的课程。通常这门课的目标是让学生们接触操作系统的设计与实现，并带有一些他们未来在该领域所研究的隐含假设，或者让他们手写OS的一部分。" 
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
    var urlFile = "https://os-qingdao.oss-cn-qingdao.aliyuncs.com/data/unionpay/%E8%B5%84%E6%96%99%E6%96%87%E6%A1%A3/%E5%9B%BE%E4%B9%A6/%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F/think-os.pdf";
    var url = "http://preview.bugjc.com:8012/onlinePreview?url="+urlFile;
    
    var iframeDom = document.getElementById('frame-preview');
    iframeDom.src = url;
    changeHeight(iframeDom);
};

window.onresize = function(){
    changeHeight();
};

</script>



