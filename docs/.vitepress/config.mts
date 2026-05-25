import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'ja-JP', // 1. 検索エンジンに日本語サイトであることを正しく伝えます
  base: '/docs/', // リポジトリ名が docs の場合はこれ
  title: "建国鯖",
  description: "Minecraft建国サーバー「建国鯖」の公式ドキュメント・ガイドサイトです。ルールや遊び方をまとめています。", // 2. 検索結果の「説明文（ディスクリプション）」として表示されます

  // docsフォルダを基準として読み込むように変更（これで docs/public が正しく認識されます）
  srcDir: '.',

  // 3. サイトマップの自動生成設定（Google Search Console登録に必須）
  sitemap: {
    hostname: 'https://www.gozakura.org'
  },

  head: [
    // baseの設定に合わせて、パスの頭に /docs/ を追加！
    ['link', { rel: 'icon', type: 'image/jpeg', href: '/docs/yuku5_icon.jpg' }]
  ],

  themeConfig: {
    // ロゴのパスも /docs/ を基準にするために修正
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