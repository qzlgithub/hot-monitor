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

  // 获取全站热门视频（公开接口，无需登录）
  async getPopularVideos(page = 1, pageSize = 20): Promise<BiliVideo[]> {
    if (!this.isEnabled()) return []

    try {
      const response = await axios.get(`${this.baseUrl}/x/web-interface/popular`, {
        params: { pn: page, ps: Math.min(pageSize, 50) },
        headers: this.headers(),
        timeout: 15000,
      })

      const list = response.data?.data?.list
      if (!Array.isArray(list)) return []

      return list.map((v: any): BiliVideo => ({
        id: v.bvid || String(v.aid || ''),
        title: (v.title || '').trim(),
        description: v.desc || '',
        url: `https://www.bilibili.com/video/${v.bvid}`,
        author: v.owner?.name || '',
        play: v.stat?.view || 0,
        like: v.stat?.like || 0,
        pic: this.normalizePic(v.pic || ''),
        category: v.tname || '',
        pubdate: this.toIso(v.pubdate),
      }))
    } catch (error: any) {
      console.error('Bilibili popular 请求失败:', error.response?.data || error.message)
      return []
    }
  }

  // 按关键词搜索视频（公开接口；可能偶发风控，失败时返回空数组，由上层回退热门列表）
  async searchVideos(keyword: string, pageSize = 20): Promise<BiliVideo[]> {
    if (!this.isEnabled()) return []

    try {
      const response = await axios.get(`${this.baseUrl}/x/web-interface/search/all/v2`, {
        params: { keyword },
        headers: this.headers(),
        timeout: 15000,
      })

      const blocks = response.data?.data?.result
      if (!Array.isArray(blocks)) return []

      const videoBlock = blocks.find((b: any) => b.result_type === 'video')
      const list: any[] = videoBlock?.data || []

      // 热度过滤：丢弃播放量低于阈值（默认 5 万）的视频，避免作者随手发的内容混入
      const minPlay = config.sources.bilibili.minPlay || 50000
      return list
        .filter((v: any) => Number(v.play) >= minPlay)
        .slice(0, pageSize)
        .map((v: any): BiliVideo => ({
        id: v.bvid || String(v.aid || ''),
        title: this.cleanTitle(v.title || ''),
        description: v.description || v.desc || '',
        url: `https://www.bilibili.com/video/${v.bvid}`,
        author: v.author || v.uname || '',
        play: v.play || 0,
        like: v.like || 0,
        pic: this.normalizePic(v.pic || ''),
        category: v.typename || '',
        pubdate: this.toIso(v.pubdate),
      }))
    } catch (error: any) {
      console.error('Bilibili search 请求失败:', error.response?.data || error.message)
      return []
    }
  }
}

export const bilibiliService = new BilibiliService()
export default bilibiliService
