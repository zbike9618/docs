<template>
  <!-- トップの参加方法の下に出す、人数の簡易版。夜中に来た人が「誰もいない＝過疎」と思わないよう、
       いつ・何人くらい集まるかを先に見せる。取れないときは何も出さない（トップにエラーは出さない） -->
  <section v-if="view" class="kpa" aria-labelledby="kpa-title">
    <div class="kpa-text">
      <p class="kpa-kicker">PLAYERS</p>
      <h3 id="kpa-title" class="kpa-title">{{ view.headline }}</h3>
      <p v-if="view.windows" class="kpa-peak">にぎわう時間帯は <b>{{ view.windows }}</b></p>
      <p class="kpa-now" :class="view.busy ? 'busy' : 'quiet'">
        <span class="kpa-now-dot" aria-hidden="true"></span>{{ view.nowText }}
      </p>
    </div>

    <div ref="box" class="kpa-charts">
      <figure class="kpa-fig">
        <figcaption>直近7日間の人数</figcaption>
        <svg :width="chartW" :height="CH" :viewBox="`0 0 ${chartW} ${CH}`" role="img" :aria-label="trend.aria">
          <line :x1="0" :x2="chartW" :y1="CH - PB" :y2="CH - PB" class="kpa-base" />
          <path v-for="(d, i) in trend.areas" :key="'a' + i" :d="d" class="kpa-area" />
          <path v-for="(d, i) in trend.lines" :key="'l' + i" :d="d" class="kpa-line" />
          <g v-if="trend.peak">
            <circle :cx="trend.peak.x" :cy="trend.peak.y" r="3.5" class="kpa-dot" />
            <text :x="trend.peak.lx" :y="trend.peak.y - 7" :text-anchor="trend.peak.anchor" class="kpa-label">{{ trend.peak.v }}人</text>
          </g>
          <text v-for="t in trend.days" :key="'d' + t.x" :x="t.x" :y="CH - 3" class="kpa-axis">{{ t.label }}</text>
        </svg>
      </figure>

      <figure class="kpa-fig">
        <figcaption>{{ hours.caption }}</figcaption>
        <svg :width="chartW" :height="CH" :viewBox="`0 0 ${chartW} ${CH}`" role="img" :aria-label="hours.aria">
          <line :x1="0" :x2="chartW" :y1="CH - PB" :y2="CH - PB" class="kpa-base" />
          <path v-for="b in hours.bars" :key="'b' + b.h" :d="b.d" class="kpa-bar" :class="{ in: b.in }" />
          <g v-if="hours.now">
            <line :x1="hours.now.x" :x2="hours.now.x" :y1="PT - 2" :y2="CH - PB" class="kpa-now-line" />
            <text :x="hours.now.lx" :y="PT - 6" :text-anchor="hours.now.anchor" class="kpa-label">いま</text>
          </g>
          <text v-for="h in [0, 6, 12, 18]" :key="'h' + h" :x="hours.x(h)" :y="CH - 3" class="kpa-axis">{{ h }}時</text>
        </svg>
        <p class="kpa-legend"><i aria-hidden="true"></i>にぎわう時間帯</p>
      </figure>
    </div>

    <a class="kpa-link" :href="withBase('/players')">人数の推移とピークタイムをくわしく見る →</a>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { withBase } from 'vitepress'
import {
  fetchPlayerHistory, jstDate, DAYS_SUN, peakWindows, peakWindowsText, dailyPeaks, isWeekend, windowText
} from './players.js'

const CH = 104 // グラフの高さ
const PT = 20 // 上の余白（ラベルの分）
const PB = 18 // 下の余白（目盛りの分）
const REFRESH_MS = 5 * 60 * 1000

const data = ref(null)
const box = ref(null)
const chartW = ref(300)
const nowSec = ref(Math.floor(Date.now() / 1000))

const windows = computed(() => (data.value ? peakWindows(data.value.peakTime) : null))

const view = computed(() => {
  const h = data.value
  const w = windows.value
  if (!h || !w) return null
  const days = dailyPeaks(h.ranges?.['7d'], nowSec.value)
  const peak7 = h.ranges?.['7d']?.peak

  // 見出し: 直近1週間の1日ごとの最大人数（3日分そろわないうちは7日間の最大だけ）
  let headline
  if (days.length >= 3) {
    const lo = Math.min(...days.map((d) => d.max))
    const hi = Math.max(...days.map((d) => d.max))
    headline = lo === hi ? `毎日 最大${hi}人が同時にプレイ` : `毎日 最大${lo}〜${hi}人が同時にプレイ`
  } else if (peak7) {
    headline = `最近の最大は ${peak7.players}人が同時にプレイ`
  } else {
    return null
  }

  // いまの様子: にぎわう時間帯の中か、外なら次はいつごろからか
  const weekend = isWeekend(nowSec.value)
  const win = weekend ? w.weekend : w.weekday
  const hour = jstDate(nowSec.value).getUTCHours()
  const players = h.now?.players
  const busy = win.hours.includes(hour) || (players != null && players >= 3 && players >= win.avg * 0.5)
  const playing = players ? `（${players}人がプレイ中）` : ''
  let nowText
  if (busy) {
    nowText = `いまはにぎわう時間帯です${playing}`
  } else if (hour < win.start) {
    nowText = `いまは静かな時間帯です${playing}。いつも${win.start}時ごろから人が増えてきます`
  } else {
    const tomorrow = isWeekend(nowSec.value + 86400) ? w.weekend : w.weekday
    nowText = `いまは静かな時間帯です${playing}。明日は${tomorrow.start}時ごろから人が増えてきます`
  }

  return { headline, windows: peakWindowsText(w), busy, nowText }
})

// ---- 直近7日間（1時間ごとの最大）----
const trend = computed(() => {
  const r = data.value?.ranges?.['7d']
  const empty = { lines: [], areas: [], days: [], peak: null, aria: '' }
  if (!r) return empty
  const first = Math.max(0, r.max.findIndex((v) => v != null))
  const max = r.max.slice(first)
  const start = r.start + first * r.step
  const n = max.length
  const w = chartW.value
  const bottom = CH - PB
  const top = Math.max(4, ...max.filter((v) => v != null))
  const x = (i) => (n <= 1 ? w / 2 : 2 + (i * (w - 4)) / (n - 1))
  const y = (v) => bottom - (v / top) * (bottom - PT)

  const lines = []
  const areas = []
  let seg = []
  const flush = () => {
    if (seg.length > 1) {
      const d = seg.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
      lines.push(d)
      areas.push(`${d} L${seg[seg.length - 1][0].toFixed(1)},${bottom} L${seg[0][0].toFixed(1)},${bottom} Z`)
    }
    seg = []
  }
  let peak = null
  max.forEach((v, i) => {
    if (v == null) return flush()
    seg.push([x(i), y(v)])
    if (!peak || v >= peak.v) peak = { v, x: x(i), y: y(v) }
  })
  flush()
  if (peak) {
    peak.anchor = peak.x > w - 24 ? 'end' : peak.x < 24 ? 'start' : 'middle'
    peak.lx = peak.x
  }

  // 日ごとの曜日を、その日の真ん中に書く（幅が足りない日は書かない）
  const days = []
  for (let i = 0; i < n; i++) {
    const t = start + i * r.step
    if ((t + 9 * 3600) % 86400 !== 12 * 3600) continue
    const label = DAYS_SUN[jstDate(t).getUTCDay()]
    days.push({ x: x(i), label })
  }

  return {
    lines,
    areas,
    days: days.filter((d) => d.x > 8 && d.x < w - 8),
    peak,
    aria: `直近7日間の人数の折れ線グラフ。${peak ? `最大は${peak.v}人。` : ''}毎日、夜に向けて人数が増えています。`
  }
})

// ---- 今日（平日か土日か）の時間帯ごとの平均 ----
function barPath(x, y, w, h) {
  const r = Math.min(3, w / 2, h)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

const hours = computed(() => {
  const w = windows.value
  const weekend = isWeekend(nowSec.value)
  const profile = w ? (weekend ? w.profiles.weekend : w.profiles.weekday) : Array(24).fill(null)
  const win = w ? (weekend ? w.weekend : w.weekday) : null
  const cw = chartW.value
  const bottom = CH - PB
  const slot = cw / 24
  const barW = Math.max(3, Math.min(12, slot - 2))
  const top = Math.max(4, ...profile.map((v) => v || 0))
  const x = (h) => slot * h + slot / 2
  const bars = profile
    .map((v, h) => {
      const bh = v ? (v / top) * (bottom - PT) : 0
      return { h, in: Boolean(win?.hours.includes(h)), d: bh > 0.5 ? barPath(x(h) - barW / 2, bottom - bh, barW, bh) : '' }
    })
    .filter((b) => b.d)
  const hour = jstDate(nowSec.value).getUTCHours()
  const nx = x(hour)
  const now = { x: nx, lx: nx, anchor: nx > cw - 16 ? 'end' : nx < 16 ? 'start' : 'middle' }
  const label = w?.same ? '時間帯ごとの平均人数' : weekend ? '土日の時間帯ごとの平均人数' : '平日の時間帯ごとの平均人数'
  return {
    x,
    bars,
    now,
    caption: label,
    aria: `${label}の棒グラフ。${win ? `にぎわうのは${windowText(win)}ごろ。` : ''}`
  }
})

// ---- 取得と大きさの追従 ----
let timer = null
let observer = null

async function load() {
  if (data.value && document.hidden) return
  try {
    data.value = await fetchPlayerHistory()
    nowSec.value = Math.floor(Date.now() / 1000)
    await nextTick()
    if (box.value && !observer) {
      const measure = () => {
        // 2つのグラフが横に並ぶか縦に並ぶかで幅が変わる。1つ目の figure の幅に合わせる
        const fig = box.value?.querySelector('.kpa-fig')
        if (fig) chartW.value = Math.max(200, Math.round(fig.clientWidth))
      }
      measure()
      observer = new ResizeObserver(measure)
      observer.observe(box.value)
    }
  } catch (e) {
    // トップでは何も出さない（前に取れていれば、それを出し続ける）
    console.warn('プレイヤー数を取得できませんでした', e)
  }
}

function onVisible() {
  if (!document.hidden) load()
}

onMounted(() => {
  load()
  timer = setInterval(load, REFRESH_MS)
  document.addEventListener('visibilitychange', onVisible)
})

onUnmounted(() => {
  clearInterval(timer)
  observer?.disconnect()
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
/* 参加方法の欄（暗い背景）に合わせる。ライトモードは下で上書き */
.kpa {
  --kpa-bg: #0f1d2f;
  --kpa-border: #2b3b51;
  --kpa-text: #ffffff;
  --kpa-muted: #8997ab;
  --kpa-faint: #5f6f86;
  --kpa-line: #ea648c;
  --kpa-area: rgba(234, 100, 140, 0.14);
  --kpa-bar-out: #3a4a62;
  --kpa-busy: #50d890;
  --kpa-quiet: #d5aa5c;
  margin-top: 12px;
  padding: 22px 24px 18px;
  border: 1px solid var(--kpa-border);
  background: var(--kpa-bg);
  color: var(--kpa-text);
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px 32px;
  align-items: center;
}
html:not(.dark) .kpa {
  --kpa-bg: #faf8f4;
  --kpa-border: #e1ddd5;
  --kpa-text: #172033;
  --kpa-muted: #5d6675;
  --kpa-faint: #8a909b;
  --kpa-line: #c83c62;
  --kpa-area: rgba(200, 60, 98, 0.1);
  --kpa-bar-out: #e4ddd2;
  --kpa-busy: #1f8a52;
  --kpa-quiet: #a4761f;
}

/* 日本語を文節で折り返す（「〜24時ご / ろ」のように切らない。対応していないブラウザでは普通に折り返す） */
.kpa-text { word-break: auto-phrase; }
.kpa-kicker { color: #ef7596; font-size: 11px; font-weight: 800; letter-spacing: 0.22em; }
html:not(.dark) .kpa-kicker { color: var(--k-pink); }
.kpa .kpa-title { margin-top: 6px; color: var(--kpa-text); border: 0; font-size: clamp(20px, 2.4vw, 26px); line-height: 1.4; font-weight: 900; letter-spacing: -0.02em; }
.kpa-peak { margin-top: 8px; color: var(--kpa-muted); font-size: 14px; line-height: 1.7; }
.kpa-peak b { color: var(--kpa-text); }
.kpa-now { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; color: var(--kpa-muted); font-size: 13px; line-height: 1.7; }
.kpa-now-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; transform: translateY(-1px); }
.kpa-now.busy .kpa-now-dot { background: var(--kpa-busy); }
.kpa-now.quiet .kpa-now-dot { background: var(--kpa-quiet); }

.kpa-charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.kpa-fig { margin: 0; min-width: 0; }
.kpa-fig figcaption { color: var(--kpa-muted); font-size: 11px; margin-bottom: 2px; }
.kpa-fig svg { display: block; width: 100%; height: auto; overflow: visible; }
.kpa-base { stroke: var(--kpa-border); stroke-width: 1; }
.kpa-line { fill: none; stroke: var(--kpa-line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.kpa-area { fill: var(--kpa-area); }
.kpa-dot { fill: var(--kpa-line); stroke: var(--kpa-bg); stroke-width: 2; }
.kpa-bar { fill: var(--kpa-bar-out); }
.kpa-bar.in { fill: var(--kpa-line); }
.kpa-now-line { stroke: var(--kpa-muted); stroke-width: 1; }
.kpa-label { fill: var(--kpa-text); font-size: 11px; font-weight: 700; }
.kpa-axis { fill: var(--kpa-faint); font-size: 10px; text-anchor: middle; }
.kpa-legend { display: flex; align-items: center; gap: 6px; margin-top: 4px; color: var(--kpa-muted); font-size: 11px; }
.kpa-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--kpa-line); }

.kpa-link { grid-column: 1 / -1; justify-self: start; color: #ef7596; font-size: 13px; font-weight: 700; }
html:not(.dark) .kpa-link { color: var(--k-pink); }
.kpa-link:hover { text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 900px) {
  .kpa { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .kpa { padding: 16px 14px 14px; }
  .kpa-charts { grid-template-columns: 1fr; gap: 14px; }
  .kpa-peak { font-size: 13px; }
}
</style>
