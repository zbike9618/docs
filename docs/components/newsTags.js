// お知らせタグの表示色。タグの種類そのものは API（/api/news/tags）が決める。ここに無いタグはグレー
export const TAG_COLORS = {
  '戦況': '#e5484d',
  '建国': '#30a46c',
  '運営': '#3e63dd',
  'メンテナンス': '#f76b15',
  'アップデート': '#8e4ec6',
  'イベント': '#d6409f',
}

export const tagColor = (tag) => TAG_COLORS[tag] || '#8b8d98'
