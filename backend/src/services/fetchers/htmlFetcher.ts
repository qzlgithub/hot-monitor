import axios from 'axios'
import type { HtmlFetcher, FetchOptions } from './types.js'

/**
 * HtmlFetcher：HTML 页面抓取（axios 获取原始 HTML）
 * - 配合 cheerio 在调用方做选择器解析（如百度搜索、新闻站点）
 * - 适合服务端渲染 / 静态 HTML 页面；SPA/JS 渲染页面请用 BrowserFetcher
 */
class HtmlFetcherImpl implements HtmlFetcher {
  private defaultTimeout = 10000

  async fetchHtml(url: string, opts?: FetchOptions): Promise<string> {
    const res = await axios.get<string>(url, {
      headers: opts?.headers,
      timeout: opts?.timeout ?? this.defaultTimeout,
    })
    return res.data
  }
}

export const htmlFetcher: HtmlFetcher = new HtmlFetcherImpl()
export default htmlFetcher
