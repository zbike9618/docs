<script setup>
// ブログの記事ページ（/blog/<id>）。本文はビルド時に API から取って HTML にしてある（検索エンジンにも読める）。
// ページを開いたあとで API を取り直し、リアクション（数・自分が押したもの）を最新にする。
// 管理画面で直した直後（再ビルド前）なら、本文も新しい内容に差し替える。
import { ref, computed, watch, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { apiBase, articleRenderer, getVoterId, SOURCE_LABELS } from './blogApi.js'
import { formatDateTime } from './relativeTime.js'

const props = defineProps({
  // ビルド時に作った記事（docs/blog/[id].paths.js の params）
  article: { type: Object, required: true }
})

const live = ref(null) // API から取り直した内容（リアクション・自分が押した絵文字・直したあとの本文）
const gone = ref(false) // 取り直したら非公開か削除になっていた
const reacting = ref(false)
const reactError = ref('')

// ビルド時の内容に、取り直した内容を重ねたもの
const post = computed(() => ({ myReactions: [], ...props.article, ...(live.value || {}) }))

// 同じ絵文字をもう一度押すと取り消し
const react = async (emoji) => {
  if (reacting.value) return
  reacting.value = true
  reactError.value = ''
  try {
    const res = await fetch(`${apiBase()}/api/blog/${props.article.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Voter-Id': getVoterId() },
      body: JSON.stringify({ emoji }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    live.value = { ...(live.value || {}), ...data }
  } catch (e) {
    reactError.value = e.message
  } finally {
    reacting.value = false
  }
}

const refresh = async () => {
  const id = props.article.id
  live.value = null
  gone.value = false
  try {
    const res = await fetch(`${apiBase()}/api/blog/${id}`, { headers: { 'X-Voter-Id': getVoterId() } })
    if (id !== props.article.id) return
    if (res.status === 404) {
      gone.value = true
      return
    }
    if (!res.ok) return
    const data = await res.json()
    if (id !== props.article.id) return
    const next = { reactions: data.reactions, myReactions: data.myReactions || [] }
    if (data.updatedAt !== props.article.updatedAt) {
      Object.assign(next, {
        title: data.title,
        authorName: data.authorName,
        source: data.source,
        updatedAt: data.updatedAt,
        html: (await articleRenderer()).render(data.body || ''),
      })
      document.title = `${data.title} | ブログ | 建国鯖`
    }
    if (id === props.article.id) live.value = next
  } catch (e) {
    // 取り直せなくても、ビルド時の内容のまま読める
    console.warn('Failed to refresh blog post:', e)
  }
}

onMounted(refresh)
// 記事から別の記事へ移ったときは、同じコンポーネントのまま article だけ入れ替わる
watch(() => props.article.id, refresh)
</script>

<template>
  <article v-if="!gone" class="blog-article">
    <p class="blog-meta">
      <span v-if="SOURCE_LABELS[post.source]" class="blog-source">{{ SOURCE_LABELS[post.source] }}</span>
      <span>{{ post.authorName }}</span>
      <time :datetime="post.createdAt">{{ formatDateTime(post.createdAt) }}</time>
      <span v-if="post.updatedAt !== post.createdAt" class="blog-updated">（{{ formatDateTime(post.updatedAt) }} 更新）</span>
    </p>
    <h1>{{ post.title }}</h1>
    <div class="blog-body" v-html="post.html"></div>

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
  <div v-else class="status-message error">
    ⚠️ この記事は非公開になったか、削除されました。
  </div>

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
