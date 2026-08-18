import { defineConfig } from 'vitepress'

const globalEnv = (globalThis as any).process?.env || {}
const basePathes = globalEnv.GITHUB_ACTIONS && !globalEnv.LXC_DEPLOY ?
'/docs/' : '/'

export default defineConfig({
  lang: 'ja-JP',
  base: basePathes,
  
  // 🔥 【修正】統合版であることを強調しつつ、狙いたいワードを網羅
  title: "【マイクラ統合版】建国鯖 - 戦争・国家・経済システム搭載サーバー",
  
  // 🔥 【修正】「統合版 建国サーバー」として認識されやすい文章に調整
  description: "マインクラフト統合版の本格的な建国・戦争・経済システムを備えたマルチサーバー『建国鯖』公式サイト。国家戦争、外交交渉、領土管理、経済システムで遊ぶ24時間安定稼働サーバーです。",

  srcDir: '.',

  sitemap: {
    hostname: 'https://www.gozakura.org'
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: `${basePathes}yuku5_icon.jpg` }],
    ['link', { rel: 'apple-touch-icon', href: `${basePathes}yuku5_icon.jpg` }],
    
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DotGothic16&family=Noto+Sans+JP:wght@400;700&display=swap' }],

    ['meta', { name: 'robots', content: 'index, follow' }],
    
    // 🔥 【修正】キーワードタグも統合版メインに絞り込み
    ['meta', { name: 'keywords', content: '建国鯖,建国サーバー,マインクラフト統合版,マイクラ戦争,国家システム,経済システム,CountryWars,マイクラ建国,マイクラ外交' }],

    // 🔥 【修正】OGP（SNS用）も統合版専用に統一
    ['meta', { property: 'og:title', content: '【マイクラ統合版】建国鯖 - 戦争・国家・経済システム搭載' }],
    ['meta', { property: 'og:description', content: '本格的な戦争システムと国家経済を備えたマイクラ統合版サーバー「建国鯖」。外交交渉で勝つ、領土を守る、経済を発展させる。Switchやスマホから参加可能！' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://www.gozakura.org/yuku5_icon.jpg' }]
  ],

  themeConfig: {
    // ...（以降の設定は変更なし）
    logo: '/yuku5_icon.jpg',
    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'お知らせ', link: '/news' },
      { text: 'アップデート', link: '/update' },
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
