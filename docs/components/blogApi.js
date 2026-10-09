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

let md = null
export async function blogRenderer() {
  if (md) return md
  const { default: MarkdownIt } = await import('markdown-it')
  // html: false なので本文に書いたタグは文字のまま表示される（スクリプトは動かない）
  md = new MarkdownIt({ html: false, linkify: true, breaks: true })
  const renderToken = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)
  const defaultLinkOpen = md.renderer.rules.link_open || renderToken
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') || ''
    if (/^https?:\/\//.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      token.attrSet('href', withBase(href))
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }
  const defaultImage = md.renderer.rules.image
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    token.attrSet('src', imageUrl(token.attrGet('src') || ''))
    token.attrSet('loading', 'lazy')
    return defaultImage(tokens, idx, options, env, self)
  }
  return md
}
