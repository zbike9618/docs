// ブログの記事ページ（/blog/<id>）を、公開中の記事1件につき1ページ作る。
// 本文は管理画面で書いた Markdown。ビルド時に HTML にして焼くので、検索エンジンにもそのまま読める。
import { fetchList, fetchJson, publicApiBase } from '../data/api.js'
import { createMarkdown } from '../shared/markdown.js'
import { summarize, safeText } from '../data/text.js'
import { BASE } from '../data/site.js'

export default {
  async paths() {
    const list = await fetchList('/api/blog')
    const apiBase = publicApiBase()
    const md = createMarkdown({ base: BASE, apiBase })
    // 一覧には本文が無いので、記事ごとに取る
    return Promise.all(
      list.map(async (item) => {
        const post = await fetchJson(`/api/blog/${item.id}`)
        // 本文は html:false で変換済み。ページのデータに入る文字は safeText で山括弧を全角にする（data/text.js）
        const html = md.render(post.body || '')
        const thumb = post.thumbnail || ''
        return {
          params: {
            id: String(post.id),
            kind: 'blog',
            title: safeText(post.title),
            authorName: safeText(post.authorName),
            source: post.source,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            reactions: post.reactions || [],
            image: thumb ? safeText(thumb.startsWith('/uploads/') ? apiBase + thumb : thumb) : null,
            html,
            description: summarize(html)
          }
        }
      })
    )
  }
}
