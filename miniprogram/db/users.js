const db = wx.cloud.database()
const _ = db.command

// 只会获取一个
const getByOpenId = async (params = {}) => {
  try {
    const res = await db.collection('users').where(params).get()
    const { data } = res
    return { code: 0, data: data[0], message: '获取成功' }
  } catch(e) {
    return { code: -1, message: '获取失败', eMessage: e.message }
  }
}
// 获取用户列表
const get = async (params = {}, offset = 0, limit = 20) => {
  try {
    const res = await db.collection('users')
      .where(params)
      .skip(offset)
      .limit(limit)
      .get()
    const { data } = res
    return { code: 0, data, message: '获取成功' }
  } catch(e) {
    return { code: -1, message: '获取失败', eMessage: e.message }
  }
}

const add = async (data) => {
  try {
    const res = await db.collection('users').add({ data })
    return { code: 0, data: { _id: res._id }, message: '新增用户成功' }
  } catch(e) {
    return { code: -1, message: '新增失败' }
  }
}

const update = async (id, data = {}) => {
  try {
    const res = await db.collection('users')
      .doc(id)
      .update({
        data,
      })
    const { updated } = res.stats
    return { code: 0, data: { updated }, message: '更新成功' }
  } catch(e) {
    return { code: -1, message: '更新是吧', eMessage: e.message }
  }
}

export default { get, getByOpenId, add, update }