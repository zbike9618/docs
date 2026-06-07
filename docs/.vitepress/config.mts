import { defineConfig } from 'vitepress'

const globalEnv = (globalThis as any).process?.env || {}
const basePathes = globalEnv.GITHUB_ACTIONS && !globalEnv.LXC_DEPLOY ?
'/docs/' : '/'

export default defineConfig({
  lang: 'ja-JP',
  base: basePathes,
  
  // 🔥 【修正】統合版であることを強調しつつ、狙いたいワードを網羅
  title: "【マイクラ統合版】建国鯖 / 建国サーバー 公式サイト",
  
  // 🔥 【修正】「統合版 建国サーバー」として認識されやすい文章に調整
  description: "マインクラフト統合版（Switch/スマホ/PS/Xbox等）専用の建国サーバー「建国鯖」公式ドキュメントサイトです。ルールや参加方法、遊び方をまとめています。",

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
    
    // 🔥 【修正】キーワードタグも統合版メインに絞り込み
    ['meta', { name: 'keywords', content: '建国鯖,建国サーバー,建国サーバー 統合版,マイクラ 建国鯖' }],

    // 🔥 【修正】OGP（SNS用）も統合版専用に統一
    ['meta', { property: 'og:title', content: '【マイクラ統合版】建国鯖 / 建国サーバー 公式ドキュメント' }],
    ['meta', { property: 'og:description', content: 'マインクラフト統合版専用の建国サーバー「建国鯖」公式ガイドです。Switchやスマホから今すぐ参加！' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://www.gozakura.org/yuku5_icon.jpg' }]
  ],

  themeConfig: {
    // ...（以降の設定は変更なし）
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