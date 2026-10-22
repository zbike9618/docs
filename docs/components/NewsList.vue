<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { data as bakedNews } from '../data/news.data.js'
import { tagColor } from './newsTags.js'
import { relativeTime, formatDateTime } from './relativeTime.js'

const props = defineProps({
  limit: {
    type: Number,
    default: 0
  },
  // お知らせページでだけタグの絞り込みを出す
  filterable: {
    type: Boolean,
    default: false
  }
})

// 最初に見える一覧はビルド時に API から取って HTML に焼いたもの（検索エンジンにも読める）。
// ページを開いたあとで API を取り直し、新しければ差し替える（取れなくても焼いた一覧が残る）
const newsData = ref(bakedNews)
const error = ref(false)
const activeTag = ref(null)

// API の一覧には本文が入っている。ビルド時の一覧と同じ形（hasBody だけ持つ）にそろえる
const toListItem = ({ body, ...rest }) => ({ ...rest, hasBody: Boolean(body) })

// 「3分前に更新」は、ビルド時の時刻では意味がないのでブラウザで開いてから出す
const mounted = ref(false)
const now = ref(0)
let timer = null
onUnmounted(() => clearInterval(timer))

onMounted(async () => {
  mounted.value = true
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 60000)
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/news`)
    if (res.ok) {
      newsData.value = (await res.json()).map(toListItem)
    } else if (newsData.value.length === 0) {
      error.value = true
    }
  } catch (e) {
    console.warn('Failed to refresh news:', e)
    if (newsData.value.length === 0) error.value = true
  }
})

// 絞り込みの候補は、実際に使われているタグだけ
const usedTags = computed(() => [...new Set(newsData.value.flatMap((n) => n.tags || []))])

const displayNews = computed(() => {
  const list = activeTag.value ? newsData.value.filter((n) => (n.tags || []).includes(activeTag.value)) : newsData.value
  return props.limit > 0 ? list.slice(0, props.limit) : list
})

// 作成・更新日時があるお知らせだけ「〜前に更新」を出す（導入前のお知らせは日付のみ）
const updatedLabel = (item) => {
  if (!mounted.value) return null
  const at = item.updatedAt || item.createdAt
  if (!at) return null
  const rel = relativeTime(at, now.value)
  if (!rel) return null
  const verb = item.updatedAt && item.updatedAt !== item.createdAt ? '更新' : '公開'
  return rel === 'たった今' ? `たった今${verb}` : `${rel}に${verb}`
}

// 管理画面に旧形式のリンク（/news/view?id=20）が入っていても、記事ページ（/news/20）に直す
const modernLink = (link) => (link ? link.replace(/^\/news\/view\?id=(\d+)$/, '/news/$1') : link)

// 本文があるお知らせは記事ページ（news/[id].md）へ。無ければ管理画面で入れたリンク先へ
const pageOf = (item) => (item.hasBody ? `/news/${item.id}` : modernLink(item.link))
</script>

<template>
  <div v-if="error" class="status-message error">
    ⚠️ お知らせの取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <div v-else-if="newsData.length === 0" class="status-message empty">
    現在、新しいお知らせはありません。
  </div>
  <template v-else>
    <div v-if="filterable && usedTags.length" class="news-filter" role="group" aria-label="タグで絞り込む">
      <button :aria-pressed="activeTag === null" @click="activeTag = null">すべて</button>
      <button
        v-for="tag in usedTags" :key="tag"
        :aria-pressed="activeTag === tag" :style="{ '--tag': tagColor(tag) }"
        @click="activeTag = activeTag === tag ? null : tag"
      >{{ tag }}</button>
    </div>
    <ul class="news-list">
      <li v-for="item in displayNews" :key="item.id" :class="{ 'has-link': pageOf(item) }">
        <div class="news-when">
          <time>{{ item.date }}</time>
          <span
            v-if="updatedLabel(item)" class="news-rel"
            :title="formatDateTime(item.updatedAt || item.createdAt)"
          >{{ updatedLabel(item) }}</span>
        </div>
        <component
          :is="pageOf(item) ? 'a' : 'div'"
          :class="['news-content', { 'news-content-static': !pageOf(item) }]"
          :href="pageOf(item) ? withBase(pageOf(item)) : undefined"
        >
          <span class="news-text">
            <span v-if="item.tags && item.tags.length" class="news-tags">
              <span v-for="tag in item.tags" :key="tag" class="news-tag" :style="{ '--tag': tagColor(tag) }">{{ tag }}</span>
            </span>
            {{ item.text }}
          </span>
          <span v-if="pageOf(item)" class="news-action">詳細を見る <i aria-hidden="true">→</i></span>
        </component>
      </li>
    </ul>
    <p v-if="displayNews.length === 0" class="status-message empty">このタグのお知らせはありません。</p>
  </template>
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
.news-when {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.news-rel {
  color: var(--vp-c-brand-1);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  cursor: help;
}
.news-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-right: 8px;
  vertical-align: 1px;
}
.news-tag {
  display: inline-block;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: 18px;
  color: var(--tag);
  background: color-mix(in srgb, var(--tag) 14%, transparent);
}
.news-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0 16px;
}
.news-filter button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  transition: border-color .2s ease, background-color .2s ease, color .2s ease;
}
.news-filter button[aria-pressed="true"] {
  border-color: var(--tag, var(--vp-c-brand-1));
  color: var(--tag, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--tag, var(--vp-c-brand-1)) 12%, transparent);
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
.news-action {
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

@media (max-width: 640px) {
  .news-list li {
    grid-template-columns: 1fr;
    gap: 3px;
    padding: 14px 0;
  }
  .news-list time { padding-left: 2px; }
  .news-when { flex-direction: row; align-items: baseline; gap: 8px; }
  .news-content { gap: 10px; padding: 10px 2px; }
  a.news-content:hover { transform: none; }
  .news-action { min-width: auto; padding: 5px 8px; }
}
</style>
