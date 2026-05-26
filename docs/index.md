---
layout: home

hero:
  name: "建国鯖"
  text: ""
  tagline: 統合版マイクラ専用・24時間稼働の建国戦争サーバー
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

<ServerStatus />

<EventBanner />

## 📢 最新のお知らせ

<NewsList :limit="3" />

👉 [これまでのお知らせ一覧を見る](/news)


## テストコミット