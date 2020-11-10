import dbUsers from '../../db/users'

const app = getApp()

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  properties: {
    show: {
      type: Boolean,
      value: false,
    }
  },
  data: {
    showAccessDialog: false,
  },
  observers: {
    show() {
      this.setData({ showAccessDialog: this.data.show })
    }
  },
  methods: {
    onAccessDialogGetUserInfo(e) {
      const { userInfo } = e.detail
      console.log(userInfo)
      if (userInfo) {
        app.$ready.then(res => {
          console.log(res)
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
            console.log('xxx')
            wx.showLoading({ title: '申请中...', mask: true })
            dbUsers.update(_id, params)
              .then(res => {
                console.log(res)
                wx.hideLoading()
                const { code } = res
                if (code === 0) {
                  wx.showModal({
                    title: '提示',
                    content: '申请成功',
                    confirmText: '查看状态',
                    success: ({ confirm }) => {
                      if (confirm) {
                        wx.navigateTo({
                          url: '/pages/applyStatus/applyStatus',
                        })
                      }
                    }
                  })
                } else {
                  wx.showToast({ title: '申请失败，请重试', icon: 'none' })
                }
                
              })
              .catch(e => {
                console.log(e)
                wx.hideLoading()
                wx.showToast({ title: '申请失败，请重试', icon: 'none' })
              })
          } else {
            wx.hideLoading()
            this.setData({ show: false })
            wx.navigateTo({
              url: '/pages/applyStatus/applyStatus',
            })
          }
        })
        .catch(e => {
          console.log(e)
          wx.hideLoading()
        })
      } else {
        wx.showModal({
          title: '授权失败',
          content: '开通云端存储权限需要授权用户信息，以便管理员审核。',
          confirmText: '重新授权',
          success: ({ confirm }) => {
            if (confirm) {
              wx.openSetting()
            }
          }
        })
      }
    },
    onClose(e) {
    },
    onGoToQuestions() {
      wx.navigateTo({ url: '/pages/procotol/procotol' })
    },
  }
})
