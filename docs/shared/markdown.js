// お知らせ・ブログの本文（Markdown）を HTML にする。
// ビルド時（Node）とブラウザ（管理画面で直した直後の差し替え）の両方で同じ結果にするため、vitepress には依存させない。
// html: false なので、本文に書いたタグは文字のまま表示される（スクリプトは動かない）。
import MarkdownIt from 'markdown-it'

export function createMarkdown({ base = '/', apiBase = '' } = {}) {
  const prefix = base.replace(/\/+$/, '')
  const md = new MarkdownIt({ html: false, linkify: true, breaks: true })
  const renderToken = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options)

  const defaultLinkOpen = md.renderer.rules.link_open || renderToken
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') || ''
    if (/^https?:\/\//.test(href)) {
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      token.attrSet('href', prefix + href)
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  // アップロードした画像は API 側（/uploads/...）にあるので、サイトから見えるURLに直す
  const defaultImage = md.renderer.rules.image || renderToken
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''
    token.attrSet('src', src.startsWith('/uploads/') ? apiBase + src : src)
    token.attrSet('loading', 'lazy')
    return defaultImage(tokens, idx, options, env, self)
  }
  return md
}
