<script setup>
// ブログの記事ページ（/blog/view?id=<id>）。本文は管理画面で書いた Markdown を API から取ってきて表示する
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, withBase } from 'vitepress'
import { apiBase, blogRenderer, getVoterId, SOURCE_LABELS } from './blogApi.js'
import { formatDateTime } from './relativeTime.js'

const post = ref(null)
const html = ref('')
const state = ref('loading') // loading | ok | notfound | error
const reacting = ref(false)
const reactError = ref('')

// 同じ絵文字をもう一度押すと取り消し
const react = async (emoji) => {
  if (reacting.value) return
  reacting.value = true
  reactError.value = ''
  try {
    const res = await fetch(`${apiBase()}/api/blog/${post.value.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Voter-Id': getVoterId() },
      body: JSON.stringify({ emoji }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    Object.assign(post.value, data)
  } catch (e) {
    reactError.value = e.message
  } finally {
    reacting.value = false
  }
}

const load = async () => {
  const id = new URLSearchParams(location.search).get('id')
  if (!/^\d+$/.test(id || '')) {
    state.value = 'notfound'
    return
  }
  state.value = 'loading'
  try {
    const res = await fetch(`${apiBase()}/api/blog/${id}`, { headers: { 'X-Voter-Id': getVoterId() } })
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

    <div class="blog-reactions" role="group" aria-label="リアクション">
      <button
        v-for="r in post.reactions" :key="r.emoji" type="button"
        :aria-pressed="(post.myReactions || []).includes(r.emoji)"
        :disabled="reacting"
        @click="react(r.emoji)"
      >
        <span class="emoji">{{ r.emoji }}</span>
        <span class="count">{{ r.count }}</span>
      </button>
    </div>
    <p v-if="reactError" class="blog-react-error">{{ reactError }}</p>
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
.blog-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2rem;
}
.blog-reactions button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 14px;
  transition: border-color .15s ease, background-color .15s ease, transform .15s ease;
}
.blog-reactions button:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--vp-c-brand-1); }
.blog-reactions button[aria-pressed="true"] {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent);
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
.blog-reactions .emoji { font-size: 18px; line-height: 1; }
.blog-reactions .count { font-variant-numeric: tabular-nums; }
.blog-react-error { margin-top: 8px; color: var(--vp-c-danger-1, #ff5454); font-size: 13px; }
.back-link {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
