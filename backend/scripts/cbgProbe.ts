// 藏宝阁搜索探测脚本 v2：cookie 注入 → 实测「全服搜索」流程
// 运行：cd backend && npx tsx scripts/cbgProbe.ts
// 目的：确认搜索请求 URL、结果页 DOM 结构，供 cbgService 落地
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { browserFetcher } from '../src/services/fetchers/index.js'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')
const OUT_FILE = path.resolve(config.dataDir, 'cbg-probe-body.txt')
const SEARCH_URL = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_equip'

async function main() {
  // 读取 cookie
  let cookies: any[] = []
  try {
    cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
    console.log('已加载 cookie 数:', cookies.length)
  } catch {
    console.log('⚠️ 未找到 cbg-cookies.json，请先运行 cbgLogin.ts')
    return
  }

  console.log('▶ 打开装备搜索页（注入 cookie）...')
  await browserFetcher.scrape(
    SEARCH_URL,
    async (page) => {
      // 0. 等待登录态异步加载
      let loggedIn = false
      for (let i = 0; i < 15; i++) {
        const text = await page.locator('body').innerText().catch(() => '')
        if (text.includes('切换角色')) { loggedIn = true; break }
        await page.waitForTimeout(1000)
      }
      console.log('登录态: 切换角色=', loggedIn)

      // 1. 监听搜索相关网络请求
      const seen = new Set<string>()
      page.on('request', (req) => {
        const url = req.url()
        if (req.method() === 'POST' || /equipquery|search|query|overall/i.test(url)) {
          const key = `REQ ${req.method()} ${url}`
          if (!seen.has(key)) { seen.add(key); console.log(key) }
        }
      })
      page.on('response', async (res) => {
        const url = res.url()
        if (/equipquery|search|query|overall/i.test(url)) {
          const key = `RES ${res.status()} ${url}`
          if (!seen.has(key)) { seen.add(key); console.log(key) }
        }
      })

      // 2. 点击「60-160愤怒腰带」快捷搜索（自带条件的搜索，用于暴露结果页结构）
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('li, div, a, span'))
        const el = els.find((e) => e.textContent?.trim() === '60-160愤怒腰带')
        if (el) (el as HTMLElement).click()
        console.log('clicked 60-160愤怒腰带:', !!el)
      })

      // 3. 等待结果渲染（若跳转新页则等待加载）
      await page.waitForTimeout(12000)
      console.log('当前 URL:', page.url())

      // 4. 提取页面文本全文写入文件 + 打印末尾
      const bodyText = await page.locator('body').innerText()
      fs.writeFileSync(OUT_FILE, bodyText, 'utf-8')
      console.log('BODY 总长度:', bodyText.length, ' 已写入', OUT_FILE)
      console.log('--- BODY 末尾 3000 字符 ---')
      console.log(bodyText.slice(-3000))

      // 5. 截图
      const shotPath = path.resolve(config.dataDir, 'cbg-probe.png')
      await page.screenshot({ path: shotPath, fullPage: false })
      console.log('截图已保存:', shotPath)
    },
    { timeout: 90000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('探测脚本出错:', e)
  process.exit(1)
})
