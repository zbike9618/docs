<script setup>
import { ref, onMounted } from 'vue'

// バナーの中身は管理画面（/api/banners）で管理する。表示期間外・非表示・締め切られた投票のものはAPI側で除かれる
const banners = ref([])

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/banners`)
    if (res.ok) banners.value = await res.json()
  } catch (e) {
    // 取れないときはバナーを出さないだけ
    console.error('Failed to fetch banners:', e)
  }
})

const isExternal = (link) => /^https?:\/\//.test(link || '')

const formatDate = (iso) =>
  new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
</script>

<template>
  <component
    :is="banner.link ? 'a' : 'div'"
    v-for="banner in banners"
    :key="banner.id"
    :href="banner.link || undefined"
    :target="isExternal(banner.link) ? '_blank' : undefined"
    :rel="isExternal(banner.link) ? 'noopener' : undefined"
    class="event-banner"
    :class="{ 'is-poll': banner.kind === 'poll', 'is-static': !banner.link }"
  >
    <div class="event-content">
      <div class="badge">{{ banner.badge }}</div>
      <div class="text-group">
        <h3 class="title">{{ banner.title }}</h3>
        <p v-if="banner.body" class="description">{{ banner.body }}</p>
        <p v-if="banner.closesAt" class="deadline">締め切り：{{ formatDate(banner.closesAt) }}</p>
      </div>
      <div v-if="banner.link" class="arrow">➔</div>
    </div>
  </component>
</template>

<style scoped>
.event-banner {
  display: block;
  margin: 24px 0;
  text-decoration: none !important;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}
.event-banner + .event-banner {
  margin-top: -8px;
}

.event-banner:hover:not(.is-static) {
  transform: translateY(-2px);
  border-color: rgba(111, 142, 247, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(111, 142, 247, 0.15);
}

.event-content {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.badge {
  background: rgba(111, 142, 247, 0.1);
  color: #8fb1ff;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 0.05rem;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(111, 142, 247, 0.3);
  white-space: nowrap;
  animation: pulse 2s infinite;
}

/* 投票バナーはバッジを緑にして通常のイベントと見分ける */
.is-poll .badge {
  background: rgba(76, 195, 138, 0.12);
  color: #6fe0a8;
  border-color: rgba(76, 195, 138, 0.35);
}
.event-banner.is-poll:hover {
  border-color: rgba(76, 195, 138, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(76, 195, 138, 0.15);
}

.text-group {
  flex-grow: 1;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.description {
  margin: 4px 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
  color: white;
  white-space: pre-line;
}

.deadline {
  margin: 6px 0 0;
  font-size: 0.8rem;
  color: #a8b3c7;
}

.arrow {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.event-banner:hover .arrow {
  transform: translateX(8px);
}

@keyframes pulse {
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
}

@media (max-width: 640px) {
  .event-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .arrow {
    display: none;
  }
}
</style>
