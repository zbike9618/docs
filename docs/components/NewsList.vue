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

// 本文があるお知らせは記事ページ（news/view.md）へ。無ければ管理画面で入れたリンク先へ
const pageOf = (item) => (item.body ? `/news/view?id=${item.id}` : item.link)
</script>

<template>
  <div v-if="loading" class="status-message loading">
    ⏳ お知らせを読み込んでいます...
  </div>
  <div v-else-if="error" class="status-message error">
    ⚠️ お知らせの取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <div v-else-if="displayNews.length === 0" class="status-message empty">
    現在、新しいお知らせはありません。
  </div>
  <ul v-else class="news-list">
    <li v-for="(item, index) in displayNews" :key="index" :class="{ 'has-link': pageOf(item) }">
      <time>{{ item.date }}</time>
      <a v-if="pageOf(item)" class="news-content" :href="withBase(pageOf(item))">
        <span class="news-text">{{ item.text }}</span>
        <span class="news-action">詳細を見る <i aria-hidden="true">→</i></span>
      </a>
      <div v-else class="news-content news-content-static">
        <span class="news-text">{{ item.text }}</span>
        <span class="news-state">本文のみ</span>
      </div>
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
.empty {
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.news-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.news-list li {
  position: relative;
  display: grid;
  grid-template-columns: 106px minmax(0, 1fr);
  align-items: center;
  gap: 20px;
  min-height: 72px;
  padding: 10px 0;
  margin: 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.news-list li:last-child { border-bottom: 0; }
.news-list time {
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: .04em;
  white-space: nowrap;
}
.news-content {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
}
a.news-content {
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
}
a.news-content:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 34%, transparent);
  background: color-mix(in srgb, var(--vp-c-brand-1) 7%, transparent);
  transform: translateX(3px);
}
.news-text {
  min-width: 0;
  color: var(--vp-c-text-1);
  line-height: 1.65;
}
.news-action,
.news-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}
.news-action {
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent);
}
.news-action i { margin-left: 6px; font-style: normal; transition: transform .2s ease; }
a.news-content:hover .news-action i { transform: translateX(3px); }
.news-state {
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
}

@media (max-width: 640px) {
  .news-list li {
    grid-template-columns: 1fr;
    gap: 3px;
    padding: 14px 0;
  }
  .news-list time { padding-left: 2px; }
  .news-content { gap: 10px; padding: 10px 2px; }
  a.news-content:hover { transform: none; }
  .news-action,
  .news-state { min-width: auto; padding: 5px 8px; }
}
</style>
