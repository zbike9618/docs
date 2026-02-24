<script setup>
import { computed } from 'vue'
import bugData from '../.vitepress/bugs.json'

const displayBugs = computed(() => {
  const activeBugs = []
  const fixedBugs = []
  
  // 修正済みとそれ以外を分類
  for (const bug of bugData) {
    if (bug.status.includes('修正済み') || bug.status.includes('仕様')) {
      fixedBugs.push(bug)
    } else {
      activeBugs.push(bug)
    }
  }

  // 修正済みのものは最新の3件のみ取得
  const limitedFixedBugs = fixedBugs.slice(0, 3)

  // 対応中などを上に、修正済みを下に表示する
  return [...activeBugs, ...limitedFixedBugs]
})
</script>

<template>
  <div class="bug-table-container">
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
  </div>
</template>

<style scoped>
.bug-table-container {
  overflow-x: auto;
}
.bug-table-container table th,
.bug-table-container table td {
  white-space: nowrap;
}
</style>
