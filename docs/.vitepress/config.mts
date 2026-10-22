import { defineConfig, type HeadConfig } from 'vitepress'
import { BASE, SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../data/site.js'
import { fetchList } from '../data/api.js'

const basePathes = BASE

// トップページのタイトル（それ以外のページは「ページ名 | 建国鯖」）
const SITE_TITLE = '【マイクラ統合版】建国鯖 - 戦争・国家・経済システム搭載サーバー'

// 記事ページ（news/[id].md・blog/[id].md）の種類ごとの表示名と一覧ページ
const SECTIONS: Record<string, { label: string; path: string }> = {
  news: { label: 'お知らせ', path: '/news' },
  blog: { label: 'ブログ', path: '/blog' }
}

// 'news.md' → '/news'、'index.md' → '/'、'banlist/index.md' → '/banlist/'
const urlPathOf = (relativePath: string) =>
  '/' + relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')

// JSON-LD を <script> に入れるときに </script> で途切れないよう、< を逃がす
const jsonLd = (data: unknown): HeadConfig => [
  'script',
  { type: 'application/ld+json' },
  JSON.stringify(data).replace(/</g, '\\u003c')
]

export default defineConfig({
  lang: 'ja-JP',
  base: basePathes,

  // 🔥 【修正】統合版であることを強調しつつ、狙いたいワードを網羅
  title: SITE_TITLE,
  // 記事・各ページのタイトルは「ページ名 | 建国鯖」。長いサイトタイトルは検索結果で切れるのでトップだけにする
  titleTemplate: ':title | ' + SITE_NAME,

  // 🔥 【修正】「統合版 建国サーバー」として認識されやすい文章に調整
  description: "マインクラフト統合版の本格的な建国・戦争・経済システムを備えたマルチサーバー『建国鯖』公式サイト。国家戦争、外交交渉、領土管理、経済システムで遊ぶ24時間安定稼働サーバーです。",

  srcDir: '.',

  // /news.html ではなく /news を正規の URL にする（nginx が .html 付きを 301 で /news に寄せる）
  cleanUrls: true,

  sitemap: {
    hostname: SITE_URL,
    transformItems: async (items) => {
      // 記事ページには DB の更新日時を lastmod として付ける
      const lastmod = new Map<string, string>()
      try {
        for (const n of await fetchList('/api/news')) {
          if (n.body) lastmod.set(`news/${n.id}`, n.updatedAt || n.createdAt)
        }
        for (const p of await fetchList('/api/blog')) {
          lastmod.set(`blog/${p.id}`, p.updatedAt || p.createdAt)
        }
      } catch (e) {
        console.warn('[sitemap] lastmod を付けられませんでした:', (e as Error).message)
      }
      return items
        .map((item) => {
          const key = item.url.replace(/\.html$/, '')
          const at = lastmod.get(key)
          return at ? { ...item, url: key, lastmod: new Date(at).toISOString() } : { ...item, url: key }
        })
        // 404 と、検索に出さないページ（処罰履歴: プレイヤー名が載る。frontmatter の robots: noindex と対）は載せない
        .filter((item) => !/^(404|banlist(\/|$))/.test(item.url))
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: `${basePathes}yuku5_icon.jpg` }],
    ['link', { rel: 'apple-touch-icon', href: `${basePathes}yuku5_icon.jpg` }],

    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DotGothic16&family=Noto+Sans+JP:wght@400;700&display=swap' }],

    // 🔥 【修正】キーワードタグも統合版メインに絞り込み
    ['meta', { name: 'keywords', content: '建国鯖,建国サーバー,マインクラフト統合版,マイクラ戦争,国家システム,経済システム,CountryWars,マイクラ建国,マイクラ外交' }]

    // canonical・OGP（og:*）・robots・構造化データはページごとに違うので、下の transformHead で出す
  ],

  // 記事ページ（ビルド時に API から作る動的ルート）のタイトルと説明文を、記事の内容にする
  transformPageData(pageData) {
    const params = pageData.params
    const section = params?.kind && SECTIONS[params.kind]
    if (!section) return
    pageData.title = params.title
    pageData.description = params.description
    pageData.titleTemplate = `:title | ${section.label} | ${SITE_NAME}`
  },

  transformHead({ pageData, title, description }) {
    // GitHub Pages 用のビルド（base が /docs/）は別ドメインなので、正規 URL や OGP は付けない
    if (basePathes !== '/') return []
    if (pageData.isNotFound) return [['meta', { name: 'robots', content: 'noindex' }]]

    const path = urlPathOf(pageData.relativePath)
    const url = SITE_URL + path
    const params = pageData.params
    const section = params?.kind ? SECTIONS[params.kind] : undefined
    const isHome = path === '/'
    const ogTitle = isHome ? SITE_TITLE : pageData.title || title
    const image: string = params?.image || DEFAULT_OG_IMAGE

    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:site_name', content: SITE_NAME }],
      ['meta', { property: 'og:locale', content: 'ja_JP' }],
      ['meta', { property: 'og:type', content: section ? 'article' : 'website' }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: ogTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { name: 'twitter:card', content: params?.image ? 'summary_large_image' : 'summary' }]
    ]
    if (pageData.frontmatter.robots) {
      head.push(['meta', { name: 'robots', content: pageData.frontmatter.robots }])
    }

    // 構造化データ（検索結果でのパンくず・記事情報の表示に使われる）
    if (isHome) {
      head.push(jsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: ['CountryWars', 'マイクラ統合版 建国鯖'],
        url: SITE_URL + '/',
        inLanguage: 'ja'
      }))
    } else {
      const crumbs = [{ name: 'ホーム', url: SITE_URL + '/' }]
      if (section) crumbs.push({ name: section.label, url: SITE_URL + section.path })
      crumbs.push({ name: ogTitle, url })
      head.push(jsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url }))
      }))
    }

    if (section) {
      const published = params.createdAt || params.isoDate || undefined
      const modified = params.updatedAt || published
      if (published) head.push(['meta', { property: 'article:published_time', content: published }])
      if (modified) head.push(['meta', { property: 'article:modified_time', content: modified }])
      head.push(jsonLd({
        '@context': 'https://schema.org',
        '@type': params.kind === 'blog' ? 'BlogPosting' : 'Article',
        headline: params.title,
        description: params.description,
        datePublished: published,
        dateModified: modified,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        image: [image],
        author: params.kind === 'blog' && params.authorName
          ? { '@type': 'Person', name: params.authorName }
          : { '@type': 'Organization', name: SITE_NAME },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE }
        },
        inLanguage: 'ja'
      }))
    }
    return head
  },

  themeConfig: {
    // ...（以降の設定は変更なし）
    logo: '/yuku5_icon.jpg',
    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'お知らせ', link: '/news' },
      { text: 'ブログ', link: '/blog' },
      { text: 'アップデート', link: '/update' },
      { text: '投票', link: '/vote' },
      {
        text: 'ガイド',
        items: [
          { text: '遊び方ガイド', link: '/guide/start' },
          { text: 'ルール', link: '/guide/rules' }
        ]
      },
      {
        text: 'サーバー状況',
        items: [
          { text: '不具合情報', link: '/report/status' },
          { text: '処罰履歴', link: '/banlist/' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'discord', link: 'https://discord.gg/2Cx8Xm4ws6' },
      { icon: 'youtube', link: 'https://www.youtube.com/@Y-gozakura' }
    ]
  },
  vite: {
    server: {
      allowedHosts: ['www.gozakura.org']
    }
  }
})
