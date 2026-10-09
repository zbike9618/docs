// 「たった今 / 3分前 / 2時間前 / 5日前」。30日を超えたら null（呼び出し側で日付を出す）
// ビルド時とブラウザで時刻がずれるため、onMounted 以降に呼ぶこと
export function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const min = Math.floor((now - t) / 60000)
  if (min < 1) return 'たった今'
  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}時間前`
  const day = Math.floor(hour / 24)
  if (day <= 30) return `${day}日前`
  return null
}

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
