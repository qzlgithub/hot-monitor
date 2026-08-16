import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'

const router = Router()

// 获取统计信息
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const keywords = await dataStore.getKeywords()
    const hotspots = await dataStore.getHotspots()
    const notifications = await dataStore.getNotifications()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayHotspots = hotspots.filter(
      h => new Date(h.timestamp).getTime() >= today.getTime()
    ).length

    const todayNotifications = notifications.filter(
      n => !n.read && new Date(n.timestamp).getTime() >= today.getTime()
    ).length

    res.json({
      totalKeywords: keywords.length,
      todayHotspots,
      alerts: todayNotifications,
      activeMonitors: keywords.filter(k => k.isActive).length,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
