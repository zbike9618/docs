// プレイヤー数（/api/players/history）の取得と、トップ・/players で共通の計算。
// 時刻はすべて日本時間で扱う（閲覧者の端末の時間帯に関係なく、サーバーの時間で表示する）
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.gozakura.org').replace(/\/+$/, '')
export const JST = 9 * 3600
export const DAYS_SUN = ['日', '月', '火', '水', '木', '金', '土']
export const DAYS_MON = ['月', '火', '水', '木', '金', '土', '日']

export const jstDate = (sec) => new Date((sec + JST) * 1000)
export const md = (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
export const wd = (d) => DAYS_SUN[d.getUTCDay()]
export const hm = (d) => `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, '0')}`

export async function fetchPlayerHistory() {
  const res = await fetch(`${API_BASE}/api/players/history`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// 曜日（月曜 = 0）ごとの行から、時間帯ごとの平均を作る（曜日ごとの平均をさらに平均する）
function profileOf(weekly, days) {
  return Array.from({ length: 24 }, (_, h) => {
    const vals = days.map((d) => weekly[d]?.[h]?.avg).filter((v) => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })
}

// にぎわう時間帯: 一番多い時間から前後に、最大の半分以上の時間をつなげる。
// 1時間だけの落ち込み（18時の定期再起動など）はつなぐ。日をまたいでもよい（例: 22〜翌2時）
export function peakWindow(profile) {
  const vals = profile.map((v) => v ?? 0)
  const max = Math.max(...vals)
  if (!(max > 0)) return null
  const th = max * 0.5
  const ok = (h) => vals[((h % 24) + 24) % 24] >= th
  const peak = vals.indexOf(max)
  let start = peak
  let end = peak + 1 // 含まない
  while (end - start < 24) {
    if (ok(start - 1)) start -= 1
    else if (end - start <= 21 && ok(start - 2)) start -= 2
    else break
  }
  while (end - start < 24) {
    if (ok(end)) end += 1
    else if (end - start <= 21 && ok(end + 1)) end += 2
    else break
  }
  const s = ((start % 24) + 24) % 24
  const hours = Array.from({ length: end - start }, (_, i) => (s + i) % 24)
  const avg = hours.reduce((a, h) => a + vals[h], 0) / hours.length
  return { start: s, end: s + (end - start), hours, avg, max }
}

export function windowText(w) {
  if (!w) return ''
  if (w.end - w.start >= 24) return '一日中'
  return w.end <= 24 ? `${w.start}〜${w.end}時` : `${w.start}〜翌${w.end - 24}時`
}

// 平日と土日で分けたにぎわう時間帯。土日の記録がまだ無いときは全体の1つだけにする
export function peakWindows(peakTime) {
  const weekly = peakTime?.weekly
  if (!weekly) return null
  const weekday = profileOf(weekly, [0, 1, 2, 3, 4])
  const weekend = profileOf(weekly, [5, 6])
  const all = (peakTime.hourly || []).map((c) => (c ? c.avg : null))
  const hasWeekday = weekday.some((v) => v != null)
  const hasWeekend = weekend.some((v) => v != null)
  if (!hasWeekday || !hasWeekend) {
    const w = peakWindow(all)
    return w ? { same: true, all: w, weekday: w, weekend: w, profiles: { weekday: all, weekend: all } } : null
  }
  const wWeekday = peakWindow(weekday)
  const wWeekend = peakWindow(weekend)
  if (!wWeekday || !wWeekend) return null
  return {
    same: windowText(wWeekday) === windowText(wWeekend),
    all: peakWindow(all),
    weekday: wWeekday,
    weekend: wWeekend,
    profiles: { weekday, weekend }
  }
}

export function peakWindowsText(p) {
  if (!p) return ''
  if (p.same) return `毎日 ${windowText(p.weekday)}ごろ`
  return `平日 ${windowText(p.weekday)}・土日 ${windowText(p.weekend)}ごろ`
}

// 直近7日間の1日ごとの最大人数（今日と、記録が18時間に満たない日は除く）
export function dailyPeaks(range7d, now = Math.floor(Date.now() / 1000)) {
  if (!range7d) return []
  const today = Math.floor((now + JST) / 86400)
  const days = new Map()
  range7d.max.forEach((v, i) => {
    if (v == null) return
    const key = Math.floor((range7d.start + i * range7d.step + JST) / 86400)
    if (key >= today) return
    const d = days.get(key) || { key, max: 0, hours: 0 }
    d.max = Math.max(d.max, v)
    d.hours += range7d.step / 3600
    days.set(key, d)
  })
  return [...days.values()].filter((d) => d.hours >= 18).sort((a, b) => a.key - b.key)
}

export const isWeekend = (sec) => {
  const day = jstDate(sec).getUTCDay()
  return day === 0 || day === 6
}
