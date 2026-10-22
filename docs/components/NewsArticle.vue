<script setup>
// お知らせの記事ページ（/news/<id>）。本文はビルド時に API から取って HTML にしてある（検索エンジンにも読める）。
// ページを開いたあとで API を取り直し、管理画面で直した直後（再ビルド前）なら新しい内容に差し替える。
import { ref, computed, watch, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { apiBase, articleRenderer } from './blogApi.js'

const props = defineProps({
  // ビルド時に作った記事（docs/news/[id].paths.js の params）
  article: { type: Object, required: true }
})

const fresh = ref(null) // 管理画面で直した直後だけ入る新しい内容 { title, date, html }
const gone = ref(false) // 取り直したら削除されていた

const view = computed(() => ({ ...props.article, ...(fresh.value || {}) }))

const refresh = async () => {
  const id = props.article.id
  fresh.value = null
  gone.value = false
  try {
    const res = await fetch(`${apiBase()}/api/news/${id}`)
    if (id !== props.article.id) return
    if (res.status === 404) {
      gone.value = true
      return
    }
    if (!res.ok) return
    const data = await res.json()
    if (id !== props.article.id) return
    // ビルド時と同じなら何もしない（ビルド済みの HTML をそのまま使う）
    if ((data.updatedAt || '') === (props.article.updatedAt || '') && data.text === props.article.title) return
    const html = (await articleRenderer()).render(data.body || '')
    if (id !== props.article.id) return
    fresh.value = { title: data.text, date: data.date, updatedAt: data.updatedAt, html }
    document.title = `${data.text} | お知らせ | 建国鯖`
  } catch (e) {
    // 取り直せなくても、ビルド時の内容のまま読める
    console.warn('Failed to refresh news article:', e)
  }
}

onMounted(refresh)
// 記事から別の記事へ移ったときは、同じコンポーネントのまま article だけ入れ替わる
watch(() => props.article.id, refresh)
</script>

<template>
  <article v-if="!gone" class="news-article">
    <p class="news-date"><time :datetime="view.isoDate || undefined">{{ view.date }}</time></p>
    <h1>{{ view.title }}</h1>
    <div class="news-body" v-html="view.html"></div>
  </article>
  <div v-else class="status-message error">
    ⚠️ このお知らせは削除されました。
  </div>

  <p class="back-link">
    <a :href="withBase('/news')">← お知らせ一覧に戻る</a>
  </p>
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

.news-date {
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}
.news-article h1 {
  margin-top: 0;
}
.back-link {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
