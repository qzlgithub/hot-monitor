import config from '../../config/index.js'
import { bilibiliService, type BiliVideo } from '../bilibiliService.js'
import type { SourceAdapter, SourceItem } from './types.js'

const toItem = (v: BiliVideo): SourceItem => ({
  id: v.id,
  title: v.title,
  description: `${v.description} UP主:${v.author} 播放:${v.play}`,
  url: v.url,
  source: 'Bilibili',
  timestamp: v.pubdate,
  trend: v.play,
  pic: v.pic,
  author: v.author,
  category: v.category,
  like: v.like,
})

// B 站（默认启用，无需 key；关键词搜索已按播放量过滤低热度内容）
export const bilibiliAdapter: SourceAdapter = {
  id: 'bilibili',
  label: 'B站',
  isEnabled: () => config.sources.bilibili.enabled,
  async search(keyword: string, limit: number): Promise<SourceItem[]> {
    const list = await bilibiliService.searchVideos(keyword, limit)
    return list.map(toItem)
  },
}
