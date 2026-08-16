import axios from 'axios'
import config from '../config/index.js'

interface Tweet {
  id: string
  text: string
  author_id: string
  created_at: string
  public_metrics: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
}

class TwitterService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = config.twitter.apiKey
    this.apiUrl = config.twitter.apiUrl
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey
  }

  // 搜索推文（需要Twitter API v2访问权限）
  async searchTweets(query: string, maxResults = 100): Promise<Tweet[]> {
    if (!this.apiKey) {
      console.warn('Twitter API not configured, returning mock data')
      return this.getMockTweets(query)
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/tweets/search/recent`,
        {
          params: {
            query,
            'max_results': Math.min(maxResults, 100),
            'tweet.fields': 'public_metrics,created_at',
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      )

      return response.data.data || []
    } catch (error: any) {
      console.error('Twitter API error:', error.message)
      // 降级到模拟数据
      return this.getMockTweets(query)
    }
  }

  // 获取推文流（需要更高级的访问权限）
  async getTrendingHashtags(): Promise<string[]> {
    if (!this.apiKey) {
      return this.getMockTrending()
    }

    try {
      // 实际API调用会更复杂
      const response = await axios.get(
        `${this.apiUrl}/trends/place`,
        {
          params: { id: 1 }, // 1 是全球ID
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      )

      return response.data[0]?.trends?.map((t: any) => t.name) || []
    } catch (error) {
      console.error('Failed to fetch trending hashtags:', error)
      return this.getMockTrending()
    }
  }

  // 模拟推文数据（用于演示）
  private getMockTweets(keyword: string): Tweet[] {
    return [
      {
        id: '1',
        text: `关于 ${keyword} 的热门推文 - 这是一条包含相关信息的推文`,
        author_id: 'user123',
        created_at: new Date().toISOString(),
        public_metrics: {
          retweet_count: 1234,
          reply_count: 567,
          like_count: 8901,
          quote_count: 234,
        },
      },
      {
        id: '2',
        text: `最新消息：${keyword} 相关事件发展。请查看详情了解更多。`,
        author_id: 'user456',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        public_metrics: {
          retweet_count: 567,
          reply_count: 234,
          like_count: 4567,
          quote_count: 123,
        },
      },
    ]
  }

  private getMockTrending(): string[] {
    return [
      '#AI编程',
      '#ChatGPT最新',
      '#技术前沿',
      '#编程教程',
      '#Web开发',
      '#全栈开发',
      '#JavaScript',
      '#TypeScript',
      '#React最新',
      '#Node.js',
    ]
  }
}

export const twitterService = new TwitterService()
