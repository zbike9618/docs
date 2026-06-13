import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import BugBadge from './BugBadge.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // ナビゲーションバーの右側にバッジを挿入
      'nav-bar-content-after': () => h(BugBadge)
    })
  }
}
