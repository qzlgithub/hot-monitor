// 藏宝阁页面结构分析：找出「全服搜索」真正的触发方式与搜索 URL 构造
// 运行：cd backend && npx tsx scripts/cbgAnalyze.ts
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

      const info = await page.evaluate(() => {
        const out: Record<string, any> = {}

        // 1. 表单的所有字段（name/value）
        const form = document.querySelector('form[action*="xyq_overall_search"]')
        out.formFields = form
          ? Array.from(form.querySelectorAll('input, select, textarea')).map((el) => {
              const e = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              return {
                tag: e.tagName,
                name: e.name,
                type: (e as HTMLInputElement).type || '',
                value: e.value,
              }
            }).filter((f) => f.name)
          : []

        // 2. 页面加载的所有脚本 src
        out.scriptSrc = Array.from(document.querySelectorAll('script[src]'))
          .map((s) => s.getAttribute('src'))
          .filter(Boolean)

        // 3. 全局搜索相关变量（不 toString，仅名字/类型）
        out.globalFns = Object.keys(window)
          .filter((k) => /search|query|do_|overall|Search/i.test(k))
          .slice(0, 80)
          .map((k) => {
            const v = (window as any)[k]
            return { k, type: typeof v }
          })

        return out
      })

      console.log('=== form 字段 ===')
      console.log(JSON.stringify(info.formFields, null, 2))
      console.log('=== script src ===')
      console.log(JSON.stringify(info.scriptSrc, null, 2))
      console.log('=== 全局搜索相关 ===')
      console.log(JSON.stringify(info.globalFns, null, 2))
      fs.writeFileSync(path.resolve(config.dataDir, 'cbg-form-fields.json'), JSON.stringify(info.formFields, null, 2))
      console.log('form 字段已存到 cbg-form-fields.json')
    },
    { timeout: 60000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('分析脚本出错:', e)
  process.exit(1)
})
