// 藏宝阁装备详情页探测：是否有价格走势/历史成交数据
// 运行：cd backend && npx tsx scripts/cbgDetailProbe.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { browserFetcher } from '../src/services/fetchers/index.js'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')
// 用采集到的真实商品（雷鸟人 serverid=443）
const DETAIL_URL = 'https://xyq.cbg.163.com/equip?s=443&eid=202601291200113-443-XAJXJKXN4USW'

async function main() {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
  console.log('打开装备详情页...')
  await browserFetcher.scrape(
    DETAIL_URL,
    async (page) => {
      // 监听价格/成交/走势相关请求
      const seen = new Set<string>()
      page.on('request', (req) => {
        const url = req.url()
        if (/deal|price|trend|成交|走势|dealquery|equip_info|detail/i.test(url)) {
          const key = `${req.method()} ${url}`
          if (!seen.has(key)) { seen.add(key); console.log('REQ:', key.slice(0, 220)) }
        }
      })
      page.on('response', async (res) => {
        const url = res.url()
        if (/deal|price|trend|dealquery/i.test(url)) {
          const key = `${res.status()} ${url}`
          if (!seen.has('RES ' + key)) { seen.add('RES ' + key); console.log('RES:', key.slice(0, 220)) }
        }
      })

      await page.waitForTimeout(5000)
      // 点击「历史成交」入口
      const clicked = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('a, span, div, li'))
        const el = els.find((e) => e.textContent?.trim() === '历史成交')
        if (el) { (el as HTMLElement).click(); return true }
        return false
      })
      console.log('点击历史成交:', clicked)
      await page.waitForTimeout(6000)
      console.log('当前 URL:', page.url())

      // 打印所有新页面（若新标签打开）
      const pages = page.context().pages()
      for (const p of pages) {
        if (p !== page) {
          await p.waitForLoadState('domcontentloaded').catch(() => {})
          console.log('新标签 URL:', p.url())
          const t = await p.locator('body').innerText().catch(() => '')
          t.split('\n').filter((l) => /成交|价格|时间|商品|均价|元/.test(l)).slice(0, 25).forEach((l) => console.log(' |', l.trim()))
          const shot = path.resolve(config.dataDir, 'cbg-deal.png')
          await p.screenshot({ path: shot, fullPage: false })
          console.log('新标签截图:', shot)
        }
      }
      const shotPath = path.resolve(config.dataDir, 'cbg-detail.png')
      await page.screenshot({ path: shotPath, fullPage: false })
      console.log('详情页截图:', shotPath)
    },
    { timeout: 60000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('详情页探测出错:', e)
  process.exit(1)
})
