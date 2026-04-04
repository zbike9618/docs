<script setup>
import { ref, computed } from 'vue'
import punishmentData from '../.vitepress/punishments.json'
import currentSeasonRaw from '../.vitepress/.status?raw'

const currentSeason = computed(() => currentSeasonRaw.trim())

// すべて表示するか
const showAll = ref(false)

// 日時のフォーマット
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ステータスの判定
const getStatus = (p) => {
  if (p.type === 'シーズンBAN') {
    return p.season === currentSeason.value ? '執行中' : '解除済み'
  }
  if (!p.expiry) return '--'
  
  const exp = new Date(p.expiry)
  const now = new Date()
  
  if (exp > now) {
    return '執行中'
  } else {
    return '解除済み'
  }
}

// 残り時間の計算
const getRemainingTime = (p) => {
  if (p.type === 'シーズンBAN') return p.season
  if (!p.expiry) return '永久 (なし)'
  
  const exp = new Date(p.expiry)
  const now = new Date()
  const diff = exp - now
  
  if (diff <= 0) return '解除済み'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  let timeStr = 'あと '
  if (days > 0) timeStr += `${days}日 `
  if (hours > 0 || days > 0) timeStr += `${hours}時間 `
  timeStr += `${minutes}分`
  
  return `${formatDate(p.expiry)} (${timeStr})`
}

const displayPunishments = computed(() => {
  // 日時を元に動的にソート・フィルタリングする場合などに備え、
  // ここでステータス判定を含めてソート
  const sorted = [...punishmentData].sort((a, b) => new Date(b.date) - new Date(a.date))

  if (showAll.value) {
    return sorted
  }

  // 初期表示は最新の5件
  return sorted.slice(0, 5)
})

const toggleShowAll = () => {
  showAll.value = !showAll.value
}
</script>

<template>
  <div class="punishment-table-container">
    <table>
      <thead>
        <tr>
          <th>日付</th>
          <th>プレイヤー</th>
          <th>理由</th>
          <th>種類</th>
          <th>BAN解除まで</th>
          <th>ステータス</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in displayPunishments" :key="p.id">
          <td>{{ p.date }}</td>
          <td class="player-name">{{ p.player }}</td>
          <td>{{ p.reason }}</td>
          <td>{{ p.type }}</td>
          <td>{{ getRemainingTime(p) }}</td>
          <td :class="['status', getStatus(p) === '執行中' ? 'active' : 'inactive']">
            {{ getStatus(p) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="button-container" v-if="punishmentData.length > 5">
      <button class="toggle-button" @click="toggleShowAll">
        {{ showAll ? '表示を減らす' : 'すべての履歴を見る' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.punishment-table-container {
  overflow-x: auto;
  margin: 20px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}
th {
  background-color: var(--vp-c-bg-soft);
  font-weight: bold;
}
.player-name {
  font-weight: bold;
  color: var(--vp-c-brand);
}
.status.active {
  color: #ef4444;
  font-weight: bold;
}
.status.inactive {
  color: #6b7280;
}
.button-container {
  margin-top: 16px;
  text-align: center;
}
.toggle-button {
  padding: 8px 16px;
  background-color: var(--vp-c-brand-1);
  color: white;
  border-radius: 8px;
  font-weight: bold;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}
.toggle-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
