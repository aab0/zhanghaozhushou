import dbUsers from '../../db/users'
import dbAccounts from '../../db/accounts'
import MD5 from '../../utils/md5'
import AES from '../../utils/aes'
import SHA256 from '../../utils/sha256'

const app = getApp()
Page({
  data: {
    firstKeyTitle: '主密码',
    firstKeyPlaceholder: '请输入主密码',
    secondKeyTitle: '新密码',
    secondKeyPlaceholder: '请输入新密码',
    firstKey: '',
    hide: true,
    secondKeyHide: true,
    checkbox: [],
    checked: false,
    list: [],
  },
  onLoad(options) {
    // mode值：set, confirm, change, 默认set
    const { mode } = options
    app.$ready.then(res => {
      const { sign } = res
      if (!sign) { // 从没设置过主密码
        this.setData({ mode: 'set' })
        wx.setNavigationBarTitle({ title: '设置主密码' })
      } else if (mode === 'change') {
        this.setData({ mode: 'change' })
        wx.setNavigationBarTitle({ title: '更改主密码' })
      } else {
        this.setData({ mode: 'confirm' })
        wx.setNavigationBarTitle({ title: '校验主密码' })
      }
      this.init()
    })
    .catch(() => {
      wx.showToast({ title: '数据初始化错误, 请退出重试' })
    })
  },
  init() {
    const { mode } = this.data
    if (mode === 'change') {
      this.setData({
        firstKeyTitle: '原密码',
        firstKeyPlaceholder: '请输入原密码',
      })
    }
  },
  onInput(e) {
    const { value } = e.detail
    this.setData({ firstKey: value })
  },
  onSecondKeyInput(e) {
    const { value } = e.detail
    this.setData({ secondKey: value })
  },
  onIconTap() {
    const { hide } = this.data
    this.setData({ hide: !hide })
  },
  onSecondKeyIconTap() {
    const { secondKeyHide } = this.data
    this.setData({ secondKeyHide: !secondKeyHide })
  },
  onCheckboxChange(e) {
    const { value } = e.detail
    this.setData({ checkbox: value })
  },
  // 保存主密钥到本地
  saveKeyToLocalStorage(key) {
    const { checkbox } = this.data
    if (checkbox.length > 0) {
      wx.setStorage({
        data: key,
        key: 'key',
      })
    } else {
      wx.removeStorage({ key: 'key' })
    }
  },
  // 返回上一页
  goBackPage() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 0,
      })
    }
  },
  // 验证主密码是否正确
  validKey(key, sign) {
    const hash = SHA256(key)
    return hash === sign
  },
  // 设置主密码
  setKey() {
    return app.$ready.then((res) => {
      const {_id, sign } = res
      if (sign) return
      const { firstKey } = this.data
      wx.showModal({
        title: '重要提醒',
        content: '主密码用于加解密数据，你必须牢记于心，忘记主密码后将无法恢复数据！',
        success: ({ confirm }) => {
          if (confirm) {
            const hash = SHA256(firstKey)
            wx.showLoading({ title: '数据保存中...' })
            dbUsers.update(_id, { sign: hash })
              .then(res => {
                wx.hideLoading()
                const { code } = res
                if (code === 0) {
                  app.globalData.key = firstKey
                  wx.showToast({ title: '设置成功', mask: true })
                  setTimeout(() => {
                    this.goBackPage()
                  }, 1500)
                }
              })
              .catch(() => {
                wx.hideLoading()
                wx.showToast({ title: '主密码设置失败' })
              })
          }
        }
      })
    })
  },
  // 本地重设加密数据
  resetEncryptList(oldKey, newKey, list) {
    const res = []
    list.forEach(item => {
      const { _id, account, password, remark } = item
      const d = { id: _id }
      if (account) {
        d.account = AES.encrypt(AES.decrypt(account, oldKey), newKey)
      }
      if (password) {
        d.password = AES.encrypt(AES.decrypt(password, oldKey), newKey)
      }
      if (remark) {
        d.remark = AES.encrypt(AES.decrypt(remark, oldKey), newKey)
      }
      res.push(d)
    })
    return res
  },
  // 更新云端数据
  async updateListForResetKey(list) {
    wx.showLoading({ title: '数据保存中...', mask: true })

    for(let i = 0; i < list.length;) {
      const item = list[i]
      const { id } = item
      item.updateAt = Date.now()
      delete item.id
      const res = await dbAccounts.update(id, item)
      const { code } = res
      if (code !== 0) { // 重试
        await dbAccounts.update(id, item)
      } else {
        ++i
      }
    }
    wx.hideLoading()
    wx.showToast({ title: '更新成功' })
    return true
  },
  // 重置主密码
  resetKey() {
    return app.$ready.then(res => {
      const { sign } = res
      const { firstKey, secondKey } = this.data
      if (this.validKey(firstKey, sign)) {
        wx.showLoading({ title: '数据准备中...' })
        this.countList({})
          .then(() => {
            this.loadList()
              .then((list) => {
                console.log(list)
                wx.hideLoading()
                const newList = this.resetEncryptList(firstKey, secondKey, list)
                wx.showModal({
                  title: '重要提示',
                  content: '数据开始保存后，请勿终中断操作，否则可能丢失数据!',
                  success: ({ confirm }) => {
                    if (confirm) {
                      this.updateListForResetKey(newList)
                        .then(res => {
                          wx.showToast({
                            title: '数据保存成功',
                          })
                          this.saveKeyToLocalStorage(secondKey)
                          this.goBackPage()
                        })
                    }
                  },
                })
              })
              .catch(e => {
                wx.hideLoading()
                console.log(e)
              })
          })
          .catch(e => {
            console.log(e)
            wx.hideLoading()
          })
      } else {
        wx.showToast({ title: '原密码不正确' })
      }
    })
  },
  // 一次性加载所有数据
  async loadList() {
    const { limit = 5, total } = this.data
    let list = []
    let offset = 0
    if (total > 0) {
      const totalPage = Math.ceil(total / limit)
      for(let i = 0; i < totalPage; i++) {
        offset = i * limit

        const data = await this.fetchList({}, offset, limit)
        list = list.concat(data)
      }
      this.data.searchList = list
      console.log(list)
      return list
    }
    return []
  },
  // 加载云端数据
  fetchList(params, offset = 0, limit = 20) {
    return dbAccounts.get(params, offset, limit)
      .then(res => {
        const { code, data } = res
        if (code === 0) return data
        return []
      })
      .catch(() => [])
  },
  // 计算云端账号数量
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
  // 验证主密码
  confirmKey() {
    return app.$ready.then((res) => {
      const { _openid, sign } = res
      if (sign) {
        const { firstKey } = this.data
        const encrypted = AES.encrypt(_openid, firstKey)
        const hash = MD5(encrypted)
        if (hash === sign) {
          app.globalData.key = firstKey
          this.saveKeyToLocalStorage(firstKey)
          this.goBackPage()
          return true
        } else {
          wx.showToast({
            title: '主密码不正确',
            icon: 'none',
            mask: true,
          })
        }
      }
      return false
    })
  },
  onButtonTap() {
    const {  mode } = this.data
    const { firstKey, secondKey } = this.data
    if (!firstKey) {
      return wx.showToast({ title: '请输入主密码', icon: 'none' })
    }
    if (firstKey.length < 6) {
      return wx.showToast({ title: '主密码不应该少于6位', icon: 'none' })
    }

    if (mode === 'set') {
      this.setKey()
    } else if (mode === 'change') {
      if (!secondKey) {
        return wx.showToast({ title: '请输入新密码', icon: 'none'})
      }
      if (secondKey.length < 6) {
        return wx.showToast({ title: '新密码不应少于6位', icon: 'none' })
      }
      this.resetKey()
    } else if (mode === 'confirm') {
      this.confirmKey()
    }
  },
})