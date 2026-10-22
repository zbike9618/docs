// お知らせ一覧（/news・トップ）。ビルド時に API から取って HTML に焼く
// 本文は記事ページ（news/[id].paths.js）で使うので、一覧には載せない（hasBody だけ持つ）
import { fetchList } from './api.js'

export default {
  async load() {
    const items = await fetchList('/api/news')
    return items.map(({ body, ...rest }) => ({ ...rest, hasBody: Boolean(body) }))
  }
}
