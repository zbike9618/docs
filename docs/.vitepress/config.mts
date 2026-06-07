import { defineConfig } from 'vitepress'

const globalEnv = (globalThis as any).process?.env || {}
const basePathes = globalEnv.GITHUB_ACTIONS && !globalEnv.LXC_DEPLOY ?
'/docs/' : '/'

export default defineConfig({
  lang: 'ja-JP',
  base: basePathes,
  
  // 🔥 【改善】狙いたいキーワードをギュッと凝縮し、区切りに「｜」や「/」を使う
  title: "【マイクラ】建国鯖 / 建国サーバー 公式サイト",
  
  // 🔥 【改善】「統合版」や「マイクラ 建国鯖」が自然に繋がる文章に変更
  description: "人気のマイクラ建国サーバー（建国鯖）の公式ドキュメントサイトです。統合版（Switch/スマホ等）とJava版どちらの参加方法も網羅。ルールや遊び方をまとめています。",

  srcDir: '.',

  sitemap: {
    hostname: 'https://www.gozakura.org'
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/yuku5_icon.jpg' }],
    ['link', { rel: 'apple-touch-icon', href: '/yuku5_icon.jpg' }],
    
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DotGothic16&family=Noto+Sans+JP:wght@400;700&display=swap' }],

    ['meta', { name: 'robots', content: 'index, follow' }],
    
    // ⬇️ 追加：SEOをさらに盤石にするためのキーワードタグ（念のため）
    ['meta', { name: 'keywords', content: '建国鯖,建国サーバー,建国サーバー 統合版,マイクラ 建国鯖' }],

    // 🔥 【改善】SNSでシェアされた時も検索キーワードが引っかかりやすいように統一
    ['meta', { property: 'og:title', content: '【マイクラ】建国鯖 / 建国サーバー 公式ドキュメント' }],
    ['meta', { property: 'og:description', content: 'Minecraft建国サーバー「建国鯖」の公式ガイドです。統合版・Java版対応！' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://www.gozakura.org/yuku5_icon.jpg' }]
  ],

  themeConfig: {
    logo: '/yuku5_icon.jpg',
    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'お知らせ', link: '/news' },
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