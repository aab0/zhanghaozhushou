const db = wx.cloud.database()
const _ = db.command
const $ = db.command.aggregate

export const get = async (params, offset = 0, limit = 20) => {
  try {
    const res = await db.collection('applies')
      .where(params)
      .skip(offset)
      .limit(limit)
      .get()
    const { data } = res
    return { code: 0, data, message: '获取成功'}
  } catch(e) {
    return { code: -1, message: '获取失败' }
  }
}

export const remove = async (id) => {
  try {
    const res = db.collection('applies').doc(id).remove()
    const { removed } = res.stats
    return { code: 0, data: { removed }, message: '' }
  } catch(e) {
    return { code: -1, message: '删除失败', eMessage: e.message }
  }
}