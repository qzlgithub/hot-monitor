// 藏宝阁历史成交入口探测：点击「历史成交」，观察真实 URL 与内容（判断是否收费/可用）
// 运行：cd backend && npx tsx scripts/cbgDealProbe.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { browserFetcher } from '../src/services/fetchers/index.js'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')
const SEARCH_URL = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_equip'

async function main() {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
  console.log('打开搜索页...')
  await browserFetcher.scrape(
    SEARCH_URL,
    async (page) => {
      // 等登录
      for (let i = 0; i < 15; i++) {
        const text = await page.locator('body').innerText().catch(() => '')
        if (text.includes('切换角色')) break
        await page.waitForTimeout(1000)
      }
      // 监听请求
      const seen = new Set<string>()
      page.on('request', (req) => {
        const u = req.url()
        if (/deal|dealquery|history|成交/i.test(u)) {
          const k = `REQ ${req.method()} ${u}`
          if (!seen.has(k)) { seen.add(k); console.log(k.slice(0, 240)) }
        }
      })
      // 点击顶部「历史成交」
      const clicked = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, span, div, li, p'))
        const el = els.find((e) => e.textContent?.trim() === '历史成交')
        if (el) { (el as HTMLElement).click(); return true }
        return false
      })
      console.log('点击历史成交:', clicked)
      await page.waitForTimeout(6000)
      // 检查新标签
      const pages = page.context().pages()
      for (const p of pages) {
        if (p !== page) {
          const url = p.url()
          console.log('新标签 URL:', url)
          if (url !== 'about:blank') {
            await p.waitForLoadState('domcontentloaded').catch(() => {})
            const t = await p.locator('body').innerText().catch(() => '')
            console.log('新标签内容(前800):', t.replace(/\s+/g, ' ').slice(0, 800))
          }
        }
      }
      const t2 = await page.locator('body').innerText()
      if (/开通|付费|收费|会员|VIP|支付/.test(t2)) {
        console.log('⚠️ 页面提示收费/开通:', t2.match(/[^。\n]*(开通|付费|收费|会员|VIP|支付)[^。\n]*/g)?.slice(0, 5))
      }
    },
    { timeout: 60000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('探测出错:', e)
  process.exit(1)
})
