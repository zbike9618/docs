// ブログ（設計書 01）の共通処理。記事は管理画面で書き、API から取ってきて表示する
import { withBase } from 'vitepress'

export const apiBase = () => import.meta.env.VITE_API_URL || 'https://api.gozakura.org'

// アップロードした画像は API 側（/uploads/...）にあるので、サイトから見えるURLに直す
export const imageUrl = (src) => (src && src.startsWith('/uploads/') ? apiBase() + src : src)

// リアクション用のブラウザごとのID。投票（PollList.vue）と同じキーを使う
const VOTER_KEY = 'gozakura-voter-id'
export function getVoterId() {
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

// 一覧・ギャラリー用の短い表示（数の多い順に最大3種類）
export const reactionSummary = (post) => (post.reactions || [])
  .filter((r) => r.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 3)

// 書いた場所。今は管理画面だけ。将来プレイヤーが書けるようになったら 'player' が増える
export const SOURCE_LABELS = { admin: 'admin' }

// 本文（Markdown）→ HTML。ビルド時に焼くのと同じ変換（shared/markdown.js）を、管理画面で直した直後の差し替えにも使う。
// markdown-it は重いので、差し替えが必要になったときだけ読み込む
let md = null
export async function articleRenderer() {
  if (md) return md
  const { createMarkdown } = await import('../shared/markdown.js')
  md = createMarkdown({ base: withBase('/'), apiBase: apiBase() })
  return md
}
