<script setup>
// お知らせの記事ページ（/news/view?id=<id>）。本文は管理画面で書いた Markdown を API から取ってきて表示する
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, withBase } from 'vitepress'

const item = ref(null)
const html = ref('')
const state = ref('loading') // loading | ok | notfound | error

let md = null
const renderer = async () => {
  if (md) return md
  const { default: MarkdownIt } = await import('markdown-it')
  // html: false なので本文に書いたタグは文字のまま表示される（スクリプトは動かない）
  md = new MarkdownIt({ html: false, linkify: true, breaks: true })
  const defaultLinkOpen = md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') || ''
    if (/^https?:\/\//.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      token.attrSet('href', withBase(href))
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }
  return md
}

const load = async () => {
  const id = new URLSearchParams(location.search).get('id')
  if (!/^\d+$/.test(id || '')) {
    state.value = 'notfound'
    return
  }
  state.value = 'loading'
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/news/${id}`)
    if (res.status === 404) {
      state.value = 'notfound'
      return
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    html.value = (await renderer()).render(data.body || '')
    item.value = data
    state.value = 'ok'
    document.title = `${data.text} | お知らせ | 建国鯖`
  } catch (e) {
    console.error('Failed to fetch news article:', e)
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
    if (/\/news\/view(\.html)?$/.test(location.pathname)) load()
  }
  load()
})
onUnmounted(() => {
  router.onAfterRouteChange = previousHook
})
</script>

<template>
  <div v-if="state === 'loading'" class="status-message loading">
    ⏳ お知らせを読み込んでいます...
  </div>
  <div v-else-if="state === 'notfound'" class="status-message error">
    ⚠️ このお知らせは見つかりませんでした。削除されたか、URLが間違っている可能性があります。
  </div>
  <div v-else-if="state === 'error'" class="status-message error">
    ⚠️ お知らせの取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <article v-else class="news-article">
    <p class="news-date">{{ item.date }}</p>
    <h1>{{ item.text }}</h1>
    <div class="news-body" v-html="html"></div>
  </article>

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
