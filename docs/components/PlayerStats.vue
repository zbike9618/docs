<template>
  <div class="k-players" :class="{ stale: refreshing }">
    <p v-if="!data && state === 'loading'" class="kp-status">読み込み中…</p>
    <p v-else-if="!data" class="kp-status kp-error">
      プレイヤー数を取得できませんでした。少し時間をおいてから、もう一度開いてください。
    </p>

    <template v-if="data">
      <!-- いまの人数と最大 -->
      <div class="kp-tiles">
        <div class="kp-tile">
          <span class="kp-tile-label">いまオンライン</span>
          <strong class="kp-tile-value">{{ nowTile.value }}</strong>
          <span class="kp-tile-sub">{{ nowTile.sub }}</span>
        </div>
        <div v-for="t in peakTiles" :key="t.label" class="kp-tile">
          <span class="kp-tile-label">{{ t.label }}</span>
          <strong class="kp-tile-value">{{ t.value }}</strong>
          <span class="kp-tile-sub">{{ t.sub }}</span>
        </div>
      </div>

      <!-- 人数の推移 -->
      <h2 id="trend" tabindex="-1">人数の推移</h2>
      <div class="kp-tabs" role="group" aria-label="グラフの期間">
        <button
          v-for="r in RANGE_OPTIONS"
          :key="r.key"
          type="button"
          :aria-pressed="range === r.key"
          @click="range = r.key"
        >{{ r.label }}</button>
      </div>

      <div class="kp-card">
        <div class="kp-card-head">
          <span>{{ rangeOption.caption }}</span>
          <span v-if="trend.trimmed" class="kp-dim">記録は {{ sinceText }} から</span>
        </div>
        <div ref="trendBox" class="kp-chart" @pointerleave="onTrendLeave">
          <svg
            :width="width"
            :height="TREND_H"
            :viewBox="`0 0 ${width} ${TREND_H}`"
            class="kp-svg"
            tabindex="0"
            role="img"
            :aria-label="trendAria"
            @pointermove="onTrendPointer"
            @pointerdown="onTrendPointer"
            @keydown="onTrendKey"
            @blur="hover = null"
          >
            <g class="kp-grid">
              <line v-for="t in trend.yTicks" :key="'g' + t.v" :x1="TP.l" :x2="width - TP.r" :y1="t.y" :y2="t.y" />
            </g>
            <g class="kp-axis-y">
              <text v-for="t in trend.yTicks" :key="'y' + t.v" :x="TP.l - 8" :y="t.y + 4">{{ t.v }}</text>
            </g>
            <g class="kp-axis-x">
              <line :x1="TP.l" :x2="width - TP.r" :y1="TREND_H - TP.b" :y2="TREND_H - TP.b" class="kp-baseline" />
              <template v-for="t in trend.xTicks" :key="'x' + t.i">
                <line :x1="t.x" :x2="t.x" :y1="TREND_H - TP.b" :y2="TREND_H - TP.b + 4" class="kp-baseline" />
                <text :x="t.x" :y="TREND_H - 6">{{ t.label }}</text>
              </template>
            </g>
            <path v-for="(p, i) in trend.areas" :key="'a' + i" :d="p" class="kp-area" />
            <path v-for="(p, i) in trend.lines" :key="'l' + i" :d="p" class="kp-line" />
            <circle v-for="(d, i) in trend.dots" :key="'d' + i" :cx="d.x" :cy="d.y" r="2" class="kp-dot-small" />

            <g v-if="trend.peak" class="kp-peak">
              <circle :cx="trend.peak.x" :cy="trend.peak.y" r="4" class="kp-dot" />
              <text :x="trend.peak.lx" :y="trend.peak.y - 10" :text-anchor="trend.peak.anchor">最大 {{ trend.peak.v }}人</text>
            </g>

            <g v-if="hoverPoint" class="kp-cross">
              <line :x1="hoverPoint.x" :x2="hoverPoint.x" :y1="TP.t" :y2="TREND_H - TP.b" />
              <circle v-if="hoverPoint.y != null" :cx="hoverPoint.x" :cy="hoverPoint.y" r="4" class="kp-dot" />
            </g>
          </svg>
          <div v-if="hoverPoint" class="kp-tip" :style="tipStyle(hoverPoint.x, width)">
            <span class="kp-tip-time">{{ hoverPoint.time }}</span>
            <template v-if="hoverPoint.max != null">
              <strong>最大 {{ hoverPoint.max }}人</strong>
              <span class="kp-tip-sub">平均 {{ hoverPoint.avg }}人</span>
            </template>
            <span v-else class="kp-tip-sub">記録なし</span>
          </div>
        </div>
      </div>

      <!-- ピークタイム -->
      <h2 id="peak" tabindex="-1">ピークタイム</h2>
      <p v-if="peakSummary" class="kp-lead">
        <template v-if="peakSummary.windows">にぎわう時間帯は <b>{{ peakSummary.windows }}</b> です。</template>
        直近{{ peakSummary.days }}日間で一番多いのは {{ peakSummary.hour }}時台（平均 {{ peakSummary.hourAvg }}人）、
        曜日まで分けると {{ peakSummary.cellDay }}曜の{{ peakSummary.cellHour }}時台（平均 {{ peakSummary.cellAvg }}人）でした。
      </p>
      <p v-else class="kp-lead">まだ記録が足りません。</p>

      <div class="kp-card">
        <div class="kp-card-head"><span>時間帯ごとの平均人数</span></div>
        <div ref="hourBox" class="kp-chart" @pointerleave="hourHover = null">
          <svg
            :width="width"
            :height="HOUR_H"
            :viewBox="`0 0 ${width} ${HOUR_H}`"
            class="kp-svg"
            role="img"
            :aria-label="hourAria"
          >
            <g class="kp-grid">
              <line v-for="t in hours.yTicks" :key="'g' + t.v" :x1="TP.l" :x2="width - TP.r" :y1="t.y" :y2="t.y" />
            </g>
            <g class="kp-axis-y">
              <text v-for="t in hours.yTicks" :key="'y' + t.v" :x="TP.l - 8" :y="t.y + 4">{{ t.v }}</text>
            </g>
            <g class="kp-axis-x">
              <line :x1="TP.l" :x2="width - TP.r" :y1="HOUR_H - TP.b" :y2="HOUR_H - TP.b" class="kp-baseline" />
              <text v-for="b in hours.bars.filter((b) => b.h % 3 === 0)" :key="'x' + b.h" :x="b.cx" :y="HOUR_H - 6">{{ b.h }}時</text>
            </g>
            <g v-for="b in hours.bars" :key="'b' + b.h">
              <path v-if="b.d" :d="b.d" class="kp-bar" :class="{ on: hourHover === b.h }" />
              <rect
                :x="b.slotX"
                :y="TP.t"
                :width="b.slotW"
                :height="HOUR_H - TP.t - TP.b"
                class="kp-hit"
                @pointerenter="hourHover = b.h"
                @pointerdown="hourHover = b.h"
              />
            </g>
            <text v-if="hours.peak" :x="hours.peak.cx" :y="hours.peak.y - 6" text-anchor="middle" class="kp-bar-label">{{ hours.peak.avg }}</text>
          </svg>
          <div v-if="hourHoverInfo" class="kp-tip" :style="tipStyle(hourHoverInfo.cx, width)">
            <span class="kp-tip-time">{{ hourHoverInfo.h }}時台</span>
            <template v-if="hourHoverInfo.avg != null">
              <strong>平均 {{ hourHoverInfo.avg }}人</strong>
              <span class="kp-tip-sub">最大 {{ hourHoverInfo.max }}人</span>
            </template>
            <span v-else class="kp-tip-sub">記録なし</span>
          </div>
        </div>
      </div>

      <div class="kp-card">
        <div class="kp-card-head"><span>曜日 × 時間帯の平均人数</span></div>
        <div class="kp-heat-wrap" @pointerleave="cellHover = null">
          <div class="kp-heat" role="img" :aria-label="heatAria">
            <span class="kp-heat-corner" aria-hidden="true"></span>
            <span v-for="h in 24" :key="'hh' + h" class="kp-heat-hour" aria-hidden="true">{{ (h - 1) % 3 === 0 ? h - 1 : '' }}</span>
            <template v-for="(row, d) in heat.rows" :key="'r' + d">
              <span class="kp-heat-day" aria-hidden="true">{{ DAYS_MON[d] }}</span>
              <span
                v-for="(c, h) in row"
                :key="'c' + d + '-' + h"
                class="kp-heat-cell"
                :class="{ now: c.now, on: cellHover && cellHover.d === d && cellHover.h === h }"
                :style="{ background: c.bin < 0 ? 'var(--kp-heat-empty)' : `var(--kp-heat-${c.bin})` }"
                aria-hidden="true"
                @pointerenter="cellHover = { d, h }"
                @pointerdown="cellHover = { d, h }"
              ></span>
            </template>
          </div>
          <div v-if="cellHoverInfo" class="kp-tip kp-tip-heat" :style="heatTipStyle">
            <span class="kp-tip-time">{{ DAYS_MON[cellHoverInfo.d] }}曜 {{ cellHoverInfo.h }}時台</span>
            <template v-if="cellHoverInfo.avg != null">
              <strong>平均 {{ cellHoverInfo.avg }}人</strong>
              <span class="kp-tip-sub">最大 {{ cellHoverInfo.max }}人</span>
            </template>
            <span v-else class="kp-tip-sub">記録なし</span>
          </div>
        </div>
        <div class="kp-heat-legend">
          <span>少ない</span>
          <i v-for="n in 6" :key="'lg' + n" :style="{ background: `var(--kp-heat-${n - 1})` }"></i>
          <span>多い（平均 {{ heat.vmax }}人）</span>
          <span class="kp-legend-now"><i class="kp-now-key"></i>いま</span>
        </div>
      </div>

      <details class="kp-table">
        <summary>数値を表で見る（曜日 × 時間帯の平均人数）</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">時間帯</th>
              <th v-for="d in DAYS_MON" :key="'th' + d" scope="col">{{ d }}</th>
              <th scope="col">全体</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in 24" :key="'tr' + h">
              <th scope="row">{{ h - 1 }}時台</th>
              <td v-for="(row, d) in data.peakTime.weekly" :key="'td' + d + h">{{ fmtAvg(row[h - 1]) }}</td>
              <td>{{ fmtAvg(data.peakTime.hourly[h - 1]) }}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <p class="kp-note">
        1分ごとにサーバーの人数を記録しています（時刻は日本時間）。推移のグラフは区間ごとの最大人数、ピークタイムは直近4週間の平均人数です。
        サーバーの再起動中は記録が途切れます。記録は {{ sinceText }} から。
      </p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { fetchPlayerHistory, JST, DAYS_MON, jstDate, md, wd, hm, peakWindows, peakWindowsText } from './players.js'

const REFRESH_MS = 60000

const RANGE_OPTIONS = [
  { key: '24h', label: '24時間', caption: '直近24時間（10分ごとの最大人数）' },
  { key: '7d', label: '7日間', caption: '直近7日間（1時間ごとの最大人数）' },
  { key: '30d', label: '30日間', caption: '直近30日間（3時間ごとの最大人数）' }
]

// グラフの余白（左は目盛りの数字の分）
const TP = { l: 34, r: 14, t: 22, b: 26 }
const TREND_H = 230
const HOUR_H = 190

const data = ref(null)
const state = ref('loading') // loading | ok | error
const refreshing = ref(false)
const range = ref('24h')
const width = ref(640)
const trendBox = ref(null)
const hourBox = ref(null)
const hover = ref(null) // 推移グラフで指している区間の番号
const hourHover = ref(null)
const cellHover = ref(null)

// ---- 時刻の表示（閲覧者の端末の時間帯に関係なく日本時間で出す）----
const dayTime = (sec) => {
  const d = jstDate(sec)
  return `${md(d)}(${wd(d)}) ${hm(d)}`
}
const fmtAvg = (c) => (c && c.avg != null ? c.avg.toFixed(1) : '-')

const sinceText = computed(() => {
  if (!data.value?.since) return '--'
  const d = jstDate(data.value.since)
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`
})

// ---- いまの人数・最大 ----
const nowTile = computed(() => {
  const n = data.value?.now
  if (!n) return { value: '--', sub: '記録が途切れています' }
  if (n.players == null) return { value: '停止中', sub: '再起動中か、停止しています' }
  return { value: `${n.players}人`, sub: `最大 ${n.maxPlayers}人 ・ ${hm(jstDate(n.at))} 時点` }
})

const peakTiles = computed(() => {
  const r = data.value?.ranges || {}
  return [
    { label: '直近24時間の最大', peak: r['24h']?.peak },
    { label: '直近7日間の最大', peak: r['7d']?.peak }
  ].map(({ label, peak }) => ({
    label,
    value: peak ? `${peak.players}人` : '--',
    sub: peak ? dayTime(peak.at) : '記録なし'
  }))
})

// ---- 目盛り ----
function niceTicks(maxV, plotTop, plotBottom) {
  const m = Math.max(maxV || 0, 4)
  const step = [1, 2, 5, 10, 20, 50, 100].find((s) => m / s <= 5) || 200
  const top = Math.ceil(m / step) * step
  const ticks = []
  for (let v = 0; v <= top; v += step) {
    ticks.push({ v, y: plotBottom - (v / top) * (plotBottom - plotTop) })
  }
  return { top, ticks }
}

// 近すぎる目盛りの文字は間引く
function thin(ticks, minGap) {
  const out = []
  for (const t of ticks) {
    if (!out.length || t.x - out[out.length - 1].x >= minGap) out.push(t)
  }
  return out
}

function bucketLabel(start, step) {
  const d = jstDate(start)
  const e = jstDate(start + step)
  if (step < 3600) return `${md(d)}(${wd(d)}) ${hm(d)}〜${hm(e)}`
  if (step === 3600) return `${md(d)}(${wd(d)}) ${d.getUTCHours()}時台`
  return `${md(d)}(${wd(d)}) ${d.getUTCHours()}〜${e.getUTCHours() || 24}時`
}

const rangeOption = computed(() => RANGE_OPTIONS.find((r) => r.key === range.value))

// ---- 推移グラフ ----
const trend = computed(() => {
  const empty = { yTicks: [], xTicks: [], lines: [], areas: [], dots: [], peak: null, points: [], trimmed: false }
  const r = data.value?.ranges?.[range.value]
  if (!r) return empty

  // 記録が始まる前の区間は描かない（空白が広がって壊れて見えるため）
  let first = r.max.findIndex((v) => v != null)
  if (first < 0) first = r.max.length - 1
  const trimmed = first > 0 && data.value.since > r.start
  if (!trimmed) first = 0
  const max = r.max.slice(first)
  const avg = r.avg.slice(first)
  const start = r.start + first * r.step
  const n = max.length

  const w = width.value
  const plotW = w - TP.l - TP.r
  const bottom = TREND_H - TP.b
  const { top, ticks } = niceTicks(Math.max(...max.filter((v) => v != null), 0), TP.t, bottom)
  const x = (i) => TP.l + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const y = (v) => bottom - (v / top) * (bottom - TP.t)

  const points = max.map((v, i) => ({
    x: x(i),
    y: v == null ? null : y(v),
    max: v,
    avg: avg[i],
    time: bucketLabel(start + i * r.step, r.step)
  }))

  // 記録が途切れたところで線を切る
  const lines = []
  const areas = []
  const dots = []
  let seg = []
  const flush = () => {
    if (seg.length === 1) dots.push(seg[0])
    if (seg.length > 1) {
      const d = seg.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      lines.push(d)
      areas.push(`${d} L${seg[seg.length - 1].x.toFixed(1)},${bottom} L${seg[0].x.toFixed(1)},${bottom} Z`)
    }
    seg = []
  }
  points.forEach((p) => (p.y == null ? flush() : seg.push(p)))
  flush()

  // 目盛り: 24時間は3時間ごと、それより長い範囲は日付（0時）ごと
  const xTicks = []
  for (let i = 0; i < n; i++) {
    const t = start + i * r.step
    const d = jstDate(t)
    if (range.value === '24h') {
      if ((t + JST) % 10800 === 0) xTicks.push({ i, x: x(i), label: d.getUTCHours() === 0 ? md(d) : `${d.getUTCHours()}時` })
    } else if ((t + JST) % 86400 === 0) {
      xTicks.push({ i, x: x(i), label: range.value === '7d' ? `${md(d)}(${wd(d)})` : md(d) })
    }
  }

  // 範囲の中で一番多かった区間に印と数字を付ける（数字を付けるのはここだけ）
  let peak = null
  points.forEach((p) => {
    if (p.max != null && (!peak || p.max > peak.v)) peak = { v: p.max, x: p.x, y: p.y }
  })
  if (peak) {
    peak.anchor = peak.x > w - 70 ? 'end' : peak.x < TP.l + 40 ? 'start' : 'middle'
    peak.lx = peak.anchor === 'end' ? peak.x + 4 : peak.anchor === 'start' ? peak.x - 4 : peak.x
  }

  return {
    yTicks: ticks,
    xTicks: thin(xTicks, range.value === '7d' ? 62 : 44),
    lines,
    areas,
    dots,
    peak,
    points,
    trimmed
  }
})

const hoverPoint = computed(() => (hover.value == null ? null : trend.value.points[hover.value] || null))

const trendAria = computed(() => {
  const p = trend.value.peak
  return `${rangeOption.value.caption}の折れ線グラフ。${p ? `最大は${p.v}人。` : ''}値は矢印キーでも確かめられます。`
})

function onTrendPointer(ev) {
  const n = trend.value.points.length
  if (!n) return
  const rect = ev.currentTarget.getBoundingClientRect()
  const px = ev.clientX - rect.left
  const plotW = width.value - TP.l - TP.r
  const i = n <= 1 ? 0 : Math.round(((px - TP.l) / plotW) * (n - 1))
  hover.value = Math.min(n - 1, Math.max(0, i))
}
function onTrendLeave() {
  if (document.activeElement !== trendBox.value?.querySelector('svg')) hover.value = null
}
function onTrendKey(ev) {
  const n = trend.value.points.length
  if (!n) return
  if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
    ev.preventDefault()
    const cur = hover.value == null ? n - 1 : hover.value + (ev.key === 'ArrowLeft' ? -1 : 1)
    hover.value = Math.min(n - 1, Math.max(0, cur))
  } else if (ev.key === 'Home' || ev.key === 'End') {
    ev.preventDefault()
    hover.value = ev.key === 'Home' ? 0 : n - 1
  } else if (ev.key === 'Escape') {
    hover.value = null
  }
}
watch(range, () => { hover.value = null })

// 吹き出しはグラフの上の端に、指している位置の横（右半分では左側）に出す。線や見出しに重ねない
function tipStyle(x, w) {
  return x > w / 2 ? { right: `${Math.round(w - x + 10)}px` } : { left: `${Math.round(x + 10)}px` }
}

// ---- 時間帯ごとの平均（棒グラフ）----
function barPath(x, y, w, h) {
  const r = Math.min(4, w / 2, h)
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}

const hours = computed(() => {
  const list = data.value?.peakTime?.hourly || Array(24).fill(null)
  const w = width.value
  const plotW = w - TP.l - TP.r
  const bottom = HOUR_H - TP.b
  const { top, ticks } = niceTicks(Math.max(...list.map((c) => (c ? c.avg : 0))), TP.t, bottom)
  const slotW = plotW / 24
  const barW = Math.min(24, Math.max(4, slotW - 4))
  let peak = null
  const bars = list.map((c, h) => {
    const slotX = TP.l + h * slotW
    const cx = slotX + slotW / 2
    const v = c ? c.avg : null
    const bh = v ? (v / top) * (bottom - TP.t) : 0
    const y = bottom - bh
    const bar = { h, cx, slotX, slotW, y, avg: v, max: c ? c.max : null, d: bh > 0.5 ? barPath(cx - barW / 2, y, barW, bh) : null }
    if (v != null && (!peak || v > peak.avg)) peak = bar
    return bar
  })
  return { yTicks: ticks, bars, peak: peak ? { ...peak, avg: peak.avg.toFixed(1) } : null }
})

const hourHoverInfo = computed(() => (hourHover.value == null ? null : hours.value.bars[hourHover.value]))

const hourAria = computed(() => {
  const p = hours.value.peak
  return `時間帯ごとの平均人数の棒グラフ。${p ? `一番多いのは${p.h}時台で平均${p.avg}人。` : ''}数値は下の表にもあります。`
})

// ---- 曜日 × 時間帯（ヒートマップ）----
const heat = computed(() => {
  const weekly = data.value?.peakTime?.weekly || Array.from({ length: 7 }, () => Array(24).fill(null))
  const vmax = Math.max(0, ...weekly.flat().map((c) => (c ? c.avg : 0)))
  // いまの曜日（月曜 = 0）と時間（日本時間）
  const nowD = jstDate(Math.floor(Date.now() / 1000))
  const nowDow = (nowD.getUTCDay() + 6) % 7
  const nowHour = nowD.getUTCHours()
  const rows = weekly.map((row, d) =>
    row.map((c, h) => ({
      bin: !c || c.avg == null ? -1 : vmax <= 0 ? 0 : Math.min(5, Math.max(0, Math.ceil((c.avg / vmax) * 6) - 1)),
      now: d === nowDow && h === nowHour
    }))
  )
  return { rows, vmax: vmax.toFixed(1) }
})

const cellHoverInfo = computed(() => {
  if (!cellHover.value) return null
  const { d, h } = cellHover.value
  const c = data.value?.peakTime?.weekly?.[d]?.[h]
  return { d, h, avg: c ? c.avg.toFixed(1) : null, max: c ? c.max : null }
})

// ヒートマップの吹き出しは、指しているマスの上に出す（列の位置は割合で決まる）
const heatTipStyle = computed(() => {
  if (!cellHover.value) return {}
  const { d, h } = cellHover.value
  const pct = ((h + 0.5) / 24) * 100
  return {
    left: `clamp(80px, calc(var(--kp-day-w) + (100% - var(--kp-day-w)) * ${pct / 100}), calc(100% - 80px))`,
    top: `calc(var(--kp-head-h) + ${d} * (var(--kp-cell-h) + 2px) - 8px)`
  }
})

const peakSummary = computed(() => {
  const p = data.value?.peakTime
  if (!p || !p.days) return null
  let hour = null
  p.hourly.forEach((c, h) => {
    if (c && c.avg != null && (!hour || c.avg > hour.avg)) hour = { h, avg: c.avg }
  })
  let cell = null
  p.weekly.forEach((row, d) =>
    row.forEach((c, h) => {
      if (c && c.avg != null && (!cell || c.avg > cell.avg)) cell = { d, h, avg: c.avg }
    })
  )
  if (!hour || !cell) return null
  return {
    windows: peakWindowsText(peakWindows(p)),
    days: p.days,
    hour: hour.h,
    hourAvg: hour.avg.toFixed(1),
    cellDay: DAYS_MON[cell.d],
    cellHour: cell.h,
    cellAvg: cell.avg.toFixed(1)
  }
})

const heatAria = computed(() => {
  const s = peakSummary.value
  return `曜日と時間帯ごとの平均人数の表。${s ? `一番多いのは${s.cellDay}曜の${s.cellHour}時台で平均${s.cellAvg}人。` : ''}数値は下の「数値を表で見る」にあります。`
})

// ---- 取得と大きさの追従 ----
let timer = null
let observer = null

async function load() {
  if (data.value && document.hidden) return
  refreshing.value = Boolean(data.value)
  try {
    data.value = await fetchPlayerHistory()
    state.value = 'ok'
    await nextTick()
    observe()
  } catch (e) {
    // 取れなかったときは前の表示を残す
    console.error('プレイヤー数の取得に失敗しました', e)
    if (!data.value) state.value = 'error'
  } finally {
    refreshing.value = false
  }
}

function observe() {
  const el = trendBox.value
  if (!el || observer) return
  width.value = Math.max(280, Math.round(el.clientWidth))
  observer = new ResizeObserver(([entry]) => {
    width.value = Math.max(280, Math.round(entry.contentRect.width))
  })
  observer.observe(el)
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
.k-players {
  --kp-line: #c83c62;
  --kp-area: rgba(200, 60, 98, 0.1);
  --kp-heat-0: #fee3e9;
  --kp-heat-1: #fabecc;
  --kp-heat-2: #ef96ac;
  --kp-heat-3: #df698b;
  --kp-heat-4: #c03d69;
  --kp-heat-5: #93234c;
  --kp-heat-empty: var(--vp-c-default-soft);
  --kp-surface: var(--vp-c-bg-soft);
  --kp-day-w: 26px;
  --kp-head-h: 18px;
  --kp-cell-h: 20px;
  margin-top: 8px;
  transition: opacity 0.2s;
}
.dark .k-players {
  --kp-line: #ea648c;
  --kp-area: rgba(234, 100, 140, 0.12);
  --kp-heat-0: #482830;
  --kp-heat-1: #743647;
  --kp-heat-2: #a44360;
  --kp-heat-3: #d1557b;
  --kp-heat-4: #ec7c9a;
  --kp-heat-5: #faafc0;
}
/* 取り直している間は前の表示を少し薄くして残す（ちらつかせない） */
.k-players.stale .kp-card { opacity: 0.7; }

.kp-status { padding: 16px; border-radius: 8px; background: var(--kp-surface); color: var(--vp-c-text-2); }
.kp-error { color: var(--vp-c-danger-1); }

/* いまの人数・最大 */
.kp-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 8px; }
.kp-tile { display: flex; flex-direction: column; gap: 2px; padding: 14px 16px; border-radius: 8px; background: var(--kp-surface); }
.kp-tile-label { color: var(--vp-c-text-2); font-size: 13px; }
.kp-tile-value { color: var(--vp-c-text-1); font-size: 28px; line-height: 1.25; font-weight: 700; }
.kp-tile-sub { color: var(--vp-c-text-3); font-size: 12px; }

/* 期間の切り替え */
.kp-tabs { display: inline-flex; gap: 2px; padding: 3px; margin: 4px 0 12px; border-radius: 8px; background: var(--kp-surface); }
.kp-tabs button { padding: 5px 14px; border-radius: 6px; color: var(--vp-c-text-2); font-size: 14px; font-weight: 600; }
.kp-tabs button:hover { color: var(--vp-c-text-1); }
.kp-tabs button[aria-pressed='true'] { color: var(--vp-c-text-1); background: var(--vp-c-bg); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }

.kp-card { margin: 0 0 16px; padding: 14px 16px 10px; border-radius: 8px; background: var(--kp-surface); transition: opacity 0.2s; }
.kp-card-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; color: var(--vp-c-text-2); font-size: 13px; margin-bottom: 6px; }
.kp-dim { color: var(--vp-c-text-3); }

.kp-chart { position: relative; }
.kp-svg { display: block; width: 100%; height: auto; overflow: visible; touch-action: pan-y; }
.kp-svg:focus { outline: none; }
.kp-svg:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 4px; border-radius: 4px; }

.kp-grid line { stroke: var(--vp-c-divider); stroke-width: 1; }
.kp-baseline { stroke: var(--vp-c-border); stroke-width: 1; }
.kp-axis-y text { fill: var(--vp-c-text-3); font-size: 11px; text-anchor: end; font-variant-numeric: tabular-nums; }
.kp-axis-x text { fill: var(--vp-c-text-3); font-size: 11px; text-anchor: middle; font-variant-numeric: tabular-nums; }

.kp-line { fill: none; stroke: var(--kp-line); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.kp-area { fill: var(--kp-area); stroke: none; }
.kp-dot { fill: var(--kp-line); stroke: var(--kp-surface); stroke-width: 2; }
.kp-dot-small { fill: var(--kp-line); }
.kp-peak text { fill: var(--vp-c-text-1); font-size: 12px; font-weight: 700; }
.kp-cross line { stroke: var(--vp-c-text-3); stroke-width: 1; }

.kp-bar { fill: var(--kp-line); transition: opacity 0.15s; }
.kp-bar.on { opacity: 0.75; }
.kp-bar-label { fill: var(--vp-c-text-1); font-size: 12px; font-weight: 700; }
.kp-hit { fill: transparent; cursor: default; }

.kp-tip {
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-width: 120px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  white-space: nowrap;
}
.kp-tip-time { color: var(--vp-c-text-2); font-size: 12px; }
.kp-tip strong { color: var(--vp-c-text-1); font-size: 16px; line-height: 1.3; }
.kp-tip-sub { color: var(--vp-c-text-2); font-size: 12px; }

/* ヒートマップ */
.kp-heat-wrap { position: relative; }
.kp-heat {
  display: grid;
  grid-template-columns: var(--kp-day-w) repeat(24, minmax(0, 1fr));
  grid-auto-rows: var(--kp-cell-h);
  grid-template-rows: var(--kp-head-h);
  gap: 2px;
}
.kp-heat-hour { color: var(--vp-c-text-3); font-size: 11px; line-height: var(--kp-head-h); white-space: nowrap; overflow: visible; }
.kp-heat-day { color: var(--vp-c-text-2); font-size: 12px; line-height: var(--kp-cell-h); }
.kp-heat-cell { border-radius: 3px; }
.kp-heat-cell.on { box-shadow: inset 0 0 0 2px var(--vp-c-text-1); }
.kp-heat-cell.now { box-shadow: inset 0 0 0 2px var(--vp-c-text-2); }
.kp-heat-cell.now.on { box-shadow: inset 0 0 0 2px var(--vp-c-text-1); }
.kp-tip-heat { transform: translate(-50%, -100%); }

.kp-heat-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 10px; color: var(--vp-c-text-2); font-size: 12px; }
.kp-heat-legend > i { display: inline-block; width: 18px; height: 12px; border-radius: 3px; }
.kp-heat-legend > span:first-child { margin-right: 4px; }
.kp-heat-legend > span:nth-of-type(2) { margin-left: 4px; }
.kp-legend-now { display: inline-flex; align-items: center; gap: 4px; margin-left: 12px; }
.kp-now-key { display: inline-block; width: 14px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 2px var(--vp-c-text-2); }

/* 表 */
.kp-table { margin: 8px 0 0; }
.kp-table summary { cursor: pointer; color: var(--vp-c-text-2); font-size: 14px; }
.kp-table table { font-size: 13px; }
.kp-table th, .kp-table td { padding: 4px 10px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.kp-table th[scope='row'] { text-align: left; }

.kp-lead { line-height: 1.8; }
.kp-note { color: var(--vp-c-text-3); font-size: 13px; line-height: 1.7; }

@media (max-width: 640px) {
  .kp-tiles { grid-template-columns: 1fr; gap: 8px; }
  .kp-tile { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 10px; padding: 10px 14px; }
  .kp-tile-label { flex: 1 0 100%; }
  .kp-tile-value { font-size: 22px; }
  .k-players { --kp-day-w: 20px; --kp-cell-h: 16px; }
  .kp-heat-hour { font-size: 10px; }
}
</style>
