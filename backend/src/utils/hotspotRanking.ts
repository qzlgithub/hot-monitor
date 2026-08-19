import type { Hotspot } from '../services/dataStore.js'

export type HotspotSort = 'latest' | 'hot' | 'score'

// 热度分（0-10）：纯播放量 log10 归一（1e5 播放 → 5 分，1e10 封顶），供 API 的 hotScore 字段展示
export function computeHotScore(h: Pick<Hotspot, 'trend'>): number {
  return Number(Math.min(Math.log10(Math.max(h.trend ?? 0, 0) + 1), 10).toFixed(2))
}

// 按指定策略排序（均为纯语义排序 —— 进入热点页的数据已通过筛选，都符合关键词，无需再混权重）：
//   hot    = 播放量最高的在最上（热度）
//   latest = 发布时间最新的在最上（时间）
//   score  = AI 相关性评分最高的在最上（相关性）
export function sortHotspots<T extends Hotspot>(
  hotspots: T[],
  sort: HotspotSort = 'hot'
): T[] {
  const sorted = [...hotspots]
  const timeOf = (h: Hotspot) => new Date(h.timestamp).getTime()
  const byTimeDesc = (a: T, b: T) => timeOf(b) - timeOf(a)

  if (sort === 'latest') {
    // 最新：发布时间最新的在最上
    return sorted.sort(byTimeDesc)
  }

  if (sort === 'score') {
    // 相关性：AI 评分最高的在最上（同分按时间倒序）
    return sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || byTimeDesc(a, b))
  }

  // 综合热度：播放量最高的在最上（同分按时间倒序）
  return sorted.sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0) || byTimeDesc(a, b))
}
