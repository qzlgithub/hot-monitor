import config from '../../config/index.js'
import { webScraperService } from '../webScraperService.js'
import type { SourceAdapter, SourceItem } from './types.js'

// 知乎热搜（默认关闭；需要时 .env 设 ZHIHU_ENABLED=true 并填 Cookie）
export const zhihuAdapter: SourceAdapter = {
  id: 'zhihu',
  label: '知乎',
  isEnabled: () => config.sources.zhihu.enabled,
  async search(_keyword: string, limit: number): Promise<SourceItem[]> {
    const results = await webScraperService.scrapeZhihu()
    return results.slice(0, limit).map(r => ({
      title: r.title,
      description: r.description,
      url: r.url,
      source: 'Zhihu',
      timestamp: r.timestamp,
    }))
  },
}
