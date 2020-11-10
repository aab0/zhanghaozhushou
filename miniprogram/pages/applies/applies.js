import dayjs from '../../utils/dayjs.min.js'

const app = getApp()

Page({
  data: {
    applyStatus: 1, // 待审核，2：审核通过， -1: 审核不通过
    applyStatusName: '待审核',
    keyword: '',
    applyRange: [
      {
        name: '待审核',
        value: 1,
      },
      {
        name: '审核通过',
        value: 2,
      },
      {
        name: '审核不通过',
        value: -1,
      },
    ],
    headerHeight: 64,
    list: [],
    page: 1,
    pageSize: 10,
    totalPage: 0,
    inited: false,
    loading: false,
    headerHeight: 44,
    tabs: [
      '待审核',
      '审核通过',
      '审核不通过'
    ],
    tabIndex: 0,
    left: 0,
  },
  onLoad() {
    app.$ready.then(res => {
      const { role } = res
      if (role === 'admin') {
        this.init()
      } else {
        this.setData({ inited: true })
      }
    })
    .catch((e) => {
      console.log(e)
      wx.showToast({ title: '初始化失败', icon: 'none' })
    })
  },
  onShow() {
    this.setTabUnderlineLeft()
  },
  setTabUnderlineLeft() {
    const query = wx.createSelectorQuery()
    const { tabIndex } = this.data
    query.select(`#tab-${tabIndex}`).boundingClientRect()
    query.exec(res => {
      console.log(res)
      const { left, width } = res[0]
      this.setData({ left: left + (width / 2) - 16 })
    })
  },
  onTab(e) {
    const { index } = e.currentTarget.dataset
    this.setData({ tabIndex: index })
    this.setTabUnderlineLeft()
    this.onPickerChange(index)
  },
  onPickerChange(value) {
    const item = this.data.applyRange[value]
    const { name: applyStatusName, value: applyStatus } = item
    this.setData({ applyStatusName, applyStatus, page: 1, keyword: '' })
    this.init()
  },
  init(title = '玩命加载中...') {
    const { page, pageSize, applyStatus, keyword } = this.data
    const params = { page, pageSize, applyStatus, keyword }
    wx.showLoading({ title, mask: true })
    this.setData({ loading: true })
    this.fetchList(params)
      .then(list => {
        wx.hideLoading()
        this.setActionName(list)
        
        this.setData({ list, inited: true, loading: false })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ inited: true, loading: false })
      })
    this.countList(params)
      .then(total => {
        const { pageSize } = this.data
        const totalPage = Math.ceil(total / pageSize)
        this.setData({ total, totalPage })
      })
  },
  setActionName(list) {
    list.forEach(item => {
      const { applyStatus, applyAt } = item
      item.applyAt = dayjs(applyAt).format('YYYY-MM-DD HH:mm:ss')
      if (applyStatus === -1) {
        item.actionName = '重审'
        item.applyStatusName = '审核不通过'
      } else if (applyStatus === 1) {
        item.actionName = '通过'
      } else if (applyStatus === 2) {
        item.actionName = '撤销'
      }
    })
  },
  fetchList(data = {}) {
    data.method = 'get'
    return wx.cloud.callFunction({
      name: 'users',
      data
    })
    .then(res => {
      const { code, data } = res.result
      if (code === 0) return data
      return []
    })
    .catch(() => [])
  },
  countList(data = {}) {
    data.method = 'count'
    return wx.cloud.callFunction({
      name: 'users',
      data
    })
    .then(res => {
      const { code, data } = res.result
      if (code === 0) return data.total
      return 0
    })
    .catch(() => 0)
  },
  onScrollBottom() {
    const { page, pageSize, totalPage, applyStatus, keyword, list } = this.data
    console.log(totalPage)
    if (page >= totalPage) return
    wx.showLoading({ title: '玩命加载中...' })
    this.fetchList({ page: page + 1, pageSize, applyStatus, keyword })
      .then(res => {
        wx.hideLoading()
        if (res.length > 0) {
          this.setActionName(res)
          const newList = list.concat(res)
          this.setData({ list: newList, page: page + 1})
        }
      })
      .catch(() => {
        wx.hideLoading()
      })
  },
  onActionTap(e) {
    const { index, id, status } = e.currentTarget.dataset
    const item = this.data.list[index]
    const { nickName } = item
    const { tabIndex } = this.data
    
    let message = ''
    let role = ''
    if (status === -1) {
      if (tabIndex === 0) {
        message = `是否拒绝用户${nickName}的云存储权限申请？`
      } else {
        message = `是否撤销用户${nickName}的云存储权限申请？`
      }
      role = ''
    } else if (status === 1) {
      message = `是否重审用户${nickName}的云存储权限？`
      role = ''
    } else if (status === 2) {
      message = `是否通过用户${nickName}的云存储权限申请？`
      role = 'member'
    }
    wx.showModal({
      title: '提示',
      content: message,
      success: ({ confirm }) => {
        if (confirm) {
          const data = { id, role, applyStatus: status, method: 'update' }
          wx.showLoading({ title: '更新中...'})
          wx.cloud.callFunction({
            name: 'users',
            data,
          })
          .then(res => {
            wx.hideLoading()
            const { code } = res.result
            if (code === 0) {
              this.init('列表刷新中...')
            } else {
              wx.showToast({ title: '更新失败', icon: 'none' })
            }
          })
          .catch((e) => {
            console.log(e)
            wx.hideLoading()
            wx.showToast({ title: '更新失败', icon: 'none' })
          })
        }
      }
    })
  }
})