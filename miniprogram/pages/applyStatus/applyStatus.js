const app = getApp()

Page({
  data: {
    status: '',
    inited: false,
  },
  onLoad() {
    this.init()
  },
  init() {
    app.$ready = app.appReady() // 刷新用户状态
    wx.showLoading({ title: '加载中', mask: true })
    app.$ready.then((res) => {
      wx.hideLoading()
      const { applyStatus } = res
      this.setData({ status: applyStatus, inited: true })
    })
    .catch(e => {
      wx.hideLoading()
      wx.showToast({ title: '请求出错，请退出重试', duration: 5000 })
    })
  },
  onRefresh() {
    this.init()
  },
  onShareAppMessage() {
    return {
      title: '您的账号助手',
      path: '/pages/index/index',
      imageUrl: '/images/share.png',
    }
  },
})