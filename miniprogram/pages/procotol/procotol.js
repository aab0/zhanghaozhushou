const app = getApp()

Page({
  data: {
    isAccountAssistant: app.globalData.isAccountAssistant
  },
  onLoad() {

  },
  init() {

  },
  onShareAppMessage() {
    return {
      title: '您的账号助手',
      path: '/pages/index/index',
      imageUrl: '/images/share.png',
    }
  },
})