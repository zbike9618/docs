<template>
  <div class="server-status" :class="state">
    <div v-if="state === 'loading'" class="status-cell">
      <span class="icon">🔄</span> 通信中...
    </div>
    <div v-else-if="state === 'online'" class="status-cell">
      <span class="icon">🟢</span> サーバーは現在オンラインです！
      <span class="players" v-if="players !== null">({{ players }} / {{ maxPlayers }} 人)</span>
    </div>
    <div v-else-if="state === 'unreachable'" class="status-cell">
      <span class="icon">🟡</span> サーバーは起動していますが、外部から接続しにくい状態です。
    </div>
    <div v-else-if="state === 'offline'" class="status-cell">
      <span class="icon">🔴</span> サーバーは現在オフライン（ダウン）です。
    </div>
    <div v-else class="status-cell">
      <span class="icon">⚪</span> サーバー状態を取得できませんでした。
    </div>

    <div class="last-update" v-if="state !== 'loading'">
      最終更新: {{ lastUpdateTime }}
      <button @click="fetchStatus" class="update-btn" :disabled="refreshing">
        {{ refreshing ? '更新中...' : '手動更新' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// loading → online / unreachable / offline / error
const state = ref('loading')
const refreshing = ref(false)
const players = ref(null)
const maxPlayers = ref(null)
const lastUpdateTime = ref('')

let intervalId = null

// サーバーのステータスを取得する関数
const fetchStatus = async () => {
  refreshing.value = true
  try {
    // 自前のAPIがサーバーへ直接 ping して確かめた結果を返す（外部のステータスAPIは使わない）
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const response = await fetch(`${apiBase}/api/status`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    if (!data.online) state.value = 'offline'
    else if (!data.reachable) state.value = 'unreachable'
    else state.value = 'online'
    players.value = data.players
    maxPlayers.value = data.maxPlayers
  } catch (error) {
    // 取得に失敗しただけでサーバーが落ちているとは限らないので「オフライン」とは出さない
    console.error('サーバー状態の取得に失敗しました', error)
    state.value = 'error'
  } finally {
    const now = new Date()
    // 時間を hh:mm:ss 形式にして保存
    lastUpdateTime.value = `${now.getHours()}時${now.getMinutes().toString().padStart(2, '0')}分${now.getSeconds().toString().padStart(2, '0')}秒`
    refreshing.value = false
  }
}

// ページが開かれたときに実行される処理
onMounted(() => {
  fetchStatus() // 最初の一回を取得

  // 60秒（60000ミリ秒）ごとに自動更新するようセット
  intervalId = setInterval(fetchStatus, 60000)
})

// ページから離れるときに自動更新をストップする処理
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.server-status {
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  font-weight: bold;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background-color: var(--vp-c-bg-soft);
}

.server-status.online {
  border-color: #4CAF50;
  background-color: rgba(76, 175, 80, 0.1);
}

.server-status.unreachable {
  border-color: #FFB300;
  background-color: rgba(255, 179, 0, 0.1);
}

.server-status.offline {
  border-color: #F44336;
  background-color: rgba(244, 67, 54, 0.1);
}

.server-status.error {
  border-color: var(--vp-c-divider);
}

.status-cell {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.icon {
  margin-right: 8px;
}

.players {
  margin-left: 10px;
  font-size: 1rem;
  color: var(--vp-c-text-2);
}

.last-update {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin-top: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.update-btn {
  background-color: var(--vp-c-brand-1);
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s;
}

.update-btn:hover {
  background-color: var(--vp-c-brand-2);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
