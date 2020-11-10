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
init()

const db = wx.cloud.database()
const _ = db.command
const $ = db.command.aggregate

const get = async (params = {}, offset = 0, limit = 20) => {
  try {
    const res = await db.collection('accounts')
    .where(params)
    .skip(offset)
    .limit(limit)
    .get()
    return { code: 0, data: res.data, message: '获取成功'}
  } catch(e) {
    return { code: -1, message: '获取失败' }
  }
}

const getGroupByCategory = async (params = {}) => {
  try {
    const res = await db.collection('accounts').aggregate()
      .group({
        _id: '$category',
        total: { $sum: 1 },
      })
      .end()
    const { list = [] } = res
    return { code: 0, data: list, message: '获取成功' }
  } catch(e) {
    return { code: -1, message: '获取成功', eMessage: e.message }
  }
}

const count = async (params = {}) => {
  try {
    const res = await db.collection('accounts').where(params).count()
    return { code: 0, data: { total: res.total }, message: ''}
  } catch(e) {
    return { code: -1, message: '获取失败' }
  }
}

const add = async (data) => {
  try {
    const res = await db.collection('accounts').add({ data })
    return { code: 0, data: res, message: '保存成功'}
  } catch(e) {
    return { code: -1, message: '新增失败' }
  }
}

const remove = async id => {
  try {
    const res = await db.collection('accounts').doc(id).remove()
    return { code: 0, data: { removed: res.stats.removed}, message: '删除成功' }
  } catch(e) {
    return { code: -1, message: '删除失败' }
  }
}

const update = async (id, data = {}) => {
  try {
    const res = await db.collection('accounts')
    .doc(id)
    .update({ data })
    return { code: 0, data: { update: res.stats.updated }, message: '更新成功' }
  } catch(e) {
    return { code: -1, message: '更新失败' }
  }
}

export default {
  get, getGroupByCategory, add, remove, count, update,
}