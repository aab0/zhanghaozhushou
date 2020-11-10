import dbAccounts from '../../db/accounts'
import { categoriesIconMap, defaultIcon } from '../../config/categories'
import { groupBy } from '../../utils/array'

const app = getApp()
const { bus } = app

Page({
  data: {
    list: [],
    dataType: 0,
    underlineLeft: 0,
    cloudLeft: 0,
    localLeft: 0,
    currentSwiperItem: 0,
    page: 1,
    pageSize: 20,
    cloudList: [],
    cloudListInited: false,
    localList: [],
    localListInited: false,
    cloudRefresherTriggered: false,
    showKeyDialog: false,
    keyDialogType: 'set',
    showAccessDialog: false,
    keyDialogCallback: 'initData',
    keyPass: false,
    keyButtonText: '设置主密码',
    isAccountAssistant: app.globalData.isAccountAssistant,
  },
  onLoad() {
    this.init()
    wx.hideTabBar()
    this.init()
    wx.nextTick(() => {
      this.initUnderline()
    })
  },
  initEvent() {
    bus.add('add', this.refreshData)
  },
  refreshData() {
    this.initCloudAccountsCategory()
    this.initLocalAccountsGroup()
  },
  init() {
    wx.hideTabBar({ animation: false })
    const { key } = app.globalData
    if (key) return
    this.setData({ showKeyDialog: true, keyDialogCallback: 'initData' })
    app.$ready.then(res => {
      const { role, sign } = res
      if (sign) {
        this.setData({ keyButtonText: '登录' })
      } else {
        this.setData({ keyButtonText: '设置主密码' })
      }
      if (role !== 'member' || role !== 'admin') {

      } 
    })
  },
  initData() {
    app.$ready.then((res) => {
      const { userInfo = {} } = app.globalData
      const { role } = userInfo
      if (role === 'admin' || role === 'member') {
        wx.showLoading({ title: '数据加载中...' })
        this.initCloudAccountsCategory()
          .then(() => {
            this.setData({ cloudListInited: true })
            wx.hideLoading()
          })
          .catch(() => {
            this.setData({ cloudListInited: true })
            wx.hideLoading()
          })
      } else {
        wx.hideLoading()
        this.setData({ cloudListInited: true })
      }
    })
    .catch(() => {
      wx.hideLoading()
    })
    this.initLocalAccountsGroup()
  },
  initLocalAccountsGroup() {
    const accounts = wx.getStorageSync('accounts') || []
    if (Array.isArray(accounts)) {
      const categoriesGroup = groupBy(accounts, 'category')
      const categories = Object.keys(categoriesGroup)
      const localList = categories.map(item => ({
        name: item,
        total: categoriesGroup[item].length,
        icon: categoriesIconMap[item] || defaultIcon,
        url: `/pages/accounts/accounts?category=${encodeURIComponent(item)}&saveType=${encodeURIComponent('本地')}`
      }))
      this.setData({ localList: this.orderGroups(localList), localListInited: true })
    }
  },
  // 云端账号
  initCloudAccountsCategory() {
    return dbAccounts.getGroupByCategory()
      .then(res => {
        const { code, data } = res
        if (code === 0) {
          data.forEach(item => {
            item.name = item._id,
            item.icon = categoriesIconMap[item._id]
            item.buttons = [{ text: '删除', type: 'warn' }]
            item.url = `/pages/accounts/accounts?category=${encodeURIComponent(item.name)}&saveType=${encodeURIComponent('云端')}`
          })
          const cloudList = this.orderGroups(data)
          this.setData({ cloudList, cloudListInited: true })
        }
      })
  },
  // 将分类排序， “默认” 放最前，“其他” 放最后
  orderGroups(list) {
    const defaultIndex = list.findIndex(item => item.name === '默认')
    if (defaultIndex > -1) {
      const defaultItem = list.splice(defaultIndex, 1)
      list.unshift(defaultItem[0])
    }
    const orderIndex = list.findIndex(item => item.name === '其他')
    if (orderIndex > -1) {
      const orderItem = list.splice(orderIndex, 1)
      list.push(orderItem[0])
    }
    return list
  },
  initUnderline() {
    const query = wx.createSelectorQuery()
    query.select('#header-item-1').boundingClientRect()
    query.select('#header-item-2').boundingClientRect()

    query.exec((res) => {
      const { left } = res[0]
      this.data.cloudLeft = left
      this.setUnderlineLeft()
    })
    query.exec((res) => {
      const { left } = res[1]
      this.data.localLeft = left
      this.setUnderlineLeft()
    })
  },
  setUnderlineLeft() {
    const { dataType } = this.data
    if (dataType === 0) {
      this.setData({ underlineLeft: this.data.cloudLeft })
    }
    if (dataType === 1) {
      this.setData({ underlineLeft: this.data.localLeft })
    }
    this.setData({ initedUnderline: true })
  },
  // 触发页面更新
  setCloudListAfterKeyConfirm() {
    const { cloudList } = this.data
    this.setData({ cloudList })
  },
  // 点击创建账号后的回调
  goToAddClondAccoutAfterKeyConfirm() {
    app.globalData.saveType = '云端'
    wx.switchTab({ url: '/pages/add/add' })
  },
  onSwitch(e) {
    const { type } = e.currentTarget.dataset
    this.setData({
      dataType: type,
      currentSwiperItem: type,
    })
    this.setUnderlineLeft()
  },
  onSwiperChange(e) {
    const { current } = e.detail
    this.setData({ dataType: current })
    this.setUnderlineLeft()
  },
  onAddTap(e) {
    const { type } = e.currentTarget.dataset
    if (type === '云端') {
      app.$ready.then(res => {
        const { role, applyStatus } = res
        if (role === 'admin' || role === 'member') {
          app.globalData.saveType = '云端'
          const url = '/pages/add/add'
          wx.switchTab({ url })
        } else {
          if (applyStatus === 1) {
            wx.navigateTo({
              url: '/pages/applyStatus/applyStatus',
            })
            return
          }
          wx.showModal({
            title: '提示',
            content: '创建云端账号需要先申请云端存储权限',
            confirmText: '申请',
            success: ({ confirm }) => {
              if (confirm) {
                this.setData({ showAccessDialog: true })
              }
            }
          })
        }
      })
    } else {
      app.globalData.saveType = '本地'
      wx.switchTab({ url: '/pages/add/add' })
    }
  },
  onPullDownRefresh() {
    wx.showLoading({ title: '刷新中...', mask: true })
    this.initCloudAccountsCategory()
      .then(() => {
        wx.hideLoading()
        wx.stopPullDownRefresh()
      })
      .catch(() => {
        wx.hideLoading()
        wx.stopPullDownRefresh()
      })
    this.initLocalAccountsGroup()
  },
  onScrollCloudRefresh(e) {
    this.initCloudAccountsCategory()
      .then(() => {
        wx.hideLoading()
        this.setData({ cloudRefresherTriggered: false })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ cloudRefresherTriggered: false })
      })
  },
  // 主密码弹窗confirm回调
  onKeyDialogConfirm(e) {
    const { pass, callback } = e.detail
    if (pass) {
      this.setData({ keyPass: true, keyButtonText: '登录' })
      wx.showTabBar()
    }
    if (pass && typeof this[callback] === 'function') {
      
      this[callback]()
    }
    this.setData({ [callback]: '' }) // 重置callback
  },
  onGoToProcotol() {
    this.setData({ showAccessDialog: false })
    wx.navigateTo({ url: '/pages/procotol/procotol' })
  },
  onKeyButtonTap() {
    this.setData({ showKeyDialog: true, keyDialogCallback: 'initData' })
  },
  onProtocolTap() {
    wx.navigateTo({ url: '/pages/procotol/procotol' })
  },
  onShareAppMessage(e) {
    return {
      title: '您的账号助手',
      path: '/pages/index/index',
      imageUrl: '/images/share.png',
    }
  },
})