//获取应用实例
const app = getApp();
const parser = require('../../miniprogram_npm/node-html-parser/index.js');

var minOffset = 30;//最小偏移量，低于这个值不响应滑动处理
var minTime = 60;// 最小时间，单位：毫秒，低于这个值不响应滑动处理
var startX = 0;//开始时的X坐标
var startY = 0;//开始时的Y坐标
var startTime = 0;//开始时的毫秒数

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLoading: true,
    article: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const _ts = this;
    var detailUrl = options.detail_url;
    app.getText(detailUrl, res => {
      var root = parser.parse(res.data);
      //root.removeWhitespace();
      var headHtml = root.querySelector('head').toString();
      var headerHtml = root.querySelector('header').toString();
      var footerHtml = root.querySelector('footer').toString();
      var formSubscribeHtml = root.querySelector('.form-subscribe').toString();
      var body = res.data.replace(headHtml, '').replace(headerHtml, '').replace(footerHtml, '').replace(formSubscribeHtml, '');
      console.log(body);
      let obj = app.towxml(body, 'html', {
        theme: 'light', //dark
        events: {
          tap: e => {
            console.log('tap', e);
          },
          change: e => {
            console.log('todo', e);
          }
        }
      });

      _ts.setData({
        article: obj,
        isLoading: false
      });
    });




  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 触摸开始事件，初始化 startX、startY 和 startTime
   */
  touchStart: function (e) {
    console.log('touchStart', e)
    startX = e.touches[0].pageX; // 获取触摸时的x坐标  
    startY = e.touches[0].pageY; // 获取触摸时的x坐标
    startTime = new Date().getTime();//获取毫秒数
  },
  /**
     * 触摸取消事件 （手指触摸动作被打断，如来电提醒，弹窗），要将startX、startY和startTime重置
     */
  touchCancel: function (e) {
    startX = 0;//开始时的X坐标
    startY = 0;//开始时的Y坐标
    startTime = 0;//开始时的毫秒数
  },
  /**
   * 触摸结束事件，主要的判断在这里
   */
  touchEnd: function (e) {
    console.log('touchEnd', e)
    var endX = e.changedTouches[0].pageX;
    var endY = e.changedTouches[0].pageY;
    var touchTime = new Date().getTime() - startTime;//计算滑动时间
    //开始判断
    //1.判断时间是否符合
    if (touchTime >= minTime) {
      //2.判断偏移量：分X、Y
      var xOffset = endX - startX;
      var yOffset = endY - startY;
      console.log('xOffset', xOffset)
      console.log('yOffset', yOffset)
      //①条件1（偏移量x或者y要大于最小偏移量）
      //②条件2（可以判断出是左右滑动还是上下滑动）
      if (Math.abs(xOffset) >= Math.abs(yOffset) && Math.abs(xOffset) >= minOffset) {
        //左右滑动
        //③条件3（判断偏移量的正负）
        if (xOffset < 0) {
          console.log('向左滑动')
        } else {
          console.log('向右滑动')
          this.prevPage();
        }
      } else if (Math.abs(xOffset) < Math.abs(yOffset) && Math.abs(yOffset) >= minOffset) {
        //上下滑动
        //③条件3（判断偏移量的正负）
        if (yOffset < 0) {
          console.log('向上滑动')
        } else {
          console.log('向下滑动')
        }
      }
    } else {
      console.log('滑动时间过短', touchTime)
    }
  },
  prevPage: function () {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }

})