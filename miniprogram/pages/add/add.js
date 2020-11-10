import Crypto from '../../utils/crypto'
import dbAccounts from '../../db/accounts'

const app = getApp()
const { bus } = app

Page({
  data: {
    mode: 'add',
    account: '',
    password: '',
    remark: '',
    category: '默认',
    saveRange: ['本地', '云端'],
    cryptoRange: ['SM4', 'AES'],
    cryptoType: 'SM4',
    saveType: '本地',
    showKeyDialog: false,
    selectionStart: 0,
    selectionEnd: 0,
    isFocused: false,
  },
  onLoad() {
    const { saveType = '本地' } = app.globalData
    this.setData({ saveType: decodeURIComponent(saveType) })
    this.showPasswordTip()
  },
  showPasswordTip() {
    const isShowPasswordTip = wx.getStorageSync('isShowPasswordTip')
    if (!isShowPasswordTip) {
      wx.showModal({
        title: '温馨提示',
        cancelText: '不再提示',
        confirmText: '知道了',
        content: '点击“密码”可自动生成推荐密码',
        success: ({ confirm }) => {
          if (!confirm) {
            wx.setStorageSync('isShowPasswordTip', true)
          }
        }
      })
    }
  },
  encrypt(data) {
    const key = app.globalData.key
    const { cryptoType } = this.data
    if (!key) {
      wx.navigateTo({ url: '/pages/key/key' })
      return
    }
    return Crypto.encrypt(data, key, cryptoType)
  },
  resetInput() {
    this.setData({
      account: '',
      password: '',
      remark: '',
      category: '默认',
    })
  },
  onInput(e) {
    const { type } = e.currentTarget.dataset
    this.data[type] = e.detail.value
  },
  saveCloudAccount() {
    const { account, password, remark, category, cryptoType } = this.data
    const cloudData = {}
    if (account) {
      cloudData.account = this.encrypt(account)
    }
    if (password) {
      cloudData.password = this.encrypt(password)
    }
    if (remark) {
      cloudData.remark = this.encrypt(remark)
    }
    cloudData.cryptoType = cryptoType
    cloudData.category = category
    cloudData.createdAt = Date.now()

    wx.showLoading({ title: '创建中..' })
    dbAccounts.add(cloudData)
      .then(res => {
        const { code } = res
        if (code === 0) {
          wx.showToast({ title: '创建成功' })
          this.resetInput()
        } else {
          wx.showToast({ title: '创建失败' })
        }
      })
  },
  onAddButtonTap() {
    const { account, password, remark, category, saveType } = this.data
    const { userInfo = {} } = app.globalData
    const { role } = userInfo
    bus.emit('add')
    if (!account && !password && !remark) {
      wx.showToast({ title: '至少填写一项' })
      return
    }
    if ((role === 'member' || role === 'admin')  && saveType === '云端') { // 云存储
      this.saveCloudAccount()
    } else if (saveType === '本地') { // 本地存储
      const accounts = wx.getStorageSync('accounts') || []
      if (Array.isArray(accounts)) {
        const data = { account, password, remark, category, id: Date.now() }
        accounts.unshift(data)
        wx.setStorage({
          data: accounts,
          key: 'accounts',
        })
        wx.showToast({ title: '保存成功' })
        this.resetInput()
      }
    }
    
  },
  onSaveTypeChange(e) {
    const { value } = e.detail
    console.log(e.detail)
    if (value === '0') {
      this.setData({ saveType: '本地' })
    } else {
      app.$ready.then(res => {
        const { role, applyStatus } = res
        if (role !== 'member' && role !== 'admin') {
          if (applyStatus === 1) {
            wx.showModal({
              title: '提示',
              content: '请等待管理员审核云存储权限',
            })
            return
          } else {
            this.setData({ showAccessDialog: true })
          }
          this.setData({ saveType: '本地' })
        } else {
          this.setData({ saveType: '云端' })
        }
      })
      .catch(() => {
        wx.showToast({
          title: '数据初始化出错',
          icon: 'none',
        })
      })
    }
  },
  onCryptoTypeChange(e) {
    const { value } = e.detail
    this.setData({ cryptoType: this.data.cryptoRange[value] })
  },
  onAutoPassword() {
    const password = this.makePasswd()
    this.setData({ password })
  },
  makePasswd() {
    let passwd = '';
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const { passwordLength = 12 } = app.globalData
    for (let i = 0; i < passwordLength; i++) {
      let c = Math.floor(Math.random() * chars.length + 1);
      passwd += chars.charAt(c)
    }
    const upCaseReg = /[A-Z]/
    const lowCaseReg = /[a-z]/
    const numReg = /[0-9]/

    if (upCaseReg.test(passwd) && lowCaseReg.test(passwd) && numReg.test(passwd)) return passwd
    return this.makePasswd() 
  },
})