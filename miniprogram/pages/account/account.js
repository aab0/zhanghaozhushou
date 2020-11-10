import Crypto from '../../utils/crypto'
import dbAccounts from '../../db/accounts'

const app = getApp()
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    mode: 'add',
    account: '',
    password: '',
    remark: '',
    category: '默认',
    cryptoRange: ['SM4', 'AES'],
    cryptoType: 'SM4',
    saveRange: ['本地', '云端'],
    saveType: '本地',
  },
  onLoad(option) {
    const { saveType, index, id } = option
    this.setData({
      index,
      id,
      saveType: decodeURIComponent(saveType),
    })
    this.init(index)
  },
  init(index) {
    const pages = getCurrentPages()
    const length = pages.length
    if (length > 1) {
      const page = pages[length - 2]
      const item = page.data.list[index]
      const { category, account, password, remark, cryptoType } = item
      this.setData({ category, account, password, remark, cryptoType })
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
  onInput(e) {
    const { type } = e.currentTarget.dataset
    this.data[type] = e.detail.value
  },
  updatePrePageData() {
    const { account, password, remark, category, saveType, index } = this.data
    const pages = getCurrentPages()
    const length = pages.length
    if (length > 1) {
      const page = pages[length - 2]
      const { list } = page.data
      const item = list[index]
      item.account = account
      item.password = password
      item.remark = remark
      item.category = category
      item.saveType = saveType
      page.setData({ [`list[${index}]`]: item })
    }
  },
  saveCloudAccount() {
    const { account, password, remark, category, id } = this.data
    const cloudData = {}
    if (account) {
      cloudData.account = this.encrypt(account)
    } else {
      cloudData.account = _.remove()
    }
    if (password) {
      cloudData.password = this.encrypt(password)
    } else {
      cloudData.password = _.remove()
    }
    if (remark) {
      cloudData.remark = this.encrypt(remark)
    } else {
      cloudData.remark = _.remove()
    }
    cloudData.category = category
    cloudData.updatedAt = Date.now()

    wx.showLoading({ title: '保存中..', mask: true })
    dbAccounts.update(id, cloudData)
      .then(res => {
        const { code } = res
        if (code === 0) {
          wx.showToast({ title: '保存成功' })
          this.updatePrePageData()
          wx.navigateBack()
        } else {
          wx.showToast({ title: '保存失败' })
        }
      })
  },
  // 本地保存
  saveLocalAccount() {
    const { account, password, remark, category, id } = this.data
    const accounts = wx.getStorageSync('accounts') || []
    if (Array.isArray(accounts)) {
      const item = accounts.findItem(item => item.id === id)
      item.account = account
      item.password = password
      item.remark = remark
      item.category = category
      wx.setStorage({
        data: accounts,
        key: 'accounts',
        success: () => {
          this.updatePrePageData()
          wx.showToast({ title: '保存成功' })
          wx.navigateBack()
        },
        fail: () => {
          wx.showToast({ title: '保存失败' })
        }
      })
    }
  },
  onCryptoTypeChange(e) {
    const { value } = e.detail
    this.setData({ cryptoType: this.data.cryptoRange[value] })
  },
  onButtonTap() {
    const { account, password, remark, saveType } = this.data
    const { userInfo = {} } = app.globalData
    const { role } = userInfo

    if (!account && !password && !remark) {
      wx.showToast({ title: '请填写账号密码' })
      return
    }
    if ((role === 'member' || role === 'admin')  && saveType === '云端') { // 云存储
      this.saveCloudAccount()
    } else if (saveType === '本地') { // 本地存储
      this.saveLocalAccount()
    }
  },
  onSaveTypeChange(e) {
    const { value } = e.detail
    if (value === 0) {
      this.setData({ saveType: '本地' })
    } else {
      this.setData({ saveType: '云端' })
    }
  }
})