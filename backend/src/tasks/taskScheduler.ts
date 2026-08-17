import cron from 'node-cron'
import { dataStore } from '../services/dataStore.js'
import { webScraperService } from '../services/webScraperService.js'
import { twitterService } from '../services/twitterService.js'
import { deepSeekService } from '../services/deepseekService.js'
import { notificationService } from '../services/notificationService.js'
import config from '../config/index.js'

class TaskScheduler {
  private hotspotTaskRunning = false
  private notificationTaskRunning = false
  private lastHotspotRun: string | null = null
  private lastNotificationRun: string | null = null
  private webScraperService = webScraperService

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

      // 也收集不针对特定关键词的热点
      await this.collectTrendingHotspots()

      console.log('✓ Hotspot collection completed')
    } catch (error) {
      console.error('Error collecting hotspots:', error)
    } finally {
      this.hotspotTaskRunning = false
    }
  }

  private async fetchHotspotsForKeyword(keyword: string, category: string) {
    try {
      // 按配置动态收集已启用的数据源
      const sources: { results: any[]; source: string }[] = []
      const { sources: srcConfig } = config

      // Web 搜索（内部按 config 控制百度/Google）
      const webResults = await this.webScraperService.searchKeyword(keyword).catch(() => [])
      sources.push({ results: webResults, source: 'Web' })

      // Twitter（需 TWITTER_ENABLED=true 并填 key）
      if (srcConfig.twitter.enabled) {
        const twitterResults = await twitterService.searchTweets(keyword, 20).catch(() => [])
        sources.push({
          results: twitterResults.map(t => ({
            title: t.text.substring(0, 100),
            description: t.text,
            url: `https://twitter.com/i/web/status/${t.id}`,
            source: 'Twitter',
            timestamp: t.created_at,
          })),
          source: 'Twitter',
        })
      }

      // 知乎（需 ZHIHU_ENABLED=true 并填 cookie）
      if (srcConfig.zhihu.enabled) {
        const zhihuResults = await this.webScraperService.scrapeZhihu().catch(() => [])
        sources.push({ results: zhihuResults, source: 'Zhihu' })
      }

      for (const { results } of sources) {
        for (const item of results) {
          // 使用 DeepSeek AI 识别真实热点
          const analysis = await deepSeekService.analyzeHotspot(
            item.title,
            item.description,
            [keyword]
          )

          if (analysis.isRealTrend && analysis.relevanceScore >= 5) {
            // 添加热点
            await dataStore.addHotspot({
              title: item.title,
              description: item.description,
              source: item.source || 'Unknown',
              category: analysis.category,
              score: analysis.relevanceScore,
              trend: Math.random() > 0.5 ? Math.round(Math.random() * 100) - 50 : 0,
              url: item.url,
              timestamp: item.timestamp || new Date().toISOString(),
              keywords: [keyword],
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching hotspots for keyword "${keyword}":`, error)
    }
  }

  private async collectTrendingHotspots() {
    // 未启用 Twitter 数据源时跳过（避免 mock 数据污染）
    if (!config.sources.twitter.enabled) {
      return
    }

    try {
      // 收集Twitter热点
      const trendingTags = await twitterService.getTrendingHashtags()
      for (const tag of trendingTags.slice(0, 5)) {
        const cleanTag = tag.replace('#', '')
        const tweets = await twitterService.searchTweets(cleanTag, 10)

        for (const tweet of tweets) {
          const analysis = await deepSeekService.analyzeHotspot(
            tweet.text,
            tweet.text,
            [cleanTag]
          )

          if (analysis.isRealTrend) {
            await dataStore.addHotspot({
              title: tweet.text.substring(0, 100),
              description: tweet.text,
              source: 'Twitter Trending',
              category: analysis.category,
              score: Math.min(analysis.relevanceScore + 2, 10),
              trend: tweet.public_metrics.retweet_count + tweet.public_metrics.like_count,
              url: `https://twitter.com/i/web/status/${tweet.id}`,
              timestamp: tweet.created_at,
              keywords: [cleanTag],
            })
          }
        }
      }
    } catch (error) {
      console.error('Error collecting trending hotspots:', error)
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
