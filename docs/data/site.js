// サイト全体で共有する定数。config.mts とビルド時のデータ取得（Node）の両方から読む
const env = (globalThis.process && globalThis.process.env) || {}

export const SITE_URL = 'https://www.gozakura.org'
export const SITE_NAME = '建国鯖'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/yuku5_icon.jpg`

// 本番（LXC）は '/'。GitHub Pages 用の pages ブランチのビルドだけ '/docs/'
export const BASE = env.GITHUB_ACTIONS && !env.LXC_DEPLOY ? '/docs/' : '/'
