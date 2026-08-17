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
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info'
  keyword: string
  source: string
  timestamp: string
  read: boolean
  hotspotId?: string
  url?: string
}

class DataStore {
  private dataDir: string
  private keywordsFile: string
  private hotspotsFile: string
  private notificationsFile: string

  constructor() {
    this.dataDir = config.dataDir
    this.keywordsFile = path.join(this.dataDir, 'keywords.json')
    this.hotspotsFile = path.join(this.dataDir, 'hotspots.json')
    this.notificationsFile = path.join(this.dataDir, 'notifications.json')
    
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
    if (!fs.existsSync(this.notificationsFile)) {
      fs.writeJsonSync(this.notificationsFile, [])
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
    const filtered = keywords.filter(k => k.id !== id)
    await fs.writeJsonSync(this.keywordsFile, filtered)
    return filtered.length < keywords.length
  }

  // 热点相关
  async getHotspots(): Promise<Hotspot[]> {
    return fs.readJsonSync(this.hotspotsFile, { throws: false }) || []
  }

  async addHotspot(hotspot: Omit<Hotspot, 'id'>): Promise<Hotspot> {
    const hotspots = await this.getHotspots()
    const newHotspot: Hotspot = {
      ...hotspot,
      id: uuid(),
    }
    hotspots.push(newHotspot)
    // 只保留最近1000条
    if (hotspots.length > 1000) {
      hotspots.shift()
    }
    await fs.writeJsonSync(this.hotspotsFile, hotspots)
    return newHotspot
  }

  // 通知相关
  async getNotifications(): Promise<Notification[]> {
    return fs.readJsonSync(this.notificationsFile, { throws: false }) || []
  }

  async addNotification(notification: Omit<Notification, 'id'>): Promise<Notification> {
    const notifications = await this.getNotifications()
    const newNotification: Notification = {
      ...notification,
      id: uuid(),
    }
    notifications.push(newNotification)
    // 只保留最近500条
    if (notifications.length > 500) {
      notifications.shift()
    }
    await fs.writeJsonSync(this.notificationsFile, notifications)
    return newNotification
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<boolean> {
    const notifications = await this.getNotifications()
    const index = notifications.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications[index] = { ...notifications[index], ...updates }
      await fs.writeJsonSync(this.notificationsFile, notifications)
      return true
    }
    return false
  }

  async deleteNotification(id: string): Promise<boolean> {
    const notifications = await this.getNotifications()
    const filtered = notifications.filter(n => n.id !== id)
    await fs.writeJsonSync(this.notificationsFile, filtered)
    return filtered.length < notifications.length
  }
}

export const dataStore = new DataStore()
