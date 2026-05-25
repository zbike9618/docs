import { defineConfig } from 'vitepress'

// TypeScriptの型チェックに引っかからないように、globalThisから安全にenvを取得するよ
const globalEnv = (globalThis as any).process?.env || {}
const basePathes = globalEnv.GITHUB_ACTIONS && !globalEnv.LXC_DEPLOY ? '/docs/' : '/'

export default defineConfig({
  lang: 'ja-JP',
  base: basePathes, 
  title: "建国鯖",
  description: "Minecraft建国サーバー「建国鯖」の公式ドキュメント・ガイドサイトです。ルールや遊び方をまとめています。",

  srcDir: '.',

  sitemap: {
    hostname: 'https://www.gozakura.org'
  },

  head: [
    ['link', { rel: 'icon', type: 'image/jpeg', href: 'yuku5_icon.jpg' }]
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
      { icon: 'discord', link: 'https://discord.gg/2Cx8Xm4ws6' }
    ]
  },
  vite: {
    server: {
      allowedHosts: ['www.gozakura.org']
    }
  }
})