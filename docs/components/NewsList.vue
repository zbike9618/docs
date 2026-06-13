<script setup>
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  limit: {
    type: Number,
    default: 0
  }
})

const newsData = ref([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/news`)
    if (res.ok) {
      newsData.value = await res.json()
    } else {
      error.value = true
    }
  } catch (e) {
    console.error('Failed to fetch news:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

const displayNews = computed(() => {
  return props.limit > 0 ? newsData.value.slice(0, props.limit) : newsData.value
})
</script>

<template>
  <div v-if="loading" class="status-message loading">
    ⏳ お知らせを読み込んでいます...
  </div>
  <div v-else-if="error" class="status-message error">
    ⚠️ お知らせの取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <ul v-else class="news-list">
    <li v-for="(item, index) in displayNews" :key="index">
      <strong>{{ item.date }}:</strong>
      <a v-if="item.link" :href="withBase(item.link)">{{ item.text }}</a>
      <span v-else>{{ item.text }}</span>
    </li>
  </ul>
</template>

<style scoped>
.status-message {
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 8px;
  font-weight: bold;
}
.loading {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  animation: pulse 1.5s infinite;
}
.error {
  background-color: var(--vp-custom-block-danger-bg, rgba(255, 84, 84, 0.1));
  color: var(--vp-c-danger-1, #ff5454);
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.news-list {
  list-style-type: none;
  padding-left: 0;
  margin-top: 1rem;
}
.news-list li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
.news-list li::before {
  content: "-";
  position: absolute;
  left: 0;
  color: var(--vp-c-text-1);
}
</style>
