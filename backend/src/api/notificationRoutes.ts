import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'

const router = Router()

// 获取通知列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await dataStore.getNotifications()
    // 按时间倒序
    const sorted = notifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    res.json(sorted)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// 标记为已读
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = await dataStore.updateNotification(id, { read: true })

    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

// 删除通知
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = await dataStore.deleteNotification(id)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
