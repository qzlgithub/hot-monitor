// 藏宝阁监控调度：按搜索规则定时采集（装备/召唤兽），取最低价前 topN 入库并记录价格历史
import config from '../config/index.js'
import { cbgService, type CbgSearchType, type CbgItemType, type CbgRawItem } from './cbgService.js'
import { cbgDataStore } from './cbgDataStore.js'

const ITEM_TYPE_TO_SEARCH_TYPE: Record<CbgItemType, CbgSearchType> = {
  equip: 'overall_search_equip',
  pet: 'overall_search_pet',
  role: 'overall_search_role',
}

/** 服务器类型映射：3y=3年以上服 1to3y=1到3年服 1y=1年内服 */
function serverTypeFromConfig(serverAge: string): number {
  switch (serverAge) {
    case '3y': return 3
    case '1to3y': return 2
    case '1y': return 1
    default: return 3
  }
}

class CbgMonitorService {
  private running = false
  private lastRun: string | null = null
  private lastResult: { rules: number; items: number; errors: string[] } | null = null

  getStatus() {
    return {
      running: this.running,
      lastRun: this.lastRun,
      lastResult: this.lastResult,
      interval: config.cbg.interval,
      hasCookies: cbgService.hasCookies(),
    }
  }

  /** 手动/定时触发采集（内部防重入）
   *  @param onlyFast 为 true 时只采集 priority='fast' 的高频规则（15 分钟轮）
   */
  async collect(onlyFast = false): Promise<{ rules: number; items: number; errors: string[] }> {
    if (this.running) {
      return { rules: 0, items: 0, errors: ['采集已在进行中'] }
    }
    this.running = true
    this.lastRun = new Date().toISOString()
    const errors: string[] = []
    let totalNew = 0
    try {
      if (!cbgService.hasCookies()) {
        errors.push('未找到藏宝阁登录态（cbg-cookies.json），请先运行 cbgLogin.ts')
        this.lastResult = { rules: 0, items: 0, errors }
        return this.lastResult
      }

      let rules = cbgDataStore.getRules().filter((r) => r.enabled)
      if (onlyFast) {
        rules = rules.filter((r) => r.priority === 'fast')
      }
      const serverType = serverTypeFromConfig(config.cbg.serverAge)
      const maxPages = config.cbg.maxPages || 2

      for (const rule of rules) {
        const searchType = ITEM_TYPE_TO_SEARCH_TYPE[rule.type] || 'overall_search_equip'
        const collected: CbgRawItem[] = []
        // 翻页收集所有符合条件的候选
        for (let page = 1; page <= maxPages; page++) {
          try {
            const list = await cbgService.search({
              searchType,
              page,
              serverType,
              ...rule.conditions,
            })
            collected.push(...list)
            // 少于 count（15）说明无更多页，提前结束翻页
            if (list.length < 15) break
          } catch (e: any) {
            errors.push(`规则「${rule.name}」第${page}页: ${e.message}`)
            break
          }
        }
        // 按价格升序，取最低价前 topN 条入库
        const topN = rule.topN || 10
        collected
          .filter((x) => x.eid)
          .sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
          .slice(0, topN)
          .forEach((raw) => {
            const { isNew } = cbgDataStore.upsertItem(raw, rule.type, [rule.name])
            if (isNew) totalNew++
          })

        // 更新该规则的市场价基线（用本次采集到的在售商品价格，价格单位分→元）
        const prices = collected
          .map((x) => (x.price ?? 0) / 100)
          .filter((p) => p > 0)
        if (prices.length > 0) {
          const sorted = [...prices].sort((a, b) => a - b)
          const median = sorted[Math.floor(sorted.length / 2)]
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length
          const now = new Date().toISOString()
          const stat = {
            median,
            avg,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            sampleCount: prices.length,
            updatedAt: now,
          }
          cbgDataStore.updatePriceStat(rule.name, stat)
          // 追加价格走势点（供走势图）
          cbgDataStore.appendTrend(rule.name, {
            ts: now,
            median,
            avg,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            sampleCount: prices.length,
          })
        }
      }
      this.lastResult = { rules: rules.length, items: totalNew, errors }
      return this.lastResult
    } catch (e: any) {
      const msg = `藏宝阁采集异常: ${e.message}`
      errors.push(msg)
      this.lastResult = { rules: 0, items: 0, errors }
      return this.lastResult
    } finally {
      this.running = false
    }
  }
}

export const cbgMonitorService = new CbgMonitorService()
export default cbgMonitorService
