// ============================================================
// fetcher 层：数据源获取方式分层（2026-08-20）
// 不同网站获取信息源的方式不同，统一封装为三类 fetcher：
//   - ApiFetcher    ：HTTP API（JSON），如 B 站
//   - HtmlFetcher   ：HTML 爬虫（axios + cheerio），如百度
//   - BrowserFetcher：无头/有头浏览器（Playwright），如知乎热榜、梦幻西游藏宝阁（需登录态/JS 渲染）
// adapter 按需组合 fetcher，新增数据源只需选择/组合对应 fetcher。
// ============================================================

/** 通用请求选项 */
export interface FetchOptions {
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

/** ApiFetcher：HTTP API（JSON）请求 */
export interface ApiFetcher {
  get<T>(url: string, params?: Record<string, any>, opts?: FetchOptions): Promise<T>
  post<T>(url: string, data?: any, opts?: FetchOptions): Promise<T>
}

/** HtmlFetcher：抓取 HTML 页面文本 */
export interface HtmlFetcher {
  fetchHtml(url: string, opts?: FetchOptions): Promise<string>
}

/** BrowserFetcher 抓取选项 */
export interface BrowserScrapeOptions {
  /** 等待指定选择器出现后再执行提取 */
  waitForSelector?: string
  /** 页面加载/等待超时（ms） */
  timeout?: number
  /** 是否无头（默认读取配置，登录场景需有头） */
  headless?: boolean
}

/** BrowserFetcher：Playwright 浏览器抓取 JS 渲染页面 */
export interface BrowserFetcher {
  /**
   * 打开页面 → 可选等待 → 执行 extract（可直接操作 page：点击/填表/提取 DOM）
   * 内部串行执行，避免并发浏览器资源竞争；用完自动关页。
   */
  scrape<T>(
    url: string,
    extract: (page: import('playwright').Page) => Promise<T>,
    opts?: BrowserScrapeOptions
  ): Promise<T>

  /** 打开一个可交互页面（用于登录等），返回 context+page，需调用方负责关闭 */
  openInteractive(url: string): Promise<{ context: import('playwright').BrowserContext; page: import('playwright').Page }>

  /** 关闭浏览器（进程退出时调用） */
  close(): Promise<void>
}

export * from './apiFetcher.js'
export * from './htmlFetcher.js'
export * from './browserFetcher.js'
