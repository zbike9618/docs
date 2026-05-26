<template>
  <div class="server-status" :class="{ online: isOnline, offline: !isOnline && !loading }">
    <div v-if="loading" class="status-cell">
      <span class="icon">🔄</span> 通信中...
    </div>
    <div v-else-if="isOnline" class="status-cell">
      <span class="icon">🟢</span> サーバーは現在オンラインです！
      <span class="players" v-if="players !== null">({{ players }} / {{ maxPlayers }} 人)</span>
    </div>
    <div v-else class="status-cell">
      <span class="icon">🔴</span> サーバーは現在オフライン（ダウン）です。
    </div>
    
    <div class="last-update" v-if="!loading">
      最終更新: {{ lastUpdateTime }}
      <button @click="fetchStatus" class="update-btn">手動更新</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ▼▼▼ ここをご自身のサーバーのIPアドレス・ポート番号に変更してください ▼▼▼
const SERVER_IP = 'play.gozakura.org' // 例: 192.168.0.102 等
const SERVER_PORT = '19132'          // 統合版のデフォルトは 19132
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const isOnline = ref(false)
const players = ref(null)
const maxPlayers = ref(null)
const loading = ref(true)
const lastUpdateTime = ref('')

let intervalId = null

// サーバーのステータスを取得する関数
const fetchStatus = async () => {
  loading.value = true
  try {
    // mcsrvstat.us という無料のサーバー確認APIを使用します（統合版用）
    const response = await fetch(`https://api.mcsrvstat.us/bedrock/3/${SERVER_IP}:${SERVER_PORT}`)
    const data = await response.json()
    
    isOnline.value = data.online
    if (data.online) {
      players.value = data.players?.online ?? 0
      maxPlayers.value = data.players?.max ?? '?'
    }
  } catch (error) {
    console.error('サーバー状態の取得に失敗しました', error)
    isOnline.value = false
  } finally {
    const now = new Date()
    // 時間を hh:mm:ss 形式にして保存
    lastUpdateTime.value = `${now.getHours()}時${now.getMinutes().toString().padStart(2, '0')}分${now.getSeconds().toString().padStart(2, '0')}秒`
    loading.value = false
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

.server-status.offline {
  border-color: #F44336;
  background-color: rgba(244, 67, 54, 0.1);
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
</style>
