export const categories =  [
  {
    name: '默认',
    icon: '/images/icon_default.png',
  },
  {
    name: 'QQ',
    icon: '/images/icon_qq.png',
  },
  {
    name: '微信',
    icon: '/images/icon_wechat.png',
  },
  {
    name: '邮箱',
    icon: '/images/icon_mail.png',
  },
  {
    name: '公众号',
    icon: '/images/icon_gongzhonghao.png',
  },
  {
    name: 'OA',
    icon: '/images/icon_oa.png',
  },
  {
    name: 'APP',
    icon: '/images/icon_apps.png',
  },
  {
    name: '网站',
    icon: '/images/icon_web.png',
  },
  {
    name: '证件',
    icon: '/images/icon_id.png'
  },
  {
    name: '银行卡',
    icon: '/images/icon_bank_card.png',
  },
  {
    name: '其他',
    icon: '/images/icon_other.png',
  }
]

const iconMap = {}
categories.forEach(item => {
  iconMap[item.name] = item.icon
})

export const categoriesIconMap = iconMap

export const categoriesName = categories.map(item => item.name)

export const defaultIcon = '/images/icon_default.png'