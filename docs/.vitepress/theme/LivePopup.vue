<template>
  <!-- YouTube で配信中のときだけ出す。最初はポップアップ、閉じたら右下の小さなボタンにする -->
  <div v-if="live && open" class="live-overlay" @click.self="close">
    <div class="live-dialog" role="dialog" aria-modal="true" aria-labelledby="live-popup-title">
      <button class="live-x" type="button" aria-label="閉じる" @click="close">×</button>
      <p class="live-badge"><span class="dot"></span>LIVE 配信中</p>
      <a :href="live.url" target="_blank" rel="noopener" class="live-thumb" @click="watched">
        <img :src="live.thumbnail" alt="" width="320" height="180" loading="lazy" />
      </a>
      <h2 id="live-popup-title" class="live-title">{{ live.title || '建国鯖の配信' }}</h2>
      <p class="live-lead">建国鯖の YouTube でいま配信しています。のぞいていきませんか？</p>
      <div class="live-actions">
        <a :href="live.url" target="_blank" rel="noopener" class="live-watch" @click="watched">配信を見に行く</a>
        <button type="button" class="live-later" @click="close">あとで</button>
      </div>
    </div>
  </div>
  <a
    v-else-if="live"
    :href="live.url"
    target="_blank"
    rel="noopener"
    class="live-pill"
    :title="live.title || 'YouTube で配信中'"
  ><span class="dot"></span>YouTube で配信中</a>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const POLL_MS = 60000
const DISMISS_KEY = 'gozakura-live-dismissed'

const live = ref(null)
const open = ref(false)
let timer = null

const readDismissed = () => {
  try { return sessionStorage.getItem(DISMISS_KEY) } catch { return null }
}
const writeDismissed = (id) => {
  try { sessionStorage.setItem(DISMISS_KEY, id) } catch { /* 保存できなくても動く */ }
}

const check = async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/youtube/live`)
    if (!res.ok) return
    const data = await res.json()
    if (!data.live || !data.url) {
      live.value = null
      open.value = false
      return
    }
    const isNew = !live.value || live.value.videoId !== data.videoId
    live.value = data
    // 同じ配信では、このタブで一度閉じたら出し直さない
    if (isNew && readDismissed() !== data.videoId) open.value = true
  } catch {
    // 取れないときは何も出さない
  }
}

const close = () => {
  open.value = false
  if (live.value) writeDismissed(live.value.videoId)
}
const watched = () => close()

const onKey = (e) => {
  if (e.key === 'Escape' && open.value) close()
}

onMounted(() => {
  check()
  timer = setInterval(check, POLL_MS)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.live-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
}
.live-dialog {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 20px;
  border-radius: 14px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
  text-align: center;
}
.live-x {
  position: absolute;
  top: 6px;
  right: 10px;
  width: 32px;
  height: 32px;
  font-size: 22px;
  line-height: 1;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  cursor: pointer;
}
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e5212d;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: live-blink 1.4s ease-in-out infinite;
}
.live-thumb {
  display: block;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 16 / 9;
  background: var(--vp-c-bg-soft);
}
.live-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.live-title {
  margin: 12px 0 4px;
  padding: 0;
  border: none;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.live-lead {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.live-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.live-watch {
  display: block;
  padding: 11px 16px;
  border-radius: 8px;
  background: #e5212d;
  color: #fff !important;
  font-weight: 700;
  text-decoration: none !important;
}
.live-watch:hover {
  background: #c81a25;
}
.live-later {
  padding: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: none;
  border: none;
  cursor: pointer;
}
.live-pill {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 150;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  background: #e5212d;
  color: #fff !important;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
.live-pill:hover {
  background: #c81a25;
}
@keyframes live-blink {
  50% { opacity: 0.35; }
}
@media (prefers-reduced-motion: reduce) {
  .dot { animation: none; }
}
</style>
