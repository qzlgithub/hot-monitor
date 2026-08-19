import cron from 'node-cron'
import { dataStore, type Keyword } from '../services/dataStore.js'
import { deepSeekService } from '../services/deepseekService.js'
import { keywordExpansionService } from '../services/keywordExpansionService.js'
import config from '../config/index.js'
import { getEnabledSources, type SourceItem } from '../services/sources/index.js'

class TaskScheduler {
  private hotspotTaskRunning = false
  private lastHotspotRun: string | null = null

  startTasks() {
    console.log('Starting task scheduler...')

    // 定时收集热点 (每30分钟或自定义间隔)
    const hotspotInterval = config.tasks.hotspotFetchInterval || 30
    cron.schedule(`*/${hotspotInterval} * * * *`, () => this.collectHotspots())

    console.log(`✓ Hotspot collection scheduled every ${hotspotInterval} minutes`)
  }

  // 获取任务运行状态
  getStatus() {
    return {
      hotspotRunning: this.hotspotTaskRunning,
      lastHotspotRun: this.lastHotspotRun,
      hotspotInterval: config.tasks.hotspotFetchInterval || 30,
    }
  }

  // 立即手动检查：触发热点收集（后台异步执行，立即返回）
  runManualCheck() {
    console.log('⚡ Manual check triggered by user...')

    const hotspotAlreadyRunning = this.hotspotTaskRunning

    // 后台异步执行，不阻塞 HTTP 响应
    this.collectHotspots().then(() => {
      console.log('✓ Manual check finished')
    }).catch(err => {
      console.error('Error in manual check:', err)
    })

    return {
      success: true,
      message: '检查已在后台启动',
      hotspotStarted: !hotspotAlreadyRunning,
    }
  }

  // 收集热点
  async collectHotspots() {
    if (this.hotspotTaskRunning) {
      console.log('Hotspot collection already running, skipping...')
      return
    }

    this.hotspotTaskRunning = true
    this.lastHotspotRun = new Date().toISOString()
    console.log('🔍 Starting hotspot collection...')

    try {
      const keywords = await dataStore.getKeywords()
      const activeKeywords = keywords.filter(k => k.isActive)

      for (const kw of activeKeywords) {
        await this.fetchHotspotsForKeyword(kw)
      }

      // 清理历史遗留的重复热点 + 无关键词支持的孤儿热点（每次收集后兜底，内部实时读取 active 关键词）
      await dataStore.dedupeHotspots()
      await dataStore.cleanupOrphanHotspots()

      console.log('✓ Hotspot collection completed')
    } catch (error) {
      console.error('Error collecting hotspots:', error)
    } finally {
      this.hotspotTaskRunning = false
    }
  }

  private async fetchHotspotsForKeyword(kw: Keyword) {
    try {
      // 关键词扩展：原词 + LLM 生成变体（缓存在 kw.expansions），提高召回率
      const variants = await this.getVariants(kw)

      // 通过「数据源注册表」统一收集所有已启用数据源的各变体搜索结果（按 URL 去重合并）
      const collected: SourceItem[] = []
      const seenUrls = new Set<string>()
      for (const adapter of getEnabledSources()) {
        for (const variant of variants) {
          const items = await adapter.search(variant, 20).catch(() => [] as SourceItem[])
          for (const item of items) {
            if (!item.url || seenUrls.has(item.url)) continue
            seenUrls.add(item.url)
            collected.push(item)
          }
        }
      }

      for (const item of collected) {
        // 使用 DeepSeek AI 识别真实热点（相关性判断仍以原关键词为准）
        const analysis = await deepSeekService.analyzeHotspot(
          item.title,
          item.description,
          [kw.keyword]
        )

        // 内容平台（B站等，已通过播放量门槛过滤）：相关性达标即可入库；
        // 其他来源（新闻/搜索）仍要求 isRealTrend 真实热点判断
        const isPlatform = item.source === 'Bilibili'
        const minScore = config.ai.minScore
        const pass = isPlatform
          ? analysis.relevanceScore >= minScore
          : (analysis.isRealTrend && analysis.relevanceScore >= minScore)

        if (pass) {
          // 添加热点（upsert：同 URL 只更新，不重复入库）
          await dataStore.addHotspot({
            title: item.title,
            description: item.description,
            source: item.source || 'Unknown',
            category: analysis.category,
            score: analysis.relevanceScore,
            // 有真实热度（如 B 站播放量）则用它，否则为 0（不再造随机数，避免脏数据参与排序/展示）
            trend: item.trend ?? 0,
            url: item.url,
            timestamp: item.timestamp || new Date().toISOString(),
            keywords: [kw.keyword],
            reasoning: analysis.reasoning,
            keywordMentioned: analysis.keywordMentioned,
            relevanceType: analysis.relevanceType,
          })
        }
      }
    } catch (error) {
      console.error(`Error fetching hotspots for keyword "${kw.keyword}":`, error)
    }
  }

  // 获取关键词变体：优先用已缓存（Keyword.expansions），否则调用 LLM 生成并回写存储
  private async getVariants(kw: Keyword): Promise<string[]> {
    const cached = kw.expansions?.length ? kw.expansions : null
    if (cached) return cached.slice(0, config.keywordExpansion.variantCount || 5)
    const generated = await keywordExpansionService.expand(kw.keyword)
    await dataStore
      .updateKeyword(kw.id, { expansions: generated, lastUpdated: new Date().toISOString() })
      .catch(() => {})
    return generated
  }
}

export const taskScheduler = new TaskScheduler()
