Component({
  methods: {
    onTap() {
      const info = wx.getAccountInfoSync()
      const { appId } = info.miniProgram
      wx.navigateToMiniProgram({
        appId: 'wxac6c35ede13be318', // 账号助手
        path: '/pages/index/index',
        extraData: { appId, source: 'customerMiniProgram' } // 来源客户小程序
      })
    },
  },
})
