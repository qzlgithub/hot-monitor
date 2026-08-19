import fs from 'fs-extra'
import path from 'path'
import { v4 as uuid } from 'uuid'
import config from '../config/index.js'

// 数据类型定义
export interface Keyword {
  id: string
  keyword: string
  category: string
  createdAt: string
  lastUpdated: string
  isActive: boolean
  // AI 生成的搜索变体（关键词扩展，提高召回率；可选字段，向后兼容旧数据）
  expansions?: string[]
}

export interface Hotspot {
  id: string
  title: string
  description: string
  source: string
  category: string
  score: number
  trend: number
  url: string
  timestamp: string
  keywords: string[]
  // 首次出现时间（系统首次发现入库的时间，新增字段，向后兼容旧数据）
  firstSeenAt?: string
  // 最近一次出现时间（用于时效衰减排序，更新模式会刷新该字段）
  lastSeenAt?: string
  // AI 关联关系说明（为什么相关）
  reasoning?: string
  // 内容是否直接提到了关键词
  keywordMentioned?: boolean
  // 直接相关 / 间接相关（如"梦幻西游新区"=direct，"游戏职业选择"=indirect）
  relevanceType?: 'direct' | 'indirect'
}

class DataStore {
  private dataDir: string
  private keywordsFile: string
  private hotspotsFile: string

  constructor() {
    this.dataDir = config.dataDir
    this.keywordsFile = path.join(this.dataDir, 'keywords.json')
    this.hotspotsFile = path.join(this.dataDir, 'hotspots.json')
    
    this.initializeDataDir()
  }

  private initializeDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    // 初始化JSON文件
    if (!fs.existsSync(this.keywordsFile)) {
      fs.writeJsonSync(this.keywordsFile, [])
    }
    if (!fs.existsSync(this.hotspotsFile)) {
      fs.writeJsonSync(this.hotspotsFile, [])
    }
  }

  // 关键词相关
  async getKeywords(): Promise<Keyword[]> {
    return fs.readJsonSync(this.keywordsFile, { throws: false }) || []
  }

  async addKeyword(keyword: string, category: string): Promise<Keyword> {
    const keywords = await this.getKeywords()
    const newKeyword: Keyword = {
      id: uuid(),
      keyword,
      category,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: true,
    }
    keywords.push(newKeyword)
    await fs.writeJsonSync(this.keywordsFile, keywords)
    return newKeyword
  }

  async updateKeyword(id: string, updates: Partial<Keyword>): Promise<boolean> {
    const keywords = await this.getKeywords()
    const index = keywords.findIndex(k => k.id === id)
    if (index !== -1) {
      keywords[index] = { ...keywords[index], ...updates, lastUpdated: new Date().toISOString() }
      await fs.writeJsonSync(this.keywordsFile, keywords)
      return true
    }
    return false
  }

  async deleteKeyword(id: string): Promise<boolean> {
    const keywords = await this.getKeywords()
    const target = keywords.find(k => k.id === id)
    const filtered = keywords.filter(k => k.id !== id)
    if (filtered.length >= keywords.length) return false // 未找到，未删除
    await fs.writeJsonSync(this.keywordsFile, filtered)

    // 同步清理该关键词关联的热点：仅由它支持的热点删除，多关键词共享的只移除该词
    if (target) {
      const removed = await this.removeHotspotsByKeyword(target.keyword)
      if (removed > 0) {
        console.log(`🧹 删除关键词「${target.keyword}」后清理热点: 移除 ${removed} 条`)
      }
    }
    return true
  }

  // 移除某关键词关联的热点：仅由该关键词支持（keywords 只有它）的热点整条删除；多关键词共享的仅从 keywords 移除该词
  private async removeHotspotsByKeyword(keyword: string): Promise<number> {
    const hotspots = await this.getHotspots()
    const kept: Hotspot[] = []
    let removed = 0
    for (const h of hotspots) {
      if (!h.keywords.includes(keyword)) {
        kept.push(h)
        continue
      }
      if (h.keywords.length <= 1) {
        // 只被这一个关键词支持 → 整条删除
        removed++
        continue
      }
      // 多关键词共享 → 只移除该词，热点保留
      kept.push({ ...h, keywords: h.keywords.filter(k => k !== keyword) })
    }
    if (removed > 0) {
      await fs.writeJsonSync(this.hotspotsFile, kept)
    }
    return removed
  }

  // 热点相关
  async getHotspots(): Promise<Hotspot[]> {
    return fs.readJsonSync(this.hotspotsFile, { throws: false }) || []
  }

  // 热点 upsert（按 url 去重）：同一视频再次出现时更新热度/分数/时间，id 保持稳定，
  // 避免重复入库（重复展示/重复通知）。返回 isNew 标识本次是否为新增热点。
  async addHotspot(hotspot: Omit<Hotspot, 'id'>): Promise<{ hotspot: Hotspot; isNew: boolean }> {
    const hotspots = await this.getHotspots()
    const existingIndex = hotspots.findIndex(h => h.url === hotspot.url)

    if (existingIndex !== -1) {
      const existing = hotspots[existingIndex]
      const updated: Hotspot = {
        ...existing,
        description: hotspot.description || existing.description,
        category: hotspot.category || existing.category,
        score: hotspot.score,
        trend: hotspot.trend,
        reasoning: hotspot.reasoning ?? existing.reasoning,
        keywordMentioned: hotspot.keywordMentioned ?? existing.keywordMentioned,
        relevanceType: hotspot.relevanceType ?? existing.relevanceType,
        lastSeenAt: new Date().toISOString(),
        keywords: Array.from(new Set([...existing.keywords, ...(hotspot.keywords || [])])),
      }
      hotspots[existingIndex] = updated
      await fs.writeJsonSync(this.hotspotsFile, hotspots)
      return { hotspot: updated, isNew: false }
    }

    const now = new Date().toISOString()
    const newHotspot: Hotspot = {
      ...hotspot,
      id: uuid(),
      timestamp: hotspot.timestamp || now,
      firstSeenAt: now,
      lastSeenAt: now,
    }
    hotspots.push(newHotspot)
    // 只保留最近1000条
    if (hotspots.length > 1000) {
      hotspots.shift()
    }
    await fs.writeJsonSync(this.hotspotsFile, hotspots)
    return { hotspot: newHotspot, isNew: true }
  }

  // 清理历史遗留的重复热点：按 url 分组，每组只保留最"优质"的一条
  // （lastSeenAt 较新 → score 较高 → trend 较高 → timestamp 较新），其余删除。
  // 与 addHotspot 的 upsert 互补：upsert 保证未来不新增重复，本方法清理已存在的重复。
  async dedupeHotspots(): Promise<number> {
    const hotspots = await this.getHotspots()
    const best = new Map<string, Hotspot>()
    let removed = 0

    const isBetter = (a: Hotspot, b: Hotspot): boolean => {
      const ta = new Date(a.lastSeenAt || a.timestamp || 0).getTime()
      const tb = new Date(b.lastSeenAt || b.timestamp || 0).getTime()
      if (ta !== tb) return ta > tb
      if ((a.score || 0) !== (b.score || 0)) return (a.score || 0) > (b.score || 0)
      if ((a.trend || 0) !== (b.trend || 0)) return (a.trend || 0) > (b.trend || 0)
      return false
    }

    for (const h of hotspots) {
      const key = h.url
      const existing = best.get(key)
      if (!existing) {
        best.set(key, h)
      } else {
        removed++
        if (isBetter(h, existing)) best.set(key, h)
      }
    }

    if (removed > 0) {
      await fs.writeJsonSync(this.hotspotsFile, Array.from(best.values()))
      console.log(`🧹 dedupeHotspots: 移除 ${removed} 条重复热点，剩余 ${best.size} 条`)
    }
    return removed
  }

  // 清理「孤儿热点」：keywords 里没有任何 active 关键词支持的热点
  // 不传 activeKeywords 时实时读取当前 active 关键词，避免收集过程中删除关键词导致快照过时
  async cleanupOrphanHotspots(activeKeywords?: string[]): Promise<number> {
    const hotspots = await this.getHotspots()
    let activeSet: Set<string>
    if (activeKeywords && activeKeywords.length > 0) {
      activeSet = new Set(activeKeywords)
    } else {
      const keywords = await this.getKeywords()
      activeSet = new Set(keywords.filter(k => k.isActive).map(k => k.keyword))
    }
    const kept: Hotspot[] = []
    let removed = 0
    for (const h of hotspots) {
      const hasActive = h.keywords.some(k => activeSet.has(k))
      if (hasActive) {
        kept.push(h)
      } else {
        removed++
      }
    }
    if (removed > 0) {
      await fs.writeJsonSync(this.hotspotsFile, kept)
      console.log(`🧹 cleanupOrphanHotspots: 移除 ${removed} 条无关键词支持的热点，剩余 ${kept.length} 条`)
    }
    return removed
  }
}

export const dataStore = new DataStore()
