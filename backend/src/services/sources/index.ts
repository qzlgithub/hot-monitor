import type { SourceAdapter } from './types.js'
import { baiduAdapter } from './baiduAdapter.js'
import { bilibiliAdapter } from './bilibiliAdapter.js'
import { zhihuAdapter } from './zhihuAdapter.js'
import { twitterAdapter } from './twitterAdapter.js'

// 数据源注册表：新增数据源只需 ① 实现 SourceAdapter ② 在这里注册 ③ 在 .env 打开开关，
// 调度器（关键词搜索 / 热门发现）会自动接入，无需改动 taskScheduler。
export const sources: SourceAdapter[] = [
  baiduAdapter,
  bilibiliAdapter,
  zhihuAdapter,
  twitterAdapter,
]

export function getEnabledSources(): SourceAdapter[] {
  return sources.filter(s => s.isEnabled())
}

export * from './types.js'
