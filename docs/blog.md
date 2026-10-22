---
title: ブログ
description: サポーターがサーバーの様子をお届けするブログです。
aside: false
---

# 📝 ブログ

<script setup>
import BlogList from './components/BlogList.vue'
</script>

サーバーの様子や出来事を、サポーターがお届けします。

<!-- 記事は管理画面（https://api.gozakura.org/admin/）の「ブログ」で書く。ビルド時に API から取って、記事ごとのページ（/blog/<id>）になる -->
<BlogList />
