import SM4 from './sm4'
import AES from './aes'

const utf8ToArray = (str) => {
  const arr = []
  for (let i = 0, len = str.length; i < len; i++) {
    const point = str.charCodeAt(i)

    if (point <= 0x007f) {
      arr.push(point)
    } else if (point <= 0x07ff) {
      arr.push(0xc0 | (point >>> 6))
      arr.push(0x80 | (point & 0x3f))
    } else {
      arr.push(0xe0 | (point >>> 12))
      arr.push(0x80 | ((point >>> 6) & 0x3f))
      arr.push(0x80 | (point & 0x3f))
    }
  }
  return arr
}

const formatKey = (key) => {
  if (typeof key !== 'string' || !key) {
    throw new Error('key is invalid')
  }
  return utf8ToArray(key.repeat(3).slice(0, 16)) // 取16位key
}

/* data 需要加密的数据
 * key 密钥
 * type 加密类型 AES/SM4
*/
const encrypt = (data, key, type = 'SM4') => {
  if (type === 'SM4') {
    return SM4.encrypt(data, formatKey(key))
  }
  if (type === 'AES') {
    return AES.encrypt(data, key)
  }
}

/* data需要加密的数据
 * key 密钥
 * type 加密类型 AES/SM4
*/
const decrypt = (data, key, type = 'SM4') => {
  if (type === 'SM4') {
    return SM4.decrypt(data, formatKey(key))
  }
  if (type === 'AES') {
    return AES.decrypt(data, key)
  }
}

export default {
  encrypt,
  decrypt,
}
