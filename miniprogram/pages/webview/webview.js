// miniprogram/pages/webview/webview.js
Page({
  data: {
    src: '',
  },
  onLoad(options) {
    const { src } = options
    if (src) {
      this.setData({ src: decodeURIComponent(src) })
    } else {
      wx.navigateBack()
    }
  },
})