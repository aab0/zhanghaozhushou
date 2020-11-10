import dbAccounts from '../../db/accounts'
import Crypto from '../../utils/crypto'

const app = getApp()

Page({
  data: {
    offset: 0,
    limit: 20,
    total: 0,
    list: [],
    searchList: [],
    inited: false,
  },
  onLoad(options) {
    const { category = '', saveType = '' } = options
    const type = decodeURIComponent(saveType)
    this.setData({ category: decodeURIComponent(category), saveType: type })
  },
  onShow() {
    const { saveType } = this.data
    if (saveType === '云端') {
      this.initCloudList()
    } else if (saveType === '本地') {
      this.initLocalList()
    } else {
      this.setData({ inited: true })
    }
  },
  initLocalList() {
    const accounts = wx.getStorageSync('accounts')
    if (Array.isArray(accounts)) {
      const { category } = this.data
      if (category) {
        this.setData({ list: accounts.filter(item => item.category === category ), inited: true })
      } else {
        this.setData({ list: accounts, inited: true })
      }
      this.data.searchList = this.data.list
    }
  },
  initCloudList() {
    const { category } = this.data
    const params = {}
    if (category) {
      params.category = category
    }
    this.countList(params)
      .then(() => {
        wx.showLoading({ title: '数据加载中...' })
        this.loadList()
          .then((list) => {
            wx.hideLoading()
            this.decryptList(list)
          })
      })
      .catch((e) => {
        console.log(e)
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },
  decryptList(list) {
    if (!Array.isArray(list)) return
    wx.showLoading({ title: '解密中...'})
    const { key } = app.globalData
    for(let i = 0; i < list.length; i++) {
      const item = list[i]
      const { cryptoType, account, password, remark } = item
      if (account) {
        item.account = Crypto.decrypt(account, key, cryptoType)
      }
      if (password) {
        item.password = Crypto.decrypt(password, key, cryptoType)
      }
      if (remark) {
        item.remark = Crypto.decrypt(remark, key, cryptoType)
      }
      item.id = item._id // 兼容旧版本
    }
    wx.hideLoading()
    this.setData({ list, inited: true })
  },
  async loadList() {
    const { limit, total, category } = this.data
    const params = {}
    if (category) {
      params.category = category
    }
    let list = []
    let offset = 0
    if (total > 0) {
      const totalPage = Math.ceil(total / limit)
      for(let i = 0; i < totalPage; i++) {
        offset = i * limit

        const data = await this.fetchList(params, offset, limit)
        list = list.concat(data)
      }
      this.data.searchList = list
      return list
    }
  },
  fetchList(params, offset = 0, limit = 20) {
    return dbAccounts.get(params, offset, limit)
      .then(res => {
        const { code, data } = res
        if (code === 0) return data
        return []
      })
      .catch(() => [])
  },
  countList(params) {
    return dbAccounts.count(params)
      .then(res => {
        const { code, data } = res
        if (code === 0) {
          this.setData({ total: data.total })
          return data.total
        }
        return 0
      })
      .catch(() => 0)
  },
  onSearchInput(e) {
    const { value } = e.detail
    const { searchList } = this.data
    const list = searchList.filter(item => {
      const { account = '', password = '', remark = '' } = item
      const flag =  account.indexOf(value) > -1
       || password.indexOf(value) > -1
       || remark.indexOf(value) > -1
      return flag
    })
    this.setData({ list })
  },
  onSearchClear() {
    this.setData({ list: this.data.searchList })
  },
  onCopy(e) {
    const { data } = e.currentTarget.dataset
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: '复制成功' })
      }
    })
  },
  onModify(e) {
    const { index, id } = e.currentTarget.dataset
    const { saveType } = this.data
    console.log('ppp')
    wx.navigateTo({
      url: `/pages/account/account?id=${id}&index=${index}&saveType=${saveType}`,
    })
  },
  removeCloudAccout(id, index) {
    wx.showLoading({ title: '删除中...' })
    return dbAccounts.remove(id)
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '删除成功' })
        const { list } = this.data
        list.splice(index, 1)
        this.setData({ list })
      })
      .catch((e) => {
        console.log(e)
        wx.showToast({
          title: '删除失败',
        })
      })
  },
  removeLocalAccount(id, index) {
    const accounts = wx.getStorageSync('accounts')
    if (Array.isArray(accounts)) {
      const removeIndex = accounts.findIndex(item => item.id === id)
      if (removeIndex > -1) {
        accounts.splice(removeIndex, 1)
        wx.setStorage({
          data: accounts,
          key: 'accounts',
          success: () => {
            const { list } = this.data
            list.splice(index, 1)
            this.setData({ list })
            wx.showToast({ title: '删除成功' })
          },
          fail: () => {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        })
      }
    }
  },
  onRemove(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '删除提示',
      content: '账号删除后将无法恢复！请确认是否删除',
      success: ({ confirm }) => {
        if (confirm) {
          const item = this.data.list[index]
          const { id } = item
          const { saveType } = this.data
          if (saveType === '云端') {
            this.removeCloudAccout(id, index)
          } else if (saveType === '本地') {
            this.removeLocalAccount(id, index)
          }
        }
      }
    })
  },
})