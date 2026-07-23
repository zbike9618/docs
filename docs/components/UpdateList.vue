<script setup>
import { ref, computed, onMounted } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  limit: {
    type: Number,
    default: 0
  }
})

const updateData = ref([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/updates`)
    if (res.ok) {
      updateData.value = await res.json()
    } else {
      error.value = true
    }
  } catch (e) {
    console.error('Failed to fetch updates:', e)
    error.value = true
  } finally {
    loading.value = false
  }
})

const displayUpdates = computed(() => {
  return props.limit > 0 ? updateData.value.slice(0, props.limit) : updateData.value
})
</script>

<template>
  <div v-if="loading" class="status-message loading">
    ⏳ アップデート情報を読み込んでいます...
  </div>
  <div v-else-if="error" class="status-message error">
    ⚠️ アップデート情報の取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <ul v-else class="update-list">
    <li v-for="(item, index) in displayUpdates" :key="index">
      <div class="update-header">
        <strong class="update-date">{{ item.date }}</strong>
        <a v-if="item.link" :href="withBase(item.link)" class="update-title">{{ item.title }}</a>
        <span v-else class="update-title">{{ item.title }}</span>
      </div>
      <p v-if="item.body" class="update-body">{{ item.body }}</p>
    </li>
  </ul>
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

.update-list {
  list-style-type: none;
  padding-left: 0;
  margin-top: 1rem;
}
.update-list li {
  position: relative;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border-left: 3px solid var(--vp-c-brand-1);
}
.update-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: baseline;
}
.update-date {
  color: var(--vp-c-text-2);
  font-size: 0.9em;
}
.update-title {
  font-weight: bold;
}
.update-body {
  margin: 0.5rem 0 0;
  white-space: pre-line;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
