// 不具合一覧（/report/status）。ビルド時に API から取って HTML に焼く
import { fetchList } from './api.js'

export default {
  async load() {
    return fetchList('/api/bugs')
  }
}
