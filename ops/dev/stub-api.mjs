// ローカル確認用の API の偽物。本物の API に繋がずに、サイトのビルドを試せる。
//   node ops/dev/stub-api.mjs            （既定のポートは 3999）
//   BUILD_API_URL=http://127.0.0.1:3999 npm run docs:build
// 管理画面で書いた文字が悪さをしても、ビルドが壊れたり、スクリプトが動いたりしないことの確認用に、
// わざと危ない内容（</script>、生の HTML、javascript: のリンクなど）も入れてある。
import http from 'node:http'

const port = Number(process.env.PORT) || 3999
const t = (day) => `2026-10-${day}T09:00:00.000Z`

const evilBody = [
  '本文のはじまり。安全に表示されるはず。',
  '',
  '## 見出し',
  '- 箇条書き **太字**',
  '- [ルール](/guide/rules) / [外部](https://example.com)',
  '',
  '<script>alert(1)</script> {{ 1+1 }} <img src=x onerror=alert(2)>',
  '',
  '[危ないリンク](javascript:alert(3))',
  '',
  '![画像](/uploads/blog/abc.png)'
].join('\n')

const news = [
  { id: 3, date: '2026/10/22', text: '</script><b>悪いタイトル</b>', link: null, body: evilBody, tags: ['運営', '知らないタグ</script>'], createdAt: t('22'), updatedAt: t('22') },
  { id: 2, date: '2026/10/20', text: 'リンクだけのお知らせ（旧形式）', link: '/news/view?id=3', body: null, tags: [], createdAt: t('20'), updatedAt: t('20') },
  { id: 1, date: '2026/10/01', text: '普通のお知らせ', link: null, body: '## 見出し\n- a\n- b', tags: ['アップデート'], createdAt: null, updatedAt: t('01') }
]

const blogPost = {
  id: 7, title: '</script>ブログのタイトル', authorName: '<b>書いた人</b>', source: 'admin',
  thumbnail: 'https://example.com/a.png?x=</script>', visible: true, createdAt: t('21'), updatedAt: t('21'),
  reactions: [{ emoji: '👍', count: 1 }], reactionTotal: 1
}
const blogList = [{ ...blogPost, excerpt: '抜粋のテスト' }]
const blogFull = { ...blogPost, body: evilBody, myReactions: [] }

const updates = [{ id: 1, date: '2026/10/21', title: '更新のテスト', body: '- 変更点1\n- 変更点2', link: null }]
const bugs = [{ id: 1, date: '2026/10/21', issue: '不具合のテスト', category: 'その他', status: '🟠 対応中', note: '' }]

const routes = {
  '/api/news': news,
  '/api/news/3': news[0],
  '/api/blog': blogList,
  '/api/blog/7': blogFull,
  '/api/updates': updates,
  '/api/bugs': bugs
}

http.createServer((req, res) => {
  const body = routes[new URL(req.url, 'http://x').pathname]
  res.writeHead(body ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body ?? { error: 'not found' }))
}).listen(port, '127.0.0.1', () => console.log(`stub API: http://127.0.0.1:${port}`))
