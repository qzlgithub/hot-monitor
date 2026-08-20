// 藏宝阁搜索测试：勾选「3年以上服」→ 点击 #btn_equip_search → 捕获请求与响应 JSON
// 运行：cd backend && npx tsx scripts/cbgSearchTest.ts
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
  console.log('已加载 cookie 数:', cookies.length)

  await browserFetcher.scrape(
    SEARCH_URL,
    async (page) => {
      // 等登录态
      for (let i = 0; i < 15; i++) {
        const text = await page.locator('body').innerText().catch(() => '')
        if (text.includes('切换角色')) break
        await page.waitForTimeout(1000)
      }
      console.log('登录态 OK')

      // 监听搜索请求/响应
      const captured: any[] = []
      page.on('request', (req) => {
        const url = req.url()
        if (req.method() === 'POST' || /overall_search|recommd|equipquery|xyq_overall/i.test(url)) {
          captured.push({ type: 'req', method: req.method(), url, postData: req.postData() })
        }
      })
      page.on('response', async (res) => {
        const url = res.url()
        if (/overall_search|recommd|equipquery|xyq_overall/i.test(url)) {
          const body = await res.text().catch(() => '')
          captured.push({ type: 'res', status: res.status(), url, body: body.slice(0, 6000) })
        }
      })

      // 勾选「3年以上服」
      await page.evaluate(() => {
        const panel = document.querySelector('#server_type_panel')
        if (panel) {
          const items = Array.from(panel.querySelectorAll('li, span, div'))
          const el = items.find((e) => e.textContent?.trim() === '3年以上服')
          if (el) (el as HTMLElement).click()
          console.log('勾选 3年以上服:', !!el)
        } else {
          console.log('未找到 #server_type_panel')
        }
      })

      // 点击搜索按钮
      await page.evaluate(() => {
        const btn = document.querySelector('#btn_equip_search') as HTMLElement
        console.log('btn_equip_search 存在:', !!btn)
        if (btn) btn.click()
      })

      await page.waitForTimeout(8000)

      // 提取结果区文本
      const resultText = await page.evaluate(() => {
        const el = document.querySelector('#search_result')
        return el ? (el.textContent || '').slice(0, 5000) : '(no #search_result)'
      })

      console.log('=== 捕获的请求/响应 ===')
      console.log(JSON.stringify(captured, null, 2))
      console.log('=== #search_result 文本 ===')
      console.log(resultText)
      fs.writeFileSync(path.resolve(config.dataDir, 'cbg-search-result.txt'), resultText, 'utf-8')

      const shotPath = path.resolve(config.dataDir, 'cbg-search.png')
      await page.screenshot({ path: shotPath, fullPage: false })
      console.log('截图:', shotPath)
    },
    { timeout: 60000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('搜索测试出错:', e)
  process.exit(1)
})
