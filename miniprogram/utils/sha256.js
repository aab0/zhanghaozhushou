const CryptoJS = require('../libs/crypto-js/index')

export default message => {
  return CryptoJS.SHA256(message).toString()
}