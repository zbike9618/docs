<script setup>
import { ref, computed, onMounted } from 'vue'
import { data as bakedBugs } from '../data/bugs.data.js'

// すべてのバグを表示するかどうかを管理する変数（初期値はfalse）
const showAll = ref(false)
// 最初に見える一覧はビルド時に API から取って HTML に焼いたもの（検索エンジンにも読める）。
// ページを開いたあとで API を取り直し、新しければ差し替える（取れなくても焼いた一覧が残る）
const bugData = ref(bakedBugs)
const error = ref(false)

onMounted(async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
    const res = await fetch(`${apiBase}/api/bugs`)
    if (res.ok) {
      bugData.value = await res.json()
    } else if (bugData.value.length === 0) {
      error.value = true
    }
  } catch (e) {
    console.warn('Failed to refresh bugs:', e)
    if (bugData.value.length === 0) error.value = true
  }
})

const displayBugs = computed(() => {
  const activeBugs = []
  const fixedBugs = []
  
  // 修正済みとそれ以外を分類
  for (const bug of bugData.value) {
    if (bug.status.includes('修正済み') || bug.status.includes('仕様')) {
      fixedBugs.push(bug)
    } else {
      activeBugs.push(bug)
    }
  }

  // showAllがtrue（すべて表示する状態）なら全件返す
  if (showAll.value) {
    return [...activeBugs, ...fixedBugs]
  }

  // 修正済みのものは最新の3件のみ取得
  const limitedFixedBugs = fixedBugs.slice(0, 3)

  // 対応中などを上に、修正済みを下に表示する
  return [...activeBugs, ...limitedFixedBugs]
})

// ボタンをクリックした時に実行される関数（現在の状態を反転させる）
const toggleShowAll = () => {
  showAll.value = !showAll.value
}
</script>

<template>
  <div v-if="error" class="status-message error">
    ⚠️ 不具合情報の取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <div v-else class="bug-table-container">
    <table>
      <thead>
        <tr>
          <th>報告日</th>
          <th>不具合の内容</th>
          <th>カテゴリ</th>
          <th>ステータス</th>
          <th>備考</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(bug, index) in displayBugs" :key="index">
          <td>{{ bug.date }}</td>
          <td>{{ bug.issue }}</td>
          <td>{{ bug.category }}</td>
          <td>{{ bug.status }}</td>
          <td>{{ bug.note }}</td>
        </tr>
      </tbody>
    </table>
    <!-- すべて見る/一部だけ見る を切り替えるボタン -->
    <div class="button-container">
      <button class="toggle-button" @click="toggleShowAll">
        {{ showAll ? '表示を減らす' : 'すべてのバグを見る' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-message {
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
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

.bug-table-container {
  overflow-x: auto;
}
.bug-table-container table th,
.bug-table-container table td {
  white-space: nowrap;
}
.button-container {
  margin-top: 16px;
  text-align: center;
}
.toggle-button {
  padding: 8px 16px;
  background-color: var(--vp-c-brand);
  color: white;
  border-radius: 4px;
  font-weight: bold;
  transition: opacity 0.2s;
}
.toggle-button:hover {
  opacity: 0.8;
}
</style>
