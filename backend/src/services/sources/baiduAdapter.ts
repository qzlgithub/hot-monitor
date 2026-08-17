import config from '../../config/index.js'
import { webScraperService } from '../webScraperService.js'
import type { SourceAdapter, SourceItem } from './types.js'

// 百度搜索（默认关闭；需要时 .env 设 BAIDU_ENABLED=true）
export const baiduAdapter: SourceAdapter = {
  id: 'baidu',
  label: '百度',
  isEnabled: () => config.sources.baidu.enabled,
  async search(keyword: string, limit: number): Promise<SourceItem[]> {
    const results = await webScraperService.searchKeyword(keyword)
    return results.slice(0, limit).map(r => ({
      title: r.title,
      description: r.description,
      url: r.url,
      source: r.source || 'baidu.com',
      timestamp: r.timestamp,
    }))
  },
}
