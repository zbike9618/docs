// お知らせの記事ページ（/news/<id>）を、本文のあるお知らせ1件につき1ページ作る。
// 本文は管理画面で書いた Markdown。ビルド時に HTML にして焼くので、検索エンジンにもそのまま読める。
import { fetchList, publicApiBase } from '../data/api.js'
import { createMarkdown } from '../shared/markdown.js'
import { summarize, safeText, slashDateToIso } from '../data/text.js'
import { BASE } from '../data/site.js'

export default {
  async paths() {
    const items = await fetchList('/api/news')
    const md = createMarkdown({ base: BASE, apiBase: publicApiBase() })
    return items
      .filter((n) => n.body)
      .map((n) => {
        // 本文は html:false で変換済み。ページのデータに入る文字は safeText で山括弧を全角にする（data/text.js）
        const html = md.render(n.body)
        return {
          params: {
            id: String(n.id),
            kind: 'news',
            title: safeText(n.text),
            date: safeText(n.date),
            isoDate: slashDateToIso(n.date),
            createdAt: n.createdAt || null,
            updatedAt: n.updatedAt || null,
            tags: (n.tags || []).map(safeText),
            html,
            description: summarize(html)
          }
        }
      })
  }
}
