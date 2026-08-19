import axios from 'axios'
import config from '../config/index.js'

// B 站视频统一结构（供 taskScheduler / 其他服务使用）
export interface BiliVideo {
  id: string
  title: string
  description: string
  url: string
  author: string
  play: number
  like: number
  pic: string
  category: string
  pubdate: string
}

class BilibiliService {
  private baseUrl = 'https://api.bilibili.com'
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  private referer = 'https://www.bilibili.com/'

  isEnabled(): boolean {
    return config.sources.bilibili.enabled
  }

  private headers() {
    return {
      'User-Agent': this.userAgent,
      'Referer': this.referer,
    }
  }

  // 清理搜索结果的 <em class="keyword"> 高亮标签
  private cleanTitle(title: string): string {
    return (title || '').replace(/<[^>]+>/g, '').trim()
  }

  // B 站返回的是 unix 秒时间戳，转 ISO 字符串
  private toIso(pubdate?: number | string): string {
    const ts = Number(pubdate)
    if (!ts || isNaN(ts)) return new Date().toISOString()
    return new Date(ts * 1000).toISOString()
  }

  // 封面地址补全 https 前缀
  private normalizePic(pic: string): string {
    const p = pic || ''
    return p.startsWith('//') ? `https:${p}` : p
  }

  // 按关键词搜索视频（公开接口；支持翻页提高候选池，可能偶发风控，失败时降级返回已收集结果）
  async searchVideos(keyword: string, pageSize = 20, maxPages = 3): Promise<BiliVideo[]> {
    if (!this.isEnabled()) return []

    const minPlay = config.sources.bilibili.minPlay || 50000
    const seen = new Set<string>()
    const results: BiliVideo[] = []

    for (let pn = 1; pn <= maxPages && results.length < pageSize; pn++) {
      try {
        const response = await axios.get(`${this.baseUrl}/x/web-interface/search/all/v2`, {
          params: { keyword, pn },
          headers: this.headers(),
          timeout: 15000,
        })

        const blocks = response.data?.data?.result
        if (!Array.isArray(blocks)) break

        const videoBlock = blocks.find((b: any) => b.result_type === 'video')
        const list: any[] = videoBlock?.data || []
        if (list.length === 0) break

        for (const v of list) {
          if (Number(v.play) < minPlay) continue
          const bvid = v.bvid
          if (!bvid || seen.has(bvid)) continue
          seen.add(bvid)
          results.push({
            id: bvid,
            title: this.cleanTitle(v.title || ''),
            description: v.description || v.desc || '',
            url: `https://www.bilibili.com/video/${bvid}`,
            author: v.author || v.uname || '',
            play: v.play || 0,
            like: v.like || 0,
            pic: this.normalizePic(v.pic || ''),
            category: v.typename || '',
            pubdate: this.toIso(v.pubdate),
          })
          if (results.length >= pageSize) break
        }

        // 翻页间隔，降低风控概率
        if (pn < maxPages && results.length < pageSize) await this.sleep(300)
      } catch (error: any) {
        console.error(`Bilibili search 请求失败(pn=${pn}):`, error.response?.data || error.message)
        break
      }
    }

    return results
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const bilibiliService = new BilibiliService()
export default bilibiliService
