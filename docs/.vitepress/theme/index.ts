import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import BugBadge from './BugBadge.vue'
import DocBanner from './DocBanner.vue'
import DocCommunity from './DocCommunity.vue'
import LivePopup from './LivePopup.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // ナビゲーションバーの右側にバッジを挿入
      'nav-bar-content-after': () => h(BugBadge),
      'doc-before': () => h(DocBanner),
      // 本文の下に Discord・YouTube への案内
      'doc-after': () => h(DocCommunity),
      // YouTube で配信中ならポップアップで案内（全ページ）
      'layout-bottom': () => h(LivePopup)
    })
  }
}
