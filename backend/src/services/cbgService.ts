// 藏宝阁服务：通过 recommend.py JSONP API 抓取商品数据（装备/召唤兽/角色）
// 架构说明：
//   - 抓取走 ApiFetcher（HTTP 直连，快/稳），登录态用 cbg-cookies.json（由 cbgLogin.ts 导出）
//   - 浏览器（BrowserFetcher）仅用于登录/刷新 cookie
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { apiFetcher } from './fetchers/index.js'
import config from '../config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 藏宝阁搜索类型 */
export type CbgSearchType = 'overall_search_equip' | 'overall_search_pet' | 'overall_search_role'
export type CbgItemType = 'equip' | 'pet' | 'role'

export const SEARCH_TYPE_TO_ITEM_TYPE: Record<CbgSearchType, CbgItemType> = {
  overall_search_equip: 'equip',
  overall_search_pet: 'pet',
  overall_search_role: 'role',
}

/** 搜索参数（价格单位为元，内部转分） */
export interface CbgSearchParams {
  searchType: CbgSearchType
  page?: number
  count?: number
  /** 服务器类型：3=3年以上服 2=1到3年服 1=1年内服 */
  serverType?: number
  levelMin?: number
  levelMax?: number
  priceMin?: number // 元
  priceMax?: number // 元
  /** 装备类型（kindid：扇10 剑6 刀14 斧5 锤15 枪4 双环13 双剑7 鞭12 爪刺9 魔棒11 飘带8 宝珠52 弓53 法杖54 男衣18 女衣59 男头17 女头58 腰带20 鞋子19 饰品21 灯笼72 巨剑73 伞74 双斧83 棍91） */
  kindid?: number
  specialEffect?: string
  specialSkill?: string
  /** 出售状态：pass_fair_show=已上架 fair_show=公示期 */
  frontStatus?: string
  // ---- 装备属性（数值下限，>=） ----
  /** 初伤（不含命中） */
  initDamageRaw?: number
  /** 初伤（包含命中） */
  initDamage?: number
  /** 总伤 */
  allDamage?: number
  /** 伤害 */
  damage?: number
  /** 初防 */
  initDefense?: number
  /** 初血 */
  initHp?: number
  /** 初敏 */
  initDex?: number
  /** 初灵 */
  initWakan?: number
  /** 总灵 */
  allWakan?: number
  // ---- 属性计算（单项，如"力量 +30"） ----
  /** 属性类型：power=力量 physique=体质 magic=魔力 endurance=耐力 dex=敏捷 */
  sumAttrType?: string
  /** 属性总和阈值（>=） */
  sumAttrValue?: number
  /** 其它透传参数 */
  extra?: Record<string, any>
}

/** recommend.py 返回的原始商品条目 */
export interface CbgRawItem {
  eid: string
  equip_name?: string
  level_desc?: string
  price?: number
  price_desc?: string
  area_name?: string
  server_name?: string
  serverid?: number
  equip_status_desc?: string
  pass_fair_show?: number
  selling_time?: string
  expire_time?: string
  seller_nickname?: string
  desc_sumup?: string
  desc?: string
  equip_type_name?: string
  [key: string]: any
}

class CbgService {
  private baseUrl = 'https://xyq.cbg.163.com/cgi-bin/recommend.py'
  private referer = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py'
  private ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
  private cookieFile = path.resolve(config.dataDir, 'cbg-cookies.json')
  private cookieStr: string | null = null

  /** 加载 cookie（每次调用前检查） */
  loadCookies(): boolean {
    try {
      const arr = JSON.parse(fs.readFileSync(this.cookieFile, 'utf-8'))
      if (!Array.isArray(arr) || arr.length === 0) return false
      this.cookieStr = arr.map((c) => `${c.name}=${c.value}`).join('; ')
      return true
    } catch {
      this.cookieStr = null
      return false
    }
  }

  hasCookies(): boolean {
    return !!this.cookieStr || this.loadCookies()
  }

  /**
   * 执行搜索，返回商品列表
   * @throws 若未登录抛 CBG_NOT_LOGGED_IN；若接口异常抛 CBG_API_ERROR
   */
  async search(params: CbgSearchParams): Promise<CbgRawItem[]> {
    if (!this.hasCookies()) {
      throw new Error('CBG_NOT_LOGGED_IN')
    }

    const page = params.page || 1
    const arg: Record<string, any> = {
      act: 'recommd_by_role',
      page,
      server_type: params.serverType ?? 3,
      count: params.count ?? 15,
      search_type: params.searchType,
      view_loc: 'overall_search',
      callback: 'cb',
    }
    if (params.priceMin != null) arg.price_min = Math.round(params.priceMin * 100)
    if (params.priceMax != null) arg.price_max = Math.round(params.priceMax * 100)
    if (params.levelMin != null) arg.level_min = params.levelMin
    if (params.levelMax != null) arg.level_max = params.levelMax
    if (params.kindid) arg.kindid = params.kindid
    if (params.specialEffect) arg.special_effect = params.specialEffect
    if (params.specialSkill) arg.special_skill = params.specialSkill
    if (params.frontStatus) arg.front_status = params.frontStatus
    // 装备属性
    if (params.initDamageRaw != null) arg.init_damage_raw = params.initDamageRaw
    if (params.initDamage != null) arg.init_damage = params.initDamage
    if (params.allDamage != null) arg.all_damage = params.allDamage
    if (params.damage != null) arg.damage = params.damage
    if (params.initDefense != null) arg.init_defense = params.initDefense
    if (params.initHp != null) arg.init_hp = params.initHp
    if (params.initDex != null) arg.init_dex = params.initDex
    if (params.initWakan != null) arg.init_wakan = params.initWakan
    if (params.allWakan != null) arg.all_wakan = params.allWakan
    // 属性计算（单项）
    if (params.sumAttrType) arg.sum_attr_type = params.sumAttrType
    if (params.sumAttrValue != null) arg.sum_attr_value = params.sumAttrValue
    if (params.extra) {
      for (const [k, v] of Object.entries(params.extra)) {
        if (v != null && v !== '') arg[k] = v
      }
    }

    const raw = await apiFetcher.get<string>(this.baseUrl, arg, {
      headers: {
        'User-Agent': this.ua,
        'Referer': this.referer,
        'Cookie': this.cookieStr!,
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 20000,
      retries: 2,
    })

    const json = this.parseJsonp(String(raw))
    const list: CbgRawItem[] = Array.isArray(json.equip_list) ? json.equip_list : []

    // 登录失效 / 风控判断（status != 1 且无数据，或 msg 含登录提示）
    if (list.length === 0 && json.status !== 1) {
      const msg = String(json.msg || '')
      if (/登录|重新|验证|风控/i.test(msg)) {
        throw new Error(`CBG_AUTH_EXPIRED: ${msg}`)
      }
      throw new Error(`CBG_API_ERROR: status=${json.status} msg=${msg || 'empty'}`)
    }
    return list
  }

  /** 生成商品详情链接 */
  itemUrl(item: CbgRawItem): string {
    if (item.serverid && item.eid) {
      return `https://xyq.cbg.163.com/equip?s=${item.serverid}&eid=${item.eid}`
    }
    return ''
  }

  private parseJsonp(raw: string): any {
    const m = raw.match(/^[^(]*\((.*)\)\s*;?\s*$/s)
    if (!m) return {}
    try {
      return JSON.parse(m[1])
    } catch {
      return {}
    }
  }
}

export const cbgService = new CbgService()
export default cbgService
