<script setup>
import { computed } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const section = computed(() => {
  const path = route.path

  if (path.startsWith('/guide/')) {
    return { label: 'PLAYER HANDBOOK', text: 'この世界で生き、国を育てるための公式ガイド' }
  }
  if (path.startsWith('/news')) {
    return { label: 'WORLD NEWS', text: '建国鯖からの重要なお知らせと最新情報' }
  }
  if (path.startsWith('/update')) {
    return { label: 'CHANGELOG', text: '世界に加わった新機能とバランス調整の記録' }
  }
  if (path.startsWith('/report/')) {
    return { label: 'SERVER INTELLIGENCE', text: '現在確認されている不具合と稼働情報' }
  }
  if (path.startsWith('/banlist/')) {
    return { label: 'PUBLIC RECORDS', text: '公平な世界を守るための運営記録' }
  }
  if (path.startsWith('/form')) {
    return { label: 'COMMUNITY', text: 'プレイヤーとともにつくる建国鯖' }
  }

  return { label: 'OFFICIAL DOCUMENT', text: '建国鯖 公式ドキュメント' }
})
</script>

<template>
  <div class="k-doc-banner">
    <span>{{ section.label }}</span>
    <p>{{ section.text }}</p>
  </div>
</template>
