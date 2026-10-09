<script setup>
// ブログの記事ページ（/blog/view?id=<id>）。本文は管理画面で書いた Markdown を API から取ってきて表示する
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, withBase } from 'vitepress'
import { apiBase, blogRenderer, SOURCE_LABELS } from './blogApi.js'
import { formatDateTime } from './relativeTime.js'

const post = ref(null)
const html = ref('')
const state = ref('loading') // loading | ok | notfound | error

const load = async () => {
  const id = new URLSearchParams(location.search).get('id')
  if (!/^\d+$/.test(id || '')) {
    state.value = 'notfound'
    return
  }
  state.value = 'loading'
  try {
    const res = await fetch(`${apiBase()}/api/blog/${id}`)
    if (res.status === 404) {
      state.value = 'notfound'
      return
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    html.value = (await blogRenderer()).render(data.body || '')
    post.value = data
    state.value = 'ok'
    document.title = `${data.title} | ブログ | 建国鯖`
  } catch (e) {
    console.error('Failed to fetch blog post:', e)
    state.value = 'error'
  }
}

// 記事から別の記事へ移ったときや戻る/進むでは、同じページのままURLの id だけ変わるので読み直す
const router = useRouter()
let previousHook
onMounted(() => {
  previousHook = router.onAfterRouteChange
  router.onAfterRouteChange = async (href) => {
    await previousHook?.(href)
    if (/\/blog\/view(\.html)?$/.test(location.pathname)) load()
  }
  load()
})
onUnmounted(() => {
  router.onAfterRouteChange = previousHook
})
</script>

<template>
  <div v-if="state === 'loading'" class="status-message loading">⏳ 記事を読み込んでいます...</div>
  <div v-else-if="state === 'notfound'" class="status-message error">
    ⚠️ この記事は見つかりませんでした。非公開になったか、URLが間違っている可能性があります。
  </div>
  <div v-else-if="state === 'error'" class="status-message error">⚠️ 記事の取得に失敗しました。時間をおいて再読み込みしてください。</div>
  <article v-else class="blog-article">
    <p class="blog-meta">
      <span v-if="SOURCE_LABELS[post.source]" class="blog-source">{{ SOURCE_LABELS[post.source] }}</span>
      <span>{{ post.authorName }}</span>
      <time :datetime="post.createdAt">{{ formatDateTime(post.createdAt) }}</time>
      <span v-if="post.updatedAt !== post.createdAt" class="blog-updated">（{{ formatDateTime(post.updatedAt) }} 更新）</span>
    </p>
    <h1>{{ post.title }}</h1>
    <div class="blog-body" v-html="html"></div>
  </article>

  <p class="back-link">
    <a :href="withBase('/blog')">← ブログ一覧に戻る</a>
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
}
.error {
  background-color: var(--vp-custom-block-danger-bg, rgba(255, 84, 84, 0.1));
  color: var(--vp-c-danger-1, #ff5454);
}
.blog-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}
.blog-source {
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 20px;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
}
.blog-updated { color: var(--vp-c-text-3); }
.blog-article h1 { margin-top: 0; }
.blog-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}
.back-link {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
