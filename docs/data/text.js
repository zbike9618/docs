// 検索結果に出る説明文（description）や日付を作る小さな部品（ビルド時だけ使う）
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

// ページのデータ（title・description など）は、VitePress が <script> の中に JSON として埋め込む。
// 管理画面で書いた文字に「</script>」があるとそこで <script> が終わってビルドが壊れるので、
// 山括弧は全角にしてから渡す（見た目は ＜ ＞ になる）
export function safeText(value) {
  return String(value ?? '').replace(/</g, '＜').replace(/>/g, '＞')
}

export function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|pre|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim()
}

// 本文の冒頭から description を作る（検索結果に出るのは120字前後まで）
export function summarize(html, max = 120) {
  const text = safeText(htmlToText(html))
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// お知らせの date は "2026/10/12" 形式。構造化データ用に "2026-10-12" へ直す
export function slashDateToIso(date) {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(date || '')
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null
}
