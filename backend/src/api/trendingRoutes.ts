import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'

const router = Router()

// 获取「热门发现」板块数据（B 站全站热门，与关键词热点分开存储）
router.get('/', async (req: Request, res: Response) => {
  try {
    const videos = await dataStore.getTrendingVideos()
    // 按采集时间倒序，最新的在前
    const sorted = videos.sort((a, b) =>
      new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
    )
    res.json(sorted)
  } catch (error) {
    console.error('Error fetching trending videos:', error)
    res.status(500).json({ error: 'Failed to fetch trending videos' })
  }
})

export default router
