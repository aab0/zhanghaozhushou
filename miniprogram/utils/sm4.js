const sm4 = require('../libs/sm-crypto/index')

export default {
  encrypt(data, key) {
    if (!data || !key) return ''
    return sm4.encrypt(data, key)
  },
  decrypt(data, key) {
    if (!data || !key) return ''
    return sm4.decrypt(data, key)
  },
}