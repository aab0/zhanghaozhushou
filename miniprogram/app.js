import './db/index'
import dbUsers from './db/users'
import { categoriesName } from './config/categories'

App({
  globalData: {},
  bus: {
    events: {},
    add(name, callback) {
      if (!Array.isArray(this.events[name])) {
        this.events[name] = []
      } 
      this.events[name].push(callback)
    },
    remove(name, callback) {
      const events = this.events[name]
      if (Array.isArray(events)) {
        const index = events.indexOf(callback)
        if (index > -1) {
          events.splice(index, 1)
        }
      }
    },
    emit(name, params) {
      const events = this.events[name]
      if (Array.isArray(events)) {
        events.forEach(callback => {
          if (typeof callback === 'function') {
            callback(params)
          }
        })
      }
    },
  },
  onLaunch(option) {
    this.$ready = this.appReady()
    this.handleOldVersionLocalAccounts()
    this.globalData.isAccountAssistant = wx.getAccountInfoSync().miniProgram.appId === 'wxac6c35ede13be318'
  },
  async appReady() {
    return dbUsers.getByOpenId()
      .then(res => {
        const { code, data }= res
        if (code === 0) {
          if (data) {
            this.globalData.userInfo = data
          } else { // 新建用户
            return this.addUser()
          }
        }
        return data
      })
      .catch((e) => {
        console.log(e)
      })
  },
  addUser() {
    return dbUsers.add({ createdAt: Date.now() })
      .then((res) => {
        const { code, data } = res
        if (code === 0) {
          this.globalData.userInfo = data
          return data
        }
        return Promise.reject('新增用户失败')
      })
  },
  // 处理旧版本的本地Account数据
  handleOldVersionLocalAccounts() {
    const accounts = wx.getStorageSync('accounts') || []
    if (Array.isArray(accounts)) {
      let flag = false
      accounts.forEach(item => { // 兼容旧版本
        if (item.group && !item.category) {
          flag = true
          if (categoriesName.includes(item.group)) {
            item.category = item.group
          } else {
            item.category = '默认'
          }
        }
      })
      if (flag) {
        wx.setStorageSync('accounts', accounts)
      }
    }
  },
})
