// 藏宝阁数据存储：CbgItem（商品）+ CbgSearchRule（搜索规则）
import fs from 'fs-extra'
import path from 'path'
import { v4 as uuid } from 'uuid'
import config from '../config/index.js'
import type { CbgItemType, CbgRawItem } from './cbgService.js'

export interface PricePoint {
  ts: string
  price: number
}

/** 藏宝阁商品（装备/召唤兽/角色统一结构） */
export interface CbgItem {
  id: string // eid
  type: CbgItemType
  name: string
  level?: string
  server?: string // 区-服
  serverid?: number
  price: number // 元
  status?: string // 上架中/公示期/已下架
  passFairShow: boolean
  sellingTime?: string
  expireTime?: string
  seller?: string
  summary?: string // 属性摘要
  url: string
  /** 命中该商品的搜索规则名 */
  ruleNames: string[]
  firstSeenAt: string
  lastSeenAt: string
  priceHistory: PricePoint[]
}

/** 搜索规则条件（对话框填写的筛选要求） */
export interface CbgSearchCondition {
  levelMin?: number
  levelMax?: number
  priceMin?: number // 元
  priceMax?: number // 元
  /** 出售状态：pass_fair_show=已上架 fair_show=公示期 */
  frontStatus?: string
  /** 装备类型（kindid：扇10 剑6 刀14 斧5 锤15 枪4 双环13 双剑7 鞭12 爪刺9 魔棒11 飘带8 宝珠52 弓53 法杖54 男衣18 女衣59 男头17 女头58 腰带20 鞋子19 饰品21 灯笼72 巨剑73 伞74 双斧83 棍91） */
  kindid?: number
  // 装备属性（>= 下限）
  initDamageRaw?: number // 初伤（不含命中）
  initDamage?: number // 初伤（包含命中）
  allDamage?: number // 总伤
  damage?: number // 伤害
  initDefense?: number // 初防
  initHp?: number // 初血
  initDex?: number // 初敏
  initWakan?: number // 初灵
  allWakan?: number // 总灵
  // 属性计算（单项，如"力量 +30"）
  sumAttrType?: 'power' | 'physique' | 'magic' | 'endurance' | 'dex'
  sumAttrValue?: number
  // 特效 / 特技
  specialEffect?: string
  specialSkill?: string
  // 召唤兽（预留）
  petGrow?: number
}

/** 搜索规则（用户配置的监控要求） */
export interface CbgSearchRule {
  id: string
  name: string
  type: CbgItemType
  enabled: boolean
  /** 取最低价前 N 条 */
  topN: number
  /** 采集优先级：fast=高频(15分钟) normal=普通(30分钟)，默认 normal */
  priority?: 'fast' | 'normal'
  conditions: CbgSearchCondition
  createdAt: string
}

/** 规则品类的市场价基线（在售同类商品价格统计，用于乖离率/捡漏判断） */
export interface RulePriceStat {
  median: number // 中位数（市场价基准）
  avg: number
  min: number
  max: number
  sampleCount: number
  updatedAt: string
}

/** 规则价格走势点（每次采集追加一条，供价格走势图） */
export interface TrendPoint {
  ts: string
  median: number
  avg: number
  min: number
  max: number
  sampleCount: number
}

class CbgDataStore {
  private itemsFile: string
  private rulesFile: string
  private priceStatsFile: string
  private trendFile: string

  constructor() {
    this.itemsFile = path.join(config.dataDir, 'cbgItems.json')
    this.rulesFile = path.join(config.dataDir, 'cbgSearchRules.json')
    this.priceStatsFile = path.join(config.dataDir, 'cbgPriceStats.json')
    this.trendFile = path.join(config.dataDir, 'cbgTrendHistory.json')
    this.init()
  }

  private init() {
    if (!fs.existsSync(this.itemsFile)) fs.writeJsonSync(this.itemsFile, [])
    if (!fs.existsSync(this.rulesFile)) fs.writeJsonSync(this.rulesFile, [])
    if (!fs.existsSync(this.priceStatsFile)) fs.writeJsonSync(this.priceStatsFile, {})
    if (!fs.existsSync(this.trendFile)) fs.writeJsonSync(this.trendFile, {})
  }

  // ---------- Items ----------
  getItems(): CbgItem[] {
    return fs.readJsonSync(this.itemsFile, { throws: false }) || []
  }

  private saveItems(items: CbgItem[]) {
    fs.writeJsonSync(this.itemsFile, items, { spaces: 2 })
  }

  /**
   * upsert 商品（按 eid 去重）
   * - 已存在：更新价格/状态/字段，记录 priceHistory（价格变化才加记录）
   * - 不存在：新增，priceHistory 从当前价格开始
   * @returns { item, isNew, priceChanged, prevPrice }
   */
  upsertItem(raw: CbgRawItem, type: CbgItemType, ruleNames: string[]): { item: CbgItem; isNew: boolean; priceChanged: boolean; prevPrice?: number } {
    const items = this.getItems()
    const now = new Date().toISOString()
    const price = (raw.price ?? 0) / 100
    const url = raw.serverid && raw.eid
      ? `https://xyq.cbg.163.com/equip?s=${raw.serverid}&eid=${raw.eid}`
      : ''

    const idx = items.findIndex((i) => i.id === raw.eid)
    if (idx >= 0) {
      const it = items[idx]
      const prevPrice = it.price
      const priceChanged = Math.abs(prevPrice - price) > 0.001
      // 更新字段
      it.price = price
      it.status = raw.equip_status_desc || raw.status_desc || it.status
      it.passFairShow = raw.pass_fair_show === 1
      it.sellingTime = raw.selling_time || it.sellingTime
      it.expireTime = raw.expire_time || it.expireTime
      it.seller = raw.seller_nickname || it.seller
      it.summary = raw.desc_sumup || it.summary
      it.name = raw.equip_name || it.name
      it.level = raw.level_desc || it.level
      it.server = raw.area_name && raw.server_name ? `${raw.area_name}-${raw.server_name}` : it.server
      it.serverid = raw.serverid || it.serverid
      it.url = url || it.url
      it.lastSeenAt = now
      // 兼容旧数据（ruleNames 缺失）
      if (!Array.isArray(it.ruleNames)) it.ruleNames = []
      // 合并规则名（去重）
      for (const rn of ruleNames) {
        if (rn && !it.ruleNames.includes(rn)) it.ruleNames.push(rn)
      }
      if (priceChanged) {
        it.priceHistory.push({ ts: now, price })
      }
      this.saveItems(items)
      return { item: it, isNew: false, priceChanged, prevPrice }
    }

    const item: CbgItem = {
      id: raw.eid,
      type,
      name: raw.equip_name || '未知',
      level: raw.level_desc,
      server: raw.area_name && raw.server_name ? `${raw.area_name}-${raw.server_name}` : undefined,
      serverid: raw.serverid,
      price,
      status: raw.equip_status_desc || raw.status_desc,
      passFairShow: raw.pass_fair_show === 1,
      sellingTime: raw.selling_time,
      expireTime: raw.expire_time,
      seller: raw.seller_nickname,
      summary: raw.desc_sumup,
      url,
      ruleNames,
      firstSeenAt: now,
      lastSeenAt: now,
      priceHistory: [{ ts: now, price }],
    }
    items.push(item)
    this.saveItems(items)
    return { item, isNew: true, priceChanged: false }
  }

  getItem(id: string): CbgItem | undefined {
    return this.getItems().find((i) => i.id === id)
  }

  getStats() {
    const items = this.getItems()
    const today = new Date().toISOString().slice(0, 10)
    const todayNew = items.filter((i) => i.firstSeenAt.slice(0, 10) === today).length
    const priceChanged = items.filter((i) => {
      const h = i.priceHistory
      if (h.length < 2) return false
      return h[h.length - 1].price !== h[h.length - 2].price
    }).length
    const onSale = items.filter((i) => i.status === '上架中' || i.passFairShow).length
    return {
      total: items.length,
      todayNew,
      priceChanged,
      onSale,
    }
  }

  // ---------- 搜索规则 ----------
  getRules(): CbgSearchRule[] {
    return fs.readJsonSync(this.rulesFile, { throws: false }) || []
  }

  private saveRules(rules: CbgSearchRule[]) {
    fs.writeJsonSync(this.rulesFile, rules, { spaces: 2 })
  }

  addRule(input: Omit<CbgSearchRule, 'id' | 'createdAt'>): CbgSearchRule {
    const rules = this.getRules()
    const rule: CbgSearchRule = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    }
    rules.push(rule)
    this.saveRules(rules)
    return rule
  }

  updateRule(id: string, updates: Partial<CbgSearchRule>): CbgSearchRule | null {
    const rules = this.getRules()
    const idx = rules.findIndex((r) => r.id === id)
    if (idx < 0) return null
    rules[idx] = { ...rules[idx], ...updates }
    this.saveRules(rules)
    return rules[idx]
  }

  deleteRule(id: string): boolean {
    const rules = this.getRules()
    const next = rules.filter((r) => r.id !== id)
    if (next.length === rules.length) return false
    this.saveRules(next)
    return true
  }

  // ---------- 市场价基线（按规则/品类） ----------
  getPriceStats(): Record<string, RulePriceStat> {
    return fs.readJsonSync(this.priceStatsFile, { throws: false }) || {}
  }

  updatePriceStat(ruleName: string, stat: RulePriceStat) {
    const all = this.getPriceStats()
    all[ruleName] = stat
    fs.writeJsonSync(this.priceStatsFile, all, { spaces: 2 })
  }

  // ---------- 价格走势序列（按规则，每次采集追加） ----------
  getTrend(ruleName: string): TrendPoint[] {
    const all = fs.readJsonSync(this.trendFile, { throws: false }) || {}
    return all[ruleName] || []
  }

  appendTrend(ruleName: string, point: TrendPoint) {
    const all = fs.readJsonSync(this.trendFile, { throws: false }) || {}
    const list = all[ruleName] || []
    list.push(point)
    // 最多保留 2000 个点（约 40 天 30 分钟粒度），防止无限膨胀
    if (list.length > 2000) list.splice(0, list.length - 2000)
    all[ruleName] = list
    fs.writeJsonSync(this.trendFile, all, { spaces: 2 })
  }
}

export const cbgDataStore = new CbgDataStore()
export default cbgDataStore
