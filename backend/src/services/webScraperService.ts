import axios from 'axios'
import * as cheerio from 'cheerio'
import { v4 as uuid } from 'uuid'
import config from '../config/index.js'

interface ScrapedContent {
  title: string
  description: string
  url: string
  source: string
  timestamp: string
}

class WebScraperService {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  // 新闻网站配置
  private newsSourcesConfig = [
    {
      name: '新浪新闻',
      url: 'https://news.sina.com.cn',
      selector: 'a.txt-box',
      titleAttr: 'title',
    },
    {
      name: '腾讯新闻',
      url: 'https://news.qq.com',
      selector: 'a.news-box',
      titleAttr: 'title',
    },
  ]

  // 从指定网站爬取热点
  async scrapeWebsite(url: string, keyword: string): Promise<ScrapedContent[]> {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)
      const results: ScrapedContent[] = []

      // 查找包含关键词的标题
      $('a, h1, h2, h3').each((_, element) => {
        const text = $(element).text()
        const href = $(element).attr('href') || url

        if (text.includes(keyword) && text.length > 10 && text.length < 200) {
          results.push({
            title: text.trim(),
            description: text.substring(0, 100),
            url: this.normalizeUrl(href, url),
            source: this.extractDomain(url),
            timestamp: new Date().toISOString(),
          })
        }
      })

      return results.slice(0, 10) // 最多返回10条
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error)
      return []
    }
  }

  // 从RSS源爬取
  async scrapeRSS(rssUrl: string, keyword: string): Promise<ScrapedContent[]> {
    try {
      const response = await axios.get(rssUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const results: ScrapedContent[] = []

      $('item').each((_, element) => {
        const title = $(element).find('title').text()
        const description = $(element).find('description').text()
        const link = $(element).find('link').text()

        if (title.includes(keyword)) {
          results.push({
            title: title.substring(0, 200),
            description: description.substring(0, 500),
            url: link || rssUrl,
            source: this.extractDomain(rssUrl),
            timestamp: new Date().toISOString(),
          })
        }
      })

      return results.slice(0, 10)
    } catch (error) {
      console.error(`Failed to scrape RSS ${rssUrl}:`, error)
      return []
    }
  }

  // 从搜索引擎结果爬取（按 config.sources 控制启用的引擎）
  async searchKeyword(keyword: string): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = []
    const { sources } = config

    // 百度搜索（默认启用，无需 key）
    if (sources.baidu.enabled) {
      try {
        const content = await this.scrapeWebsite(
          `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
          keyword
        )
        results.push(...content)
      } catch (error) {
        console.error(`Baidu search failed for ${keyword}:`, error)
      }
    }

    // Google 搜索（需在 .env 设置 GOOGLE_ENABLED=true 并填 key 后启用）
    if (sources.google.enabled && sources.google.apiKey) {
      try {
        const content = await this.scrapeWebsite(
          `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
          keyword
        )
        results.push(...content)
      } catch (error) {
        console.error(`Google search failed for ${keyword}:`, error)
      }
    }

    return results
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) {
      const base = new URL(baseUrl)
      return `${base.protocol}//${base.host}${url}`
    }
    return baseUrl
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname
      return domain?.replace('www.', '') || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // 爬取知乎热点
  async scrapeZhihu(): Promise<ScrapedContent[]> {
    try {
      // 知乎实时热搜 API
      const response = await axios.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      })

      const results: ScrapedContent[] = []
      const data = response.data.data || []

      data.slice(0, 20).forEach((item: any) => {
        results.push({
          title: item.target?.title || item.title || '知乎热点',
          description: item.target?.excerpt || '知乎热点话题',
          url: item.target?.url || 'https://zhihu.com',
          source: 'Zhihu',
          timestamp: new Date().toISOString(),
        })
      })

      return results
    } catch (error) {
      console.error('Failed to scrape Zhihu:', error)
      return []
    }
  }

  // 爬取小红书热点
  async scrapeRedbook(): Promise<ScrapedContent[]> {
    try {
      // 小红书热搜页面
      const response = await axios.get('https://www.xiaohongshu.com/explore', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data)
      const results: ScrapedContent[] = []

      // 提取热搜词汇
      $('.search-keywords-item').each((_, element) => {
        const text = $(element).text()
        results.push({
          title: text.trim(),
          description: '小红书热搜',
          url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(text)}`,
          source: 'Xiaohongshu',
          timestamp: new Date().toISOString(),
        })
      })

      return results.slice(0, 20)
    } catch (error) {
      console.error('Failed to scrape Redbook:', error)
      return []
    }
  }
}

export const webScraperService = new WebScraperService()
