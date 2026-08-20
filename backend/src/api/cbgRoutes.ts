// 藏宝阁 API 路由（无 /api 前缀，前端经 vite proxy 转发）
import { Router } from 'express'
import { cbgDataStore } from '../services/cbgDataStore.js'
import { cbgMonitorService } from '../services/cbgMonitorService.js'
import { cbgService } from '../services/cbgService.js'
import type { CbgItemType } from '../services/cbgService.js'

const router = Router()

// 统计
router.get('/cbg/stats', (_req, res) => {
  res.json(cbgDataStore.getStats())
})

// 商品列表（?type=equip|pet|role&status=&rule=&limit=）
router.get('/cbg/items', (req, res) => {
  const { type, status, rule, limit } = req.query
  let items = cbgDataStore.getItems()
  if (type) items = items.filter((i) => i.type === type)
  if (status) items = items.filter((i) => i.status === status || i.passFairShow === (status === 'pass_fair_show'))
  if (rule) items = items.filter((i) => (i.ruleNames || []).includes(rule as string))
  // 默认按最近发现排序
  items.sort((a, b) => (b.lastSeenAt || '').localeCompare(a.lastSeenAt || ''))
  const n = limit ? parseInt(limit as string, 10) : undefined
  res.json(n ? items.slice(0, n) : items)
})

// 商品详情（含价格历史）
router.get('/cbg/items/:id', (req, res) => {
  const item = cbgDataStore.getItem(req.params.id)
  if (!item) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(item)
})

// 市场价基线（按规则/品类的在售价格统计，供前端算乖离率/捡漏）
router.get('/cbg/price-stats', (_req, res) => {
  res.json(cbgDataStore.getPriceStats())
})

// 价格走势序列（按规则，供价格走势图）
router.get('/cbg/trend', (req, res) => {
  const { rule } = req.query
  if (!rule) {
    res.status(400).json({ error: 'rule 必填' })
    return
  }
  res.json(cbgDataStore.getTrend(rule as string))
})

// 搜索规则
router.get('/cbg/search-rules', (_req, res) => {
  res.json(cbgDataStore.getRules())
})

router.post('/cbg/search-rules', (req, res) => {
  const { name, type, topN, conditions, enabled, priority } = req.body || {}
  if (!name || !type || !['equip', 'pet', 'role'].includes(type)) {
    res.status(400).json({ error: 'name 与 type(equip/pet/role) 必填' })
    return
  }
  const rule = cbgDataStore.addRule({
    name,
    type: type as CbgItemType,
    enabled: enabled !== false,
    topN: Math.max(1, Math.min(50, Number(topN) || 10)),
    priority: priority === 'fast' ? 'fast' : 'normal',
    conditions: conditions || {},
  })
  res.json(rule)
})

router.put('/cbg/search-rules/:id', (req, res) => {
  const { name, type, topN, conditions, enabled, priority } = req.body || {}
  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (type !== undefined && ['equip', 'pet', 'role'].includes(type)) updates.type = type
  if (topN !== undefined) updates.topN = Math.max(1, Math.min(50, Number(topN) || 10))
  if (conditions !== undefined) updates.conditions = conditions
  if (enabled !== undefined) updates.enabled = enabled
  if (priority !== undefined) updates.priority = priority === 'fast' ? 'fast' : 'normal'
  const rule = cbgDataStore.updateRule(req.params.id, updates)
  if (!rule) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(rule)
})

router.delete('/cbg/search-rules/:id', (req, res) => {
  const ok = cbgDataStore.deleteRule(req.params.id)
  res.json({ success: ok })
})

// 立即采集
router.post('/cbg/check', async (_req, res) => {
  cbgMonitorService.collect().then((result) => {
    console.log('✓ CBG manual check finished:', result)
  }).catch((e) => console.error('CBG check error:', e))
  res.json({ success: true, message: '藏宝阁采集已启动' })
})

// 采集状态 / 登录态
router.get('/cbg/status', (_req, res) => {
  res.json({
    ...cbgMonitorService.getStatus(),
    loggedIn: cbgService.hasCookies(),
  })
})

export default router
