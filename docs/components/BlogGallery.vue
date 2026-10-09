<script setup>
// トップページのブログギャラリー。最新の記事を画像中心のタイルで並べる。記事が無いあいだはセクションごと出さない
import { ref, onMounted } from 'vue'
import { withBase } from 'vitepress'
import { apiBase, imageUrl, SOURCE_LABELS } from './blogApi.js'
import { formatDateTime } from './relativeTime.js'

const props = defineProps({
  limit: { type: Number, default: 5 }
})

const posts = ref([])

onMounted(async () => {
  try {
    const res = await fetch(`${apiBase()}/api/blog`)
    if (res.ok) posts.value = (await res.json()).slice(0, props.limit)
  } catch (e) {
    // トップページなので、取れなければ何も出さない
    console.error('Failed to fetch blog:', e)
  }
})

const dateOf = (iso) => formatDateTime(iso).split(' ')[0]
</script>

<template>
  <section v-if="posts.length" class="k-journal">
    <div class="k-shell">
      <div class="k-update-head">
        <div class="k-section-heading">
          <p class="k-kicker">FIELD JOURNAL</p>
          <h2>サーバーのいま</h2>
          <p>サポーターが見てきた、建国鯖の出来事と風景。</p>
        </div>
        <a :href="withBase('/blog')">すべての記事 →</a>
      </div>

      <div class="k-gallery" :class="`k-gallery-${posts.length}`">
        <a
          v-for="(p, i) in posts" :key="p.id"
          class="k-tile" :class="{ 'k-tile-large': i === 0 }"
          :href="withBase(`/blog/view?id=${p.id}`)"
        >
          <img v-if="p.thumbnail" :src="imageUrl(p.thumbnail)" alt="" loading="lazy">
          <span v-else class="k-tile-empty" aria-hidden="true">📝</span>
          <div class="k-tile-caption">
            <h3>{{ p.title }}</h3>
            <p v-if="i === 0 && p.excerpt" class="k-tile-excerpt">{{ p.excerpt }}</p>
            <p class="k-tile-meta">
              <b v-if="SOURCE_LABELS[p.source]">{{ SOURCE_LABELS[p.source] }}</b>
              <span>{{ p.authorName }}</span>
              <time :datetime="p.createdAt">{{ dateOf(p.createdAt) }}</time>
            </p>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.k-journal { padding: 104px 0; background: var(--k-paper); }

/* 1件目を大きく（左に2×2）、残りを右に並べる */
.k-gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 210px;
  gap: 14px;
  margin-top: 40px;
}
.k-gallery-1 { grid-template-columns: 1fr; grid-auto-rows: 360px; }
.k-gallery-2 { grid-template-columns: 2fr 1fr; grid-auto-rows: 360px; }
.k-gallery-3 { grid-template-columns: 2fr 1fr; }
.k-gallery-4 { grid-template-columns: 2fr 1fr; grid-auto-rows: 150px; }
.k-tile-large { grid-column: span 2; grid-row: span 2; }
.k-gallery-1 .k-tile-large,
.k-gallery-2 .k-tile-large { grid-column: auto; grid-row: auto; }
.k-gallery-3 .k-tile-large { grid-column: auto; }
.k-gallery-4 .k-tile-large { grid-column: auto; grid-row: span 3; }

.k-tile {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(135deg, #1b2a4a, #3a2440);
  color: white !important;
  text-decoration: none !important;
}
.k-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}
.k-tile:hover img { transform: scale(1.04); }
.k-tile-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 40px;
  opacity: .35;
}
.k-tile-caption {
  position: absolute;
  inset: auto 0 0;
  padding: 40px 16px 14px;
  background: linear-gradient(180deg, transparent, rgba(5, 10, 20, .86));
}
.k-tile h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.k-tile-large h3 { font-size: 22px; }
.k-tile-excerpt {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, .78);
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.k-tile-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, .7);
  font-size: 11px;
}
.k-tile-meta b {
  padding: 0 7px;
  border-radius: 999px;
  font-weight: 800;
  line-height: 18px;
  background: var(--k-pink);
  color: white;
}

@media (max-width: 960px) {
  .k-gallery,
  .k-gallery-2,
  .k-gallery-3,
  .k-gallery-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: 180px; }
  .k-gallery .k-tile-large { grid-column: span 2; grid-row: span 2; }
  .k-gallery-1 .k-tile-large { grid-column: auto; grid-row: auto; }
  .k-gallery-1 { grid-template-columns: 1fr; grid-auto-rows: 260px; }
}
@media (max-width: 640px) {
  .k-journal { padding: 62px 0; }
  .k-gallery { margin-top: 25px; gap: 10px; grid-auto-rows: 140px; }
  .k-tile-large h3 { font-size: 18px; }
  .k-tile h3 { font-size: 13px; }
  .k-tile-caption { padding: 30px 12px 10px; }
}

:global(.dark) .k-journal { background: #0b1626; }
:global(.dark) .k-journal .k-section-heading h2 { color: #eef2f7; }
:global(.dark) .k-journal .k-section-heading > p:last-child { color: #9eabba; }
</style>
