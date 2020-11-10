const CryptoJS = require('../libs/crypto-js/index')

export default message => {
  return CryptoJS.MD5(message).toString()
}