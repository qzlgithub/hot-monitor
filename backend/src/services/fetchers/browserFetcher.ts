import { chromium, type BrowserContext, type Page } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'
import config from '../../config/index.js'
import type { BrowserFetcher, BrowserScrapeOptions } from './types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * BrowserFetcher：Playwright 浏览器抓取（无头/有头）
 * - 单例 BrowserContext + userDataDir 持久会话（登录态可复用）
 * - 串行执行任务，避免并发浏览器资源竞争
 * - 适用：SPA/JS 渲染页面、需要登录态的站点（知乎热榜、梦幻西游藏宝阁）
 */
class BrowserFetcherImpl implements BrowserFetcher {
  private context: BrowserContext | null = null
  private taskQueue: Promise<unknown> = Promise.resolve()
  private userDataDir = config.browser.userDataDir

  private async getContext(headless: boolean): Promise<BrowserContext> {
    if (!this.context) {
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless,
        viewport: { width: 1440, height: 900 },
        locale: 'zh-CN',
        // 藏宝阁等站点对默认无头特征有检测，减少指纹差异
        args: ['--disable-blink-features=AutomationControlled'],
      })
    }
    return this.context
  }

  async scrape<T>(
    url: string,
    extract: (page: Page) => Promise<T>,
    opts: BrowserScrapeOptions & { cookies?: import('playwright').Cookie[] } = {}
  ): Promise<T> {
    // 串行化：前一个任务结束后再跑下一个
    const run = this.taskQueue.then(async () => {
      const context = await this.getContext(opts.headless ?? config.browser.headless)
      // 支持注入持久化 cookie（如藏宝阁登录态），不依赖浏览器 profile 持久化
      if (opts.cookies && opts.cookies.length) {
        await context.addCookies(opts.cookies as any)
      }
      const page = await context.newPage()
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout ?? 30000 })
        if (opts.waitForSelector) {
          await page.waitForSelector(opts.waitForSelector, { timeout: opts.timeout ?? 30000 })
        }
        return await extract(page)
      } finally {
        await page.close()
      }
    })
    // 即使任务失败也继续队列
    this.taskQueue = run.catch(() => undefined)
    return run
  }

  async openInteractive(url: string): Promise<{ context: BrowserContext; page: Page }> {
    // 登录等交互场景强制有头（headless 无法扫码）
    const context = await this.getContext(false)
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    return { context, page }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
  }
}

export const browserFetcher: BrowserFetcher = new BrowserFetcherImpl()
export default browserFetcher
