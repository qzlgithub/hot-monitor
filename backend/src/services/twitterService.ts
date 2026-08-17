import axios from 'axios'
import config from '../config/index.js'

// twitterapi.io 返回的推文结构（camelCase）
interface TwitterApiIOTweet {
  type?: string
  id: string
  url?: string
  text: string
  retweetCount?: number
  replyCount?: number
  likeCount?: number
  quoteCount?: number
  viewCount?: number
  createdAt?: string // 格式: "Tue Dec 10 07:00:30 +0000 2024"
  lang?: string
  bookmarkCount?: number
  author?: {
    id?: string
    userName?: string
    name?: string
    followers?: number
    isBlueVerified?: boolean
    profilePicture?: string
    url?: string
  }
}

// 统一对外的推文接口（供 taskScheduler / 其他服务使用）
export interface Tweet {
  id: string
  text: string
  author_id: string
  author_name?: string
  username?: string
  created_at: string
  url?: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
    view_count?: number
  }
}

class TwitterService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = config.twitter.apiKey
    this.apiUrl = config.twitter.apiUrl || 'https://api.twitterapi.io'
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey
  }

  private headers() {
    return { 'X-API-Key': this.apiKey }
  }

  // 解析 twitterapi.io 的 createdAt（"Tue Dec 10 07:00:30 +0000 2024"）为 ISO 字符串
  private parseCreatedAt(value?: string): string {
    if (!value) return new Date().toISOString()
    const date = new Date(value)
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
  }

  private mapTweet(t: TwitterApiIOTweet): Tweet {
    return {
      id: t.id,
      text: t.text,
      author_id: t.author?.id || '',
      author_name: t.author?.name || '',
      username: t.author?.userName || '',
      created_at: this.parseCreatedAt(t.createdAt),
      url: t.url || (t.id ? `https://twitter.com/i/web/status/${t.id}` : ''),
      public_metrics: {
        retweet_count: t.retweetCount || 0,
        reply_count: t.replyCount || 0,
        like_count: t.likeCount || 0,
        quote_count: t.quoteCount || 0,
        view_count: t.viewCount || 0,
      },
    }
  }

  // 搜索推文（twitterapi.io /twitter/tweet/advanced_search，Latest 排序，只取最近 hours 小时）
  async searchTweets(query: string, maxResults = 20, hours = 24 * 7): Promise<Tweet[]> {
    if (!this.apiKey) {
      console.warn('Twitter API not configured（需要 twitterapi.io 的 X-API-Key），返回空结果')
      return []
    }

    const tweets: Tweet[] = []
    let cursor = ''
    const maxPages = 5 // 最多拉 5 页（每页 ≤ 20 条），控制请求消耗

    try {
      // 只搜索最近 N 小时的推文，保证"最新信息"
      const sinceTime = Math.floor((Date.now() - hours * 3600 * 1000) / 1000)
      const advancedQuery = `${query} since_time:${sinceTime}`

      for (let page = 0; page < maxPages && tweets.length < maxResults; page++) {
        const response = await axios.get(
          `${this.apiUrl}/twitter/tweet/advanced_search`,
          {
            params: {
              query: advancedQuery,
              queryType: 'Latest',
              cursor,
            },
            headers: this.headers(),
            timeout: 15000,
          }
        )

        const data = response.data || {}
        const pageTweets: TwitterApiIOTweet[] = Array.isArray(data.tweets) ? data.tweets : []
        tweets.push(...pageTweets.map(t => this.mapTweet(t)))

        if (!data.has_next_page) break
        cursor = data.next_cursor || ''
        if (!cursor) break
      }

      return tweets.slice(0, maxResults)
    } catch (error: any) {
      console.error('twitterapi.io advanced_search 请求失败:', error.response?.data || error.message)
      return []
    }
  }

  // 获取全球趋势话题（twitterapi.io /twitter/trends）
  async getTrendingHashtags(): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('Twitter API not configured，返回空趋势')
      return []
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/twitter/trends`,
        { headers: this.headers(), timeout: 15000 }
      )
      const data = response.data
      // 兼容 { trends: [...] } / 数组 两种返回；趋势项可能是 { name } / { trend } / 字符串
      const raw = Array.isArray(data) ? data : (data?.trends ?? [])
      return raw
        .map((t: any) => (typeof t === 'string' ? t : (t?.name || t?.trend || '')))
        .filter((name: string) => !!name)
    } catch (error: any) {
      console.error('twitterapi.io trends 请求失败:', error.response?.data || error.message)
      return []
    }
  }
}

export const twitterService = new TwitterService()
export default twitterService
