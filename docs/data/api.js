// ビルド時（Node）に API からデータを取る共通処理。
// 取得に失敗したらビルドを止める。「空の一覧」を焼き込んだまま公開してしまうのが一番まずいため。
// ローカル開発で API に繋げないときだけ API_OPTIONAL=1 を付けると、空で続行できる。
const env = (globalThis.process && globalThis.process.env) || {}

const trim = (url) => url.replace(/\/+$/, '')

// ビルドが API を取りに行く先。CT111 のビルダーは http://127.0.0.1:3000 を指す
export const buildApiBase = () => trim(env.BUILD_API_URL || 'https://api.gozakura.org')

// 画像など「ブラウザが取りに行く先」。ブラウザ側の import.meta.env.VITE_API_URL と同じ値にそろえる
export const publicApiBase = () => trim(env.VITE_API_URL || 'https://api.gozakura.org')

async function request(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (e) {
      lastError = e
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
  throw new Error(`API の取得に失敗しました: ${url} (${lastError && lastError.message})`)
}

// 同じパスは短時間に1度だけ取る（一覧のデータローダー・記事ページの生成・sitemap が同じ一覧を使うため）
const cache = new Map()
const CACHE_MS = 30000

export function fetchJson(path) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise
  const promise = request(buildApiBase() + path)
  promise.catch(() => cache.delete(path))
  cache.set(path, { at: Date.now(), promise })
  return promise
}

export async function fetchList(path) {
  try {
    const data = await fetchJson(path)
    if (!Array.isArray(data)) throw new Error(`配列ではない応答です: ${path}`)
    return data
  } catch (e) {
    if (env.API_OPTIONAL === '1') {
      console.warn(`[api] ${e.message} → 空のリストで続行します（API_OPTIONAL=1）`)
      return []
    }
    throw e
  }
}
