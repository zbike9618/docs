<script setup>
import { ref, onMounted } from 'vue'

const activeBugsCount = ref(0)
const loading = ref(true)

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/bugs`)
    if (res.ok) {
      const bugs = await res.json()
      // 修正済みと仕様以外のバグ（対応中など）をカウント
      activeBugsCount.value = bugs.filter(bug => 
        !bug.status.includes('修正済み') && !bug.status.includes('仕様')
      ).length
    }
  } catch (e) {
    console.error('Failed to fetch bugs for badge:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <a v-if="!loading && activeBugsCount > 0" href="/report/status" class="bug-badge">
    ⚠ 不具合情報 {{ activeBugsCount }}件
  </a>
</template>

<style scoped>
.bug-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 1rem;
  padding: 4px 12px;
  background-color: var(--vp-custom-block-danger-bg, rgba(255, 84, 84, 0.1));
  color: var(--vp-c-danger-1, #ff5454);
  border: 1px solid rgba(255, 84, 84, 0.3);
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.2s;
  height: 32px;
  line-height: 1;
}

.bug-badge:hover {
  background-color: var(--vp-c-danger-1, #ff5454);
  color: white;
  border-color: var(--vp-c-danger-1, #ff5454);
}
</style>
