import { Router, Request, Response } from 'express'
import { dataStore } from '../services/dataStore.js'
import { keywordExpansionService } from '../services/keywordExpansionService.js'

const router = Router()

// 获取所有关键词
router.get('/', async (req: Request, res: Response) => {
  try {
    const keywords = await dataStore.getKeywords()
    res.json(keywords)
  } catch (error) {
    console.error('Error fetching keywords:', error)
    res.status(500).json({ error: 'Failed to fetch keywords' })
  }
})

// 添加关键词
router.post('/', async (req: Request, res: Response) => {
  try {
    const { keyword, category } = req.body

    if (!keyword) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newKeyword = await dataStore.addKeyword(keyword, category || 'general')
    res.status(201).json(newKeyword)
  } catch (error) {
    console.error('Error adding keyword:', error)
    res.status(500).json({ error: 'Failed to add keyword' })
  }
})

// 更新关键词
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body

    const success = await dataStore.updateKeyword(id, updates)
    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Keyword not found' })
    }
  } catch (error) {
    console.error('Error updating keyword:', error)
    res.status(500).json({ error: 'Failed to update keyword' })
  }
})

// 删除关键词
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const success = await dataStore.deleteKeyword(id)

    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Keyword not found' })
    }
  } catch (error) {
    console.error('Error deleting keyword:', error)
    res.status(500).json({ error: 'Failed to delete keyword' })
  }
})

// 重新生成搜索变体（关键词扩展）：调用 LLM 生成新的变体列表并回写
router.post('/:id/expand', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const keywords = await dataStore.getKeywords()
    const kw = keywords.find((k) => k.id === id)

    if (!kw) {
      return res.status(404).json({ error: 'Keyword not found' })
    }

    const expansions = await keywordExpansionService.expand(kw.keyword)
    await dataStore.updateKeyword(id, {
      expansions,
      lastUpdated: new Date().toISOString(),
    })

    res.json({ success: true, expansions })
  } catch (error) {
    console.error('Error expanding keyword:', error)
    res.status(500).json({ error: 'Failed to expand keyword' })
  }
})

export default router
