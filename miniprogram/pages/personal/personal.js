import dbAccounts from '../../db/accounts'
import dbUsers from '../../db/users'

const app = getApp()

Page({
  data: {
    cloudAccounts: 0,
    localAccounts: 0,
    cards: [],
    role: '',
    passwordText: '设置主密码',
    isAccountAssistant: app.globalData.isAccountAssistant,
    showKeyDialog: false,
    keyDialogType: 'change',
    keyDialogCallback: 'keyDialogCallback',
  },
  onLoad() {
    this.init()
  },
  init() {
    app.$ready.then(res => {
      const { role, sign } = res
      if (sign) {
        this.setData({ passwordText: '更改主密码' })
      } else {
        this.setData({ passwordText: '设置主密码' })
      }
      if (role === 'admin' || role === 'member') {
        this.setData({ role })
        this.countCloudAccounts()
      }
    })
    this.countLocalAccounts()
  },
  countCloudAccounts() {
    dbAccounts.count({})
      .then(res => {
        const { code, data } = res
        if (code === 0) {
          const { total } = data
          this.setData({ cloudAccounts: total })
        }
      })
  },
  countLocalAccounts() {
    wx.getStorage({
      key: 'accounts',
      success: (res) => {
        const { data } = res
        this.setData({ localAccounts: data.length })
      },
      fail: (e) => {
        console.log(e)
      },
    })
  },
  onHeaderItemTap(e) {
    const { type } = e.currentTarget.dataset
    const { cloudAccounts, localAccounts } = this.data
    app.globalData.saveType = '本地'
    if (type === '云端' && cloudAccounts === 0) {
      wx.showModal({
        title: '提示',
        content: '暂无云端账号，是否去创建？',
        success: ({ confirm }) => {
          if (confirm) {
            app.globalData.saveType = '云端'
            wx.switchTab({ url: '/pages/add/add' })
          }
        }
      })
      return
    } else if (type === '本地' && localAccounts === 0) {
      wx.showModal({
        title: '提示',
        content: '暂无本地账号，是否去创建？',
        success: ({ confirm }) => {
          if (confirm) {
            app.globalData.saveType = '本地'
            wx.switchTab({ url: '/pages/add/add' })
          }
        }
      })
      return
    }
    const { key } = app.globalData
    if (key) {
      const url = `/pages/accounts/accounts?saveType=${type}`
      wx.navigateTo({ url })
    }
  },
  // 更改主密码
  onChangePasswordTap() {
    this.setData({ showKeyDialog: true })
  },
  onReviewTap() {
    wx.navigateTo({ url: '/pages/applies/applies' })
  },
  // 申请云存储权限
  onApplyCloudAccess(e) {
    const { userInfo } = e.detail
    if (userInfo) {
      app.$ready.then(res => {
        const { _id, applyStatus } = res
        if (!applyStatus) { // 尚未申请
           // 申请中
          const { avatarUrl, nickName } = userInfo
          const params = {
            nickName,
            avatarUrl,
            applyStatus: 1,
            applyAt: Date.now(),
          }
          wx.showLoading({ title: '申请中...', mask: true })
          dbUsers.update(_id, params)
            .then(res => {
              wx.hideLoading()
              const { code } = res
              if (code === 0) {
                wx.navigateTo({
                  url: '/pages/applyStatus/applyStatus',
                })
              } else {
                wx.showToast({ title: '申请失败，请重试', icon: 'none' })
              }
            })
            .catch(e => {
              wx.hideLoading()
              wx.showToast({ title: '申请失败，请重试', icon: 'none' })
            })
        } else {
          wx.hideLoading()
          wx.navigateTo({
            url: '/pages/applyStatus/applyStatus',
          })
        }
      })
      .catch(e => {
        wx.hideLoading()
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '申请云存储需要授权用户信息以便管理员确认你的身份',
        confirmText: '打开授权',
        success: ({ confirm }) => {
          if (confirm) {
            wx.openSetting()
          }
        }
      })
    }
  },
  // 常见问题
  onQuestionsTap() {
    const { isAccountAssistant } = this.data
    if (isAccountAssistant) {
      wx.navigateTo({
        url: '/pages/procotol/procotol',
      })
    }
  },
  onIndependentDeployTap() {
    const { isAccountAssistant } = this.data
    if (isAccountAssistant) {
      wx.showModal({
        title: '提示',
        content: '请添加专属技术支持微信：yynami',
        confirmText: '复制微信',
        success: ({ confirm }) => {
          if (confirm) {
            wx.setClipboardData({
              data: 'yynami',
              success: () => {
                wx.showToast({ title: '复制成功' })
              }
            })
          }
        },
      })
    } else {
            const info = wx.getAccountInfoSync()
      const { appId } = info.miniProgram
      wx.navigateToMiniProgram({
        appId: 'wxac6c35ede13be318',
        path: '/pages/index/index',
        extraData: { appId, source: 'customerMiniProgram' }
      })
    }
  },
  // 主密码弹窗confirm回调
  onKeyDialogConfirm(e) {
    const { pass, callback } = e.detail
    if (pass) {
      this.setData({ keyPass: true })
    }
    if (pass && typeof this[callback] === 'function') {
      this[callback]()
    }
    this.setData({ [callback]: '' }) // 重置callback
  },
  keyDialogCallback() {
    wx.showToast({ title: '修改成功' })
  },
  onShareAppMessage() {
    return {
      title: '您的账号助手',
      path: '/pages/index/index',
      imageUrl: '/images/share.png',
    }
  },
})