<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'

const apiBase = import.meta.env.VITE_API_URL || 'https://api.gozakura.org'
const VOTER_KEY = 'gozakura-voter-id'

const polls = ref([])
const loading = ref(true)
const error = ref(false)
// slug ごとの画面状態（選び直し中か・送信中か・エラーメッセージ）
const editing = reactive({})
const sending = reactive({})
const messages = reactive({})

let voterId = ''

// ブラウザごとの投票者ID。localStorage が使えないときはページを開いている間だけのIDになる
const getVoterId = () => {
  try {
    const saved = localStorage.getItem(VOTER_KEY)
    if (saved) return saved
  } catch (e) {}
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  try {
    localStorage.setItem(VOTER_KEY, id)
  } catch (e) {}
  return id
}

onMounted(async () => {
  voterId = getVoterId()
  try {
    const res = await fetch(`${apiBase}/api/polls`, { headers: { 'X-Voter-Id': voterId } })
    if (res.ok) {
      const data = await res.json()
      // 受付中を先に、同じ状態なら新しい順（APIの並び）のまま
      polls.value = [...data.filter((p) => !p.closed), ...data.filter((p) => p.closed)]
    } else {
      error.value = true
    }
  } catch (e) {
    console.error('Failed to fetch polls:', e)
    error.value = true
  } finally {
    loading.value = false
  }

  // /vote#web-map のようなリンクで来たとき、読み込み後にその投票までスクロールする
  const hash = decodeURIComponent(location.hash.slice(1))
  if (hash) {
    await nextTick()
    document.getElementById(hash)?.scrollIntoView()
  }
})

const vote = async (poll, choice) => {
  sending[poll.slug] = true
  messages[poll.slug] = ''
  try {
    const res = await fetch(`${apiBase}/api/polls/${encodeURIComponent(poll.slug)}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Voter-Id': voterId },
      body: JSON.stringify({ choice })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      polls.value = polls.value.map((p) => (p.id === data.id ? data : p))
      editing[poll.slug] = false
    } else {
      messages[poll.slug] = data.error || '投票に失敗しました。時間をおいてもう一度お試しください。'
    }
  } catch (e) {
    console.error('Failed to vote:', e)
    messages[poll.slug] = '投票に失敗しました。時間をおいてもう一度お試しください。'
  } finally {
    sending[poll.slug] = false
  }
}

const showChoices = (poll) => !poll.closed && (poll.myChoice === null || editing[poll.slug])

const percent = (poll, i) => {
  const total = poll.results?.total || 0
  return total ? Math.round((poll.results.counts[i] * 100) / total) : 0
}

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
  <div v-if="loading" class="status-message loading">
    ⏳ 投票を読み込んでいます...
  </div>
  <div v-else-if="error" class="status-message error">
    ⚠️ 投票の取得に失敗しました。時間をおいて再読み込みしてください。
  </div>
  <p v-else-if="polls.length === 0" class="empty">
    現在、投票はありません。
  </p>
  <div v-else>
    <section v-for="poll in polls" :id="poll.slug" :key="poll.id" class="poll" :class="{ closed: poll.closed }">
      <div class="poll-meta">
        <span class="badge" :class="poll.closed ? 'badge-closed' : 'badge-open'">
          {{ poll.closed ? '締め切りました' : '受付中' }}
        </span>
        <span v-if="poll.closesAt" class="deadline">
          締め切り：{{ formatDate(poll.closesAt) }}
        </span>
      </div>

      <h3 class="poll-title">{{ poll.title }}</h3>
      <p v-if="poll.body" class="poll-body">{{ poll.body }}</p>

      <div v-if="showChoices(poll)" class="choices">
        <button
          v-for="(opt, i) in poll.options"
          :key="i"
          type="button"
          class="choice"
          :class="{ current: poll.myChoice === i }"
          :disabled="sending[poll.slug]"
          @click="vote(poll, i)"
        >
          {{ opt }}
        </button>
        <button
          v-if="poll.myChoice !== null"
          type="button"
          class="text-button"
          @click="editing[poll.slug] = false"
        >
          変更をやめる
        </button>
      </div>

      <div v-else-if="poll.results" class="results">
        <div
          v-for="(opt, i) in poll.options"
          :key="i"
          class="result-row"
          :class="{ mine: poll.myChoice === i }"
        >
          <div class="result-label">
            <span>
              {{ opt }}
              <span v-if="poll.myChoice === i" class="mine-tag">あなたの票</span>
            </span>
            <span class="result-num">{{ poll.results.counts[i] }}票（{{ percent(poll, i) }}%）</span>
          </div>
          <div class="bar">
            <div class="bar-fill" :style="{ width: percent(poll, i) + '%' }"></div>
          </div>
        </div>
        <div class="results-foot">
          <span>合計 {{ poll.results.total }}票</span>
          <button
            v-if="!poll.closed && poll.myChoice !== null"
            type="button"
            class="text-button"
            @click="editing[poll.slug] = true"
          >
            投票を変更する
          </button>
        </div>
      </div>

      <p v-if="messages[poll.slug]" class="poll-error">{{ messages[poll.slug] }}</p>
    </section>

    <p class="note">
      ※ 投票はブラウザごとに1票です。結果は投票すると見られます（締め切り後は誰でも見られます）。
    </p>
  </div>
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

.empty {
  color: var(--vp-c-text-2);
}

.poll {
  margin-top: 1.25rem;
  padding: 1.25rem;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  border-left: 3px solid var(--vp-c-brand-1);
  scroll-margin-top: calc(var(--vp-nav-height) + 16px);
}
.poll.closed {
  border-left-color: var(--vp-c-divider);
}

.poll-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  align-items: center;
  font-size: 0.85em;
}
.badge {
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  font-weight: bold;
}
.badge-open {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.badge-closed {
  background-color: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}
.deadline {
  color: var(--vp-c-text-2);
}

.vp-doc .poll-title {
  margin: 0.75rem 0 0;
  padding: 0;
  border: none;
}
.poll-body {
  margin: 0.75rem 0 0;
  white-space: pre-line;
  line-height: 1.7;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}
.choice {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  font-weight: bold;
  transition: background-color 0.2s, color 0.2s;
}
.choice:hover:not(:disabled),
.choice.current {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}
.choice:disabled {
  opacity: 0.5;
  cursor: wait;
}

.results {
  margin-top: 1rem;
}
.result-row + .result-row {
  margin-top: 0.75rem;
}
.result-label {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.95em;
}
.result-row.mine .result-label {
  font-weight: bold;
}
.mine-tag {
  margin-left: 0.4rem;
  padding: 0 0.4rem;
  border-radius: 4px;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.8em;
}
.result-num {
  flex-shrink: 0;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
}
.bar {
  height: 10px;
  margin-top: 0.3rem;
  border-radius: 999px;
  background-color: var(--vp-c-default-soft);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background-color: var(--vp-c-text-3);
  transition: width 0.4s;
}
.result-row.mine .bar-fill {
  background-color: var(--vp-c-brand-1);
}
.results-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}

.text-button {
  padding: 0.25rem 0.5rem;
  color: var(--vp-c-brand-1);
  font-size: 0.9em;
  text-decoration: underline;
}

.poll-error {
  margin: 0.75rem 0 0;
  color: var(--vp-c-danger-1, #ff5454);
  font-weight: bold;
}

.note {
  margin-top: 1.25rem;
  font-size: 0.85em;
  color: var(--vp-c-text-2);
}
</style>
