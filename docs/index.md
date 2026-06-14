---
layout: home

hero:
  name: "建国鯖"
  tagline: 統合版マインクラフト専用<br>24時間稼働の建国戦争サーバー<br>運営：ゆっくり伍桜(YouTube)
  image:
    src: /yuku5_icon.jpg
    alt: 建国鯖ロゴ
  actions:
    - theme: brand
      text: サーバーに参加する
      link: /guide/start
    - theme: alt
      text: バグ報告を行う
      link: /report/status
    - theme: alt
      text: コマンド一覧
      link: /guide/commands

features:
  - title: 🚩 本格的な建国システム
    details: CountryWarsアドオンにより、領土の保護や国民管理が可能です。 
  - title: ⚔️ 戦略的な戦争
    details: 宣戦布告、同盟、そして略奪。外交が勝利の鍵を握ります。
  - title: 📈 24時間安定稼働
    details: Ubuntu/Proxmox環境で、ラグの少ない快適な環境を提供します。
---


<script setup>
import ServerStatus from './components/ServerStatus.vue'
import NewsList from './components/NewsList.vue'
import EventBanner from './components/EventBanner.vue'
</script>

::: warning サイト移行のお知らせ
このサイトは移行されました。
最新のサイトはこちら(https://www.gozakura.org)
:::

<ServerStatus />

<EventBanner />

::: info 🎮 このサーバーについて
当サイトは、**マインクラフト統合版（Bedrock Edition）専用**のマルチサーバー**「建国鯖（建国サーバー）」**の公式ドキュメントサイトです。  
Nintendo Switch、スマートフォン、PlayStation、Xbox、PC（統合版）など、あらゆる統合版環境から24時間いつでも無料で参加可能です。
:::
## 📢 最新のお知らせ

<NewsList :limit="3" />

👉 [これまでのお知らせ一覧を見る](/news)