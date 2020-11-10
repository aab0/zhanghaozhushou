import dbUsers from '../../db/users'
import dbAccounts from '../../db/accounts'
import SHA256 from '../../utils/sha256'
import Crypto from '../../utils/crypto'

const app = getApp()

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },
  properties: {
    type: {
      type: String,
    },
    show: {
      type: Boolean,
      value: false,
    },
    callback: {
      type: String,
      value: '',
    },
  },
  data: {
    title: '设置主密码',
    firstKeyTitle: '主密码',
    firstKeyPlaceholder: '请输入主密码',
    secondKeyTitle: '新密码',
    secondKeyPlaceholder: '请输入新密码',
    firstKey: '',
    hide: true,
    secondKeyHide: true,
    saveType: '否',
    range: ['是', '否'],
  },
  observers: {
    show(v) {
      const { inited } = this.data
      if (inited && v) { // 弹出时先校验
        this.setType()
      }
    },
  },
  lifetimes: {
    attached() {
      this.setData({ inited: true })
    },
  },
  methods: {
    setType() {
      app.$ready.then(res => {
        const { sign } = res
        if (sign) { // 已经设置过主密码，需要进入校验主密码逻辑
          const { type } = this.data
          if (type === 'change') { // 修改主密码
            this.setData({ type: 'change', title: '修改主密码' })
          } else {
            this.setData({ type: 'confirm', title: '校验主密码' })
          }
        } else { // 从未设置过主密码
          this.setData({ type: 'set', title: '设置主密码' }) // 先设置主密码
        }
        this.setData({ inited: true })
      })
      .catch((e) => {
        wx.showToast({ title: '数据初始化错误, 请稍后再试', icon: 'none' })
        this.setData({ show: false, inited: true })
      })
    },
    onConfirm() {
      const { type } = this.data
      if (type === 'set') {
        this.setKey()
      } else if (type === 'confirm') {
        this.confirmKey()
      } else if (type === 'change') {
        this.changeKey()
      }
    },
    onCancel() {
      this.setData({ show: false })
      this.triggerEvent('cancel', { pass: false })
    },
    onTypeChange(type) {
      if (type === 'set') {
        this.setData({ title: '设置主密码' })
      } else if (type === 'change') {
        this.setData({ title: '修改主密码' })
      } else if (type === confirm) {
        this.setData({ title: '校验主密码' })
      }
    },
    onSaveTypeChange(e) {
      const { range } = this.data
      const { value } = e.detail
      this.setData({ saveType: range[value] })
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
    // 保存主密钥到本地
    saveKeyToLocalStorage(key) {
      const { saveType } = this.data
      if (saveType === '是') {
        wx.setStorage({
          data: key,
          key: 'key',
        })
      } else {
        wx.removeStorage({
          key: 'key',
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
      console.log('set')
      return app.$ready.then((res) => {
        const {_id, sign, role } = res
        console.log(role, sign)
        if (sign) return // 已经设置过主密码
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
                    const { callback } = this.data
                    this.triggerEvent('confirm', { pass: true, callback })
                  }
                  this.setData({ show: false })
                })
                .catch(() => {
                  wx.hideLoading()
                  wx.showToast({ title: '主密码设置失败' })
                })
            }
          },
        })
      })
    },
    // 本地重设加密数据
    resetEncryptList(oldKey, newKey, list) {
      const res = []
      list.forEach(item => {
        const { _id, account, password, remark, type } = item
        const d = { id: _id }
        if (account) {
          d.account = Crypto.encrypt(Crypto.decrypt(account, oldKey, type), newKey, type)
        }
        if (password) {
          d.password = Crypto.encrypt(Crypto.decrypt(password, oldKey, type), newKey, type)
        }
        if (remark) {
          d.remark = Crypto.encrypt(Crypto.decrypt(remark, oldKey, type), newKey, type)
        }
        res.push(d)
      })
      return res
    },
    // 更新云端数据
    async updateListForResetKey(list) {
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
    // 更新sign
    updateSignForKeyChange(key) {
      return app.$ready.then((res) => {
        const {_id } = res
        const hash = SHA256(key)
        return dbUsers.update(_id, { sign: hash })
          .then(res => {
            wx.hideLoading()
            const { code } = res
            if (code === 0) {
              return code
            }
            return Promise.reject('key')
          })
      })
    },
    // 修改主密码
    changeKey() {
      return app.$ready.then(res => {
        const { sign } = res
        const { firstKey, secondKey } = this.data
        if (this.validKey(firstKey, sign)) { // 校验原密码是否正确
          wx.showLoading({ title: '数据准备中...', mask: true })
          this.countList({})
            .then(() => {
              this.loadList()
                .then((list) => {
                  wx.hideLoading()
                  const newList = this.resetEncryptList(firstKey, secondKey, list)
                  wx.showModal({
                    title: '重要提示',
                    content: '数据开始保存后，请勿终中断操作，否则可能丢失数据!',
                    success: ({ confirm }) => {
                      if (confirm) {
                        wx.showLoading({ title: '数据保存中...', mask: true })
                        const listPromise = this.updateListForResetKey(newList)
                        const keyPromise = this.updateSignForKeyChange(secondKey)
                        Promise.all([listPromise, keyPromise])
                          .then((res) => {
                            wx.showToast({ title: '主密码修改成功' })
                            app.$ready = app.appReady() // 重置
                            app.globalData.key = secondKey
                            this.setData({ show: false }) // 收起弹窗
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
      const { limit = 20, total = 0 } = this.data
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
        const { sign } = res
        if (sign) {
          const { firstKey } = this.data
          const hash = SHA256(firstKey)
          if (hash === sign) {
            const { callback } = this.data
            this.setData({ show: false })
            app.globalData.key = firstKey
            this.triggerEvent('confirm', { pass: true, callback })
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
  }
})
