//index.js
//获取应用实例
const app = getApp()

Component({
  data: {
    openid: '',
    article: ''
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' &&
        this.getTabBar()) {
        this.getTabBar().setData({
          selected: 0
        })
      }
    }
  },
  methods: {
    onLoad: function () {
      if (!wx.cloud) {
        wx.redirectTo({
          url: '../error/error',
        })
        return
      }

      //获取 openid
      this.onGetOpenid();
      //获取用户信息
      this.onGetUserinfo();
      //查询文章列表
      this.onQuery();
    },
    onGetOpenid: function () {
      // 调用云函数
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          console.log('[云函数] [login] user openid: ', res.result.openid)
          app.globalData.openid = res.result.openid
        },
        fail: err => {
          console.error('[云函数] [login] 调用失败', err)
          wx.navigateTo({
            url: '../error/error',
          })
        }
      })
    },
    onGetUserinfo: function () {
      // 获取用户信息
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                console.log('[API] [userInfo] user userInfo: ', res.userInfo)
                this.setData({
                  avatarUrl: res.userInfo.avatarUrl,
                  userInfo: res.userInfo
                })
              }
            })
          }
        }
      })
    },
    onQuery: function () {
      const db = wx.cloud.database()
      // 查询当前用户所有的 blog_article_list
      db.collection('blog_article_list').where({
        _openid: this.data.openid
      }).get({
        success: res => {
          this.setData({
            article: res.data
          })
          console.log('[数据库] [查询记录] 成功: ', res)
        },
        fail: err => {
          wx.showToast({
            icon: 'none',
            title: '查询记录失败'
          })
          console.error('[数据库] [查询记录] 失败：', err)
        }
      })
    },
    onGetDetail: function (e) {
      var data = e.currentTarget.dataset;
      wx.redirectTo({
        url: '/pages/articleDetail/articleDetail?openid='+this.data.openid+"&detail_url="+data.detail_url,
      })
    }
  }
})