import tags from './tags'
import { group} from '../../utils/array'

const groupedList = group(tags.map(tag => Object.assign({}, tag)))
groupedList.forEach(group => {
  while(group.length < 3) {
    group.push({})
  }
})

Page({
  data: {
    list: groupedList,
    currentCategory: '',
  },
  onLoad(options) {

  },
  onItemTap(e) {
    const { index, groupIndex } = e.currentTarget.dataset
    const { list } = this.data
    list.forEach((group) => {
      group.forEach(item => {
        item.active = false
      })
    })
    list[groupIndex][index].active = true
    this.setData({ list, currentCategory: list[groupIndex][index].name })
  },
  onButtonTap() {
    const { currentCategory } = this.data
    if (!currentCategory) {
      this.showToast({ title: '请选择分类', icon: 'none' })
    } else {
      const pages = getCurrentPages()
      const length = pages.length
      if (length > 1) {
        const page = pages[length - 2]
        page.setData({ category: currentCategory })
        wx.navigateBack()
      }
    }
  },
})