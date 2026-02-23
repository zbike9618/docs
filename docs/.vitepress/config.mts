// .vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/docs/', // リポジトリ名が docs の場合はこれ
  title: "CountryWars Official",
  srcDir: '.',
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: 'お知らせ', link: '/news' },
      { text: '遊び方ガイド', link: '/guide/start' },
      { text: '不具合情報', link: '/report/status' }
    ],
    socialLinks: [
      { icon: 'discord', link: 'https://discord.gg/2Cx8Xm4ws6' }
    ]
  }
})