const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

function getOpenId() {
  const wxContext = cloud.getWXContext()
  return wxContext.OPENID // 创建者ID
}

const isAdminRole = async () => {
  const openId = getOpenId()
  try {
    const res = await db.collection('users')
      .where({ _openid: openId })
      .get()
    const { data } = res
    if (data) {
      const user = data[0]
      return user && user.role === 'admin'
    }
    return false
  } catch(e) {
    return false
  }
}

const update = async (event) => {
  try {
    const isAdmin = await isAdminRole()
    if (!isAdmin) return { code: 401, message: '无权限' }
    if (event.role === 'admin') return { code: -1, message: '无操作权限' }

    const { role, applyStatus, id } = event
    const data = {}
    if (role) {
      data.role = role
      roleUpdateAt = Date.now()
    }
    if (applyStatus !== undefined) {
      data.applyStatus = applyStatus
      data.applyStatusUpdateAt = Date.now()
    }

    const res = await db.collection('users')
      .doc(id)
      .update({
        data,
      })
    const { updated } = res.stats
    return { code: 0, data: { updated }, message: '更新成功' }
  } catch(e) {
    return { code: -1, message: '更新失败', eMessage: e.message }
  }
}

// 只有管理员才可以调用本接口
const get = async (event) => {
  try {
    const isAdmin = await isAdminRole()
    if (!isAdmin) return { code: 401, message: '无权限' }
    const { page = 1, pageSize = 100, keyword,
      applyStatus, role,
      orderKey = 'createdAt',
      orderBy = 'desc',
    } = event
    const offset = (page - 1) * pageSize

    const params = {}
    if (keyword) {
      params.nickName = db.RegExp({ regexp: keyword, options: 'i' })
    }
    if (applyStatus !== undefined) {
      params.applyStatus = applyStatus
    }
    if (role) {
      params.role = role
    }
    const res = await db.collection('users')
      .where(params)
      .orderBy(orderKey, orderBy)
      .skip(offset)
      .limit(pageSize)
      .get()
    const { data } = res

    return { code: 0, data, message: '请求成功' }
  } catch(e) {
    return { code: -1, message: '请求失败', eMessage: e.message }
  }
}

const count = async event => {
  try {
    const isAdmin = await isAdminRole()
    if (!isAdmin) return { code: 401, message: '无权限' }
    const { keyword, applyStatus, role } = event

    const params = {}
    if (keyword) {
      params.nickName = db.RegExp({ regexp: keyword, options: 'i' })
    }
    if (applyStatus !== undefined) {
      params.applyStatus = applyStatus
    }
    if (role) {
      params.role = role
    }
    const res = await db.collection('users')
      .where(params)
      .count()
    const { total } = res

    return { code: 0, data: { total }, message: '请求成功' }
  } catch(e) {
    return { code: -1, message: '请求失败', eMessage: e.message }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { method } = event
  if (method === 'update') return await update(event, context)
  if (method === 'get') return await get(event, context)
  if (method === 'count') return await count(event, context)
  return { code: -1, message: '方法不存在' }
}