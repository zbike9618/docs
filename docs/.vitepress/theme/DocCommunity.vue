<script setup>
// 各ページ（ガイド・お知らせ・ブログなど）の本文の下に出す、Discord と YouTube への案内
import BrandIcon from '../../components/BrandIcon.vue'
import { DISCORD_URL, YOUTUBE_URL } from '../../data/site.js'
</script>

<template>
  <aside class="k-doc-community" aria-label="コミュニティ">
    <div class="k-doc-community-text">
      <strong>わからないことは Discord で質問できます</strong>
      <span>最新のお知らせも Discord に流れます。動画は YouTube で公開中。</span>
    </div>
    <div class="k-doc-community-actions">
      <a class="is-discord" :href="DISCORD_URL" target="_blank" rel="noopener">
        <BrandIcon name="discord" /> Discordに参加
      </a>
      <a class="is-youtube" :href="YOUTUBE_URL" target="_blank" rel="noopener">
        <BrandIcon name="youtube" /> YouTube
      </a>
    </div>
  </aside>
</template>

<style scoped>
.k-doc-community {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px 24px;
  margin-top: 56px;
  padding: 22px 24px;
  border: 1px solid #e1ddd5;
  border-left: 4px solid #5865f2;
  background: #faf8f4;
}
.k-doc-community-text strong,
.k-doc-community-text span { display: block; }
.k-doc-community-text strong { color: #172033; font-size: 16px; }
.k-doc-community-text span { margin-top: 4px; color: #5d6675; font-size: 13px; line-height: 1.7; }

.k-doc-community-actions { display: flex; flex: none; flex-wrap: wrap; gap: 8px; }
.k-doc-community-actions a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: filter .2s ease, border-color .2s ease;
}
.k-doc-community-actions .k-brand-icon { font-size: 18px; }
.k-doc-community-actions .is-discord { color: #fff; background: #5865f2; }
.k-doc-community-actions .is-discord:hover { filter: brightness(1.08); }
.k-doc-community-actions .is-youtube { color: #172033; border-color: #d9d4cb; background: #fff; }
.k-doc-community-actions .is-youtube .k-brand-icon { color: #e5132e; }
.k-doc-community-actions .is-youtube:hover { border-color: #e5132e; }

@media (max-width: 640px) {
  .k-doc-community { flex-direction: column; align-items: stretch; margin-top: 44px; padding: 18px; }
  .k-doc-community-actions a { flex: 1; justify-content: center; }
}
</style>

<style>
/* ダークモード（html.dark） */
html.dark .k-doc-community { border-color: #304057; border-left-color: #5865f2; background: #101e30; }
html.dark .k-doc-community-text strong { color: #eef2f7; }
html.dark .k-doc-community-text span { color: #a9b5c5; }
html.dark .k-doc-community-actions .is-youtube { color: #eef2f7; border-color: #34445a; background: #142338; }
html.dark .k-doc-community-actions .is-youtube:hover { border-color: #e5132e; }
</style>
