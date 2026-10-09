<script setup>
// ブログ一覧（/blog）。カード形式でサムネイル・タイトル・書いた人・日付・抜粋を出す
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { apiBase, imageUrl, SOURCE_LABELS } from './blogApi.js'
import { formatDateTime } from './relativeTime.js'

const props = defineProps({
  limit: { type: Number, default: 0 }
})

const posts = ref([])
const state = ref('loading') // loading | ok | error

onMounted(async () => {
  try {
    const res = await fetch(`${apiBase()}/api/blog`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const all = await res.json()
    posts.value = props.limit > 0 ? all.slice(0, props.limit) : all
    state.value = 'ok'
  } catch (e) {
    console.error('Failed to fetch blog:', e)
    state.value = 'error'
  }
})

const dateOf = (iso) => formatDateTime(iso).split(' ')[0]
</script>

<template>
  <div v-if="state === 'loading'" class="status-message loading">⏳ 記事を読み込んでいます...</div>
  <div v-else-if="state === 'error'" class="status-message error">⚠️ 記事の取得に失敗しました。時間をおいて再読み込みしてください。</div>
  <div v-else-if="posts.length === 0" class="status-message empty">まだ記事はありません。</div>
  <div v-else class="blog-grid">
    <a v-for="p in posts" :key="p.id" class="blog-card" :href="withBase(`/blog/view?id=${p.id}`)">
      <div class="blog-thumb">
        <img v-if="p.thumbnail" :src="imageUrl(p.thumbnail)" alt="" loading="lazy">
        <!-- 画像が無い記事はトップの城の画像を暗くして代わりに使う -->
        <img v-else class="blog-thumb-fallback" :src="withBase('/hero-castle-v1.webp')" alt="" loading="lazy">
      </div>
      <div class="blog-card-body">
        <h3 class="blog-title">{{ p.title }}</h3>
        <p v-if="p.excerpt" class="blog-excerpt">{{ p.excerpt }}</p>
        <p class="blog-meta">
          <span v-if="SOURCE_LABELS[p.source]" class="blog-source">{{ SOURCE_LABELS[p.source] }}</span>
          <span>{{ p.authorName }}</span>
          <time :datetime="p.createdAt">{{ dateOf(p.createdAt) }}</time>
        </p>
      </div>
    </a>
  </div>
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
.empty {
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 1.5rem;
}
.blog-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: inherit;
  text-decoration: none !important;
  transition: border-color .2s ease, transform .2s ease;
}
.blog-card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
  transform: translateY(-2px);
}
.blog-thumb {
  aspect-ratio: 16 / 9;
  background: var(--vp-c-bg-alt);
  display: grid;
  place-items: center;
  overflow: hidden;
}
.blog-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.blog-thumb img.blog-thumb-fallback { filter: brightness(.45) saturate(.8); }
.blog-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
  flex: 1;
}
.blog-title {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
  color: var(--vp-c-text-1);
}
.blog-excerpt {
  margin: 0 !important;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.blog-meta {
  margin: auto 0 0 !important;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.blog-source {
  padding: 0 7px;
  border-radius: 999px;
  font-weight: 800;
  line-height: 18px;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
}
</style>
