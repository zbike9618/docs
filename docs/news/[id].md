---
aside: false
---

<script setup>
import { useData } from 'vitepress'
import NewsArticle from '../components/NewsArticle.vue'

const { params } = useData()
</script>

<!-- 本文は管理画面（https://api.gozakura.org/admin/）の「お知らせ」で書く。ビルド時に API から取って、記事ごとのページ（/news/<id>）になる -->
<!-- タイトル・説明文・構造化データは .vitepress/config.mts の transformPageData / transformHead で付ける -->
<NewsArticle :article="params" />
