import { env } from '../env.js'

function init() {
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    return false
  } else {
    wx.cloud.init({ env, traceUser: true })
    return true
  }
}

export default init()