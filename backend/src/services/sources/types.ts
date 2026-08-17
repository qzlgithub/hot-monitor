// 数据源统一返回的条目结构
export interface SourceItem {
  id?: string
  title: string
  description: string
  url: string
  source: string
  timestamp: string
  trend?: number      // 真实热度值（如 B 站播放量），用于趋势展示
  pic?: string        // 封面图（可选）
  author?: string     // 作者 / UP主（可选）
  category?: string   // 平台自带分类（可选）
  like?: number       // 点赞数（可选）
}

// 数据源适配器接口：新增数据源只需实现此接口并注册到 index.ts
export interface SourceAdapter {
  id: string
  label: string
  isEnabled(): boolean
  // 关键词搜索（必选）：返回与关键词相关的条目
  search(keyword: string, limit: number): Promise<SourceItem[]>
  // 热门 / 榜单（可选）：实现后会自动进入「热门发现」板块
  fetchTrending?(limit: number): Promise<SourceItem[]>
}
