import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'
import {
  computeHotScore,
  sortHotspots,
  type HotspotSort,
} from '../utils/hotspotRanking.js'

const router = Router()

// 解析 since 参数：支持 24h / 7d / 30d 或 ISO 时间字符串，非法则返回 null
function parseSince(since?: string): number | null {
  if (!since) return null
  const match = /^(\d+)([hd])$/.exec(since)
  if (match) {
    const value = parseInt(match[1], 10)
    const unit = match[2]
    return Date.now() - value * (unit === 'h' ? 3_600_000 : 86_400_000)
  }
  const t = new Date(since).getTime()
  return Number.isNaN(t) ? null : t
}

// 获取热点列表（支持筛选 source/category/since + 排序 sort + 分页 limit/page）
router.get('/', async (req: Request, res: Response) => {
  try {
    const { source, category, since, sort, limit, page } = req.query
    const hotspots = await dataStore.getHotspots()

    // 筛选
    let filtered = hotspots
    if (source) filtered = filtered.filter(h => h.source === source)
    if (category) filtered = filtered.filter(h => h.category === category)
    const sinceTs = parseSince(typeof since === 'string' ? since : undefined)
    if (sinceTs !== null) {
      filtered = filtered.filter(h => {
        const ref = new Date(h.lastSeenAt || h.timestamp).getTime()
        return ref >= sinceTs
      })
    }

    // 排序（默认综合热度）
    const sorted = sortHotspots(filtered, (sort as HotspotSort) || 'hot')
    // 附加综合热度分，供前端展示/排序
    const withScore = sorted.map(h => ({ ...h, hotScore: computeHotScore(h) }))

    // 分页（不传 limit 时返回全部，兼容现有前端）
    let result = withScore
    if (limit) {
      const limitNum = parseInt(limit as string, 10)
      if (!Number.isNaN(limitNum) && limitNum > 0) {
        const pageNum = Math.max(parseInt((page as string) || '1', 10), 1)
        const start = (pageNum - 1) * limitNum
        result = withScore.slice(start, start + limitNum)
      }
    }

    res.json(result)
  } catch (error) {
    console.error('Error fetching hotspots:', error)
    res.status(500).json({ error: 'Failed to fetch hotspots' })
  }
})

// 获取按分类的热点
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params
    const hotspots = await dataStore.getHotspots()
    
    const filtered = hotspots.filter(h => h.category === category).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    res.json(filtered)
  } catch (error) {
    console.error('Error fetching hotspots by category:', error)
    res.status(500).json({ error: 'Failed to fetch hotspots' })
  }
})

// 获取按来源的热点
router.get('/source/:source', async (req: Request, res: Response) => {
  try {
    const { source } = req.params
    const hotspots = await dataStore.getHotspots()
    
    const filtered = hotspots.filter(h => h.source === source).sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    
    res.json(filtered)
  } catch (error) {
    console.error('Error fetching hotspots by source:', error)
    res.status(500).json({ error: 'Failed to fetch hotspots' })
  }
})

export default router
