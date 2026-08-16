import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'

const router = Router()

// 获取热点列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const hotspots = await dataStore.getHotspots()
    // 按时间倒序，最新的在前
    const sorted = hotspots.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    res.json(sorted)
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
