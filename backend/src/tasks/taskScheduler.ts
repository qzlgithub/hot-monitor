import cron from 'node-cron'
import { dataStore, type TrendingVideo } from '../services/dataStore.js'
import { deepSeekService } from '../services/deepseekService.js'
import { notificationService } from '../services/notificationService.js'
import config from '../config/index.js'
import { getEnabledSources, type SourceItem } from '../services/sources/index.js'

class TaskScheduler {
  private hotspotTaskRunning = false
  private notificationTaskRunning = false
  private lastHotspotRun: string | null = null
  private lastNotificationRun: string | null = null

  startTasks() {
    console.log('Starting task scheduler...')

    // 定时收集热点 (每30分钟或自定义间隔)
    const hotspotInterval = config.tasks.hotspotFetchInterval || 30
    cron.schedule(`*/${hotspotInterval} * * * *`, () => this.collectHotspots())

    // 定时检查通知 (每5分钟或自定义间隔)
    const notificationInterval = config.tasks.notificationCheckInterval || 5
    cron.schedule(`*/${notificationInterval} * * * *`, () => this.checkNotifications())

    console.log(`✓ Hotspot collection scheduled every ${hotspotInterval} minutes`)
    console.log(`✓ Notification check scheduled every ${notificationInterval} minutes`)
  }

  // 获取任务运行状态
  getStatus() {
    return {
      hotspotRunning: this.hotspotTaskRunning,
      notificationRunning: this.notificationTaskRunning,
      lastHotspotRun: this.lastHotspotRun,
      lastNotificationRun: this.lastNotificationRun,
      hotspotInterval: config.tasks.hotspotFetchInterval || 30,
      notificationInterval: config.tasks.notificationCheckInterval || 5,
    }
  }

  // 立即手动检查：触发热点收集 + 通知检查（后台异步执行，立即返回）
  runManualCheck() {
    console.log('⚡ Manual check triggered by user...')

    const hotspotAlreadyRunning = this.hotspotTaskRunning
    const notificationAlreadyRunning = this.notificationTaskRunning

    // 后台异步执行，不阻塞 HTTP 响应
    Promise.allSettled([
      this.collectHotspots(),
      this.checkNotifications(),
    ]).then(results => {
      console.log('✓ Manual check finished:', results.map(r => r.status).join(', '))
    }).catch(err => {
      console.error('Error in manual check:', err)
    })

    return {
      success: true,
      message: '检查已在后台启动',
      hotspotStarted: !hotspotAlreadyRunning,
      notificationStarted: !notificationAlreadyRunning,
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
        await this.fetchHotspotsForKeyword(kw.keyword, kw.category)
      }

      // 收集各数据源的「热门发现」板块（如 B 站全站热门）
      await this.collectTrendingFromSources()

      console.log('✓ Hotspot collection completed')
    } catch (error) {
      console.error('Error collecting hotspots:', error)
    } finally {
      this.hotspotTaskRunning = false
    }
  }

  private async fetchHotspotsForKeyword(keyword: string, category: string) {
    try {
      // 通过「数据源注册表」统一收集所有已启用数据源的关键词结果
      const collected: SourceItem[] = []
      for (const adapter of getEnabledSources()) {
        const items = await adapter.search(keyword, 20).catch(() => [] as SourceItem[])
        collected.push(...items)
      }

      for (const item of collected) {
        // 使用 DeepSeek AI 识别真实热点
        const analysis = await deepSeekService.analyzeHotspot(
          item.title,
          item.description,
          [keyword]
        )

        // 内容平台（B站等，已通过播放量门槛过滤）：相关性达标即可入库；
        // 其他来源（新闻/搜索）仍要求 isRealTrend 真实热点判断
        const isPlatform = item.source === 'Bilibili'
        const minScore = config.ai.minScore
        const pass = isPlatform
          ? analysis.relevanceScore >= minScore
          : (analysis.isRealTrend && analysis.relevanceScore >= minScore)

        if (pass) {
          // 添加热点
          await dataStore.addHotspot({
            title: item.title,
            description: item.description,
            source: item.source || 'Unknown',
            category: analysis.category,
            score: analysis.relevanceScore,
            // 有真实热度（如 B 站播放量）则用它，否则保留原有随机趋势
            trend: item.trend ?? (Math.random() > 0.5 ? Math.round(Math.random() * 100) - 50 : 0),
            url: item.url,
            timestamp: item.timestamp || new Date().toISOString(),
            keywords: [keyword],
          })
        }
      }
    } catch (error) {
      console.error(`Error fetching hotspots for keyword "${keyword}":`, error)
    }
  }

  // 收集各数据源的「热门发现」板块（实现了 fetchTrending 的源）→ 存入独立板块（与关键词热点分开）
  private async collectTrendingFromSources() {
    for (const adapter of getEnabledSources()) {
      if (!adapter.fetchTrending) continue

      try {
        const items = await adapter.fetchTrending(20)
        if (items.length === 0) continue

        const videos = items.map((i): Omit<TrendingVideo, 'collectedAt'> => ({
          id: i.id || '',
          title: i.title,
          description: i.description,
          url: i.url,
          author: i.author || '',
          play: i.trend || 0,
          like: i.like || 0,
          pic: i.pic || '',
          category: i.category || '',
          pubdate: i.timestamp,
        }))
        await dataStore.saveTrendingVideos(videos)
        console.log(`✓ Saved ${videos.length} trending videos from ${adapter.label}`)
      } catch (error) {
        console.error(`Error collecting trending from ${adapter.id}:`, error)
      }
    }
  }

  // 检查并发送通知
  async checkNotifications() {
    if (this.notificationTaskRunning) {
      console.log('Notification check already running, skipping...')
      return
    }

    this.notificationTaskRunning = true
    this.lastNotificationRun = new Date().toISOString()
    console.log('🔔 Checking for notifications...')

    try {
      const keywords = await dataStore.getKeywords()
      const hotspots = await dataStore.getHotspots()
      const existingNotifications = await dataStore.getNotifications()

      // 已通知过的热点 id（按 hotspotId 去重，避免重复通知）
      const notifiedHotspotIds = new Set(
        existingNotifications.map(n => n.hotspotId).filter(Boolean)
      )

      for (const kw of keywords) {
        if (!kw.isActive) continue

        const relevantHotspots = hotspots.filter(h =>
          h.keywords.includes(kw.keyword) && !notifiedHotspotIds.has(h.id)
        )

        for (const hotspot of relevantHotspots) {
          // 创建通知（记录 hotspotId 用于去重 + url 用于跳转详情）
          const notification = await dataStore.addNotification({
            title: hotspot.title,
            message: `"${kw.keyword}" 相关的新热点已发现`,
            type: hotspot.score >= 7 ? 'warning' : 'info',
            keyword: kw.keyword,
            source: hotspot.source,
            timestamp: new Date().toISOString(),
            read: false,
            hotspotId: hotspot.id,
            url: hotspot.url,
          })

          // 发送邮件通知（可选）
          // await notificationService.sendHotspotNotification(...)

          console.log(`✓ Notification created for keyword: ${kw.keyword}`)
        }
      }

      console.log('✓ Notification check completed')
    } catch (error) {
      console.error('Error checking notifications:', error)
    } finally {
      this.notificationTaskRunning = false
    }
  }
}

export const taskScheduler = new TaskScheduler()
