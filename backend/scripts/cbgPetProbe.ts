// 藏宝阁召唤兽搜索页探测：读 OverallSearchAct + 表单字段 + 搜索按钮
// 运行：cd backend && npx tsx scripts/cbgPetProbe.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { browserFetcher } from '../src/services/fetchers/index.js'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')
const PET_URL = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_pet'

async function main() {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
  await browserFetcher.scrape(
    PET_URL,
    async (page) => {
      for (let i = 0; i < 15; i++) {
        const text = await page.locator('body').innerText().catch(() => '')
        if (text.includes('切换角色')) break
        await page.waitForTimeout(1000)
      }
      const info = await page.evaluate(() => {
        const out: Record<string, any> = {}
        out.OverallSearchAct = String((window as any).OverallSearchAct || '')
        out.OverallSearchType = String((window as any).OverallSearchType || '')
        // 搜索相关全局
        out.globalFns = Object.keys(window).filter((k) => /Search|search|query/i.test(k)).slice(0, 50)
        // 表单字段
        const form = document.querySelector('form[action*="xyq_overall_search"]')
        out.formFields = form
          ? Array.from(form.querySelectorAll('input, select')).map((el) => {
              const e = el as HTMLInputElement
              return { tag: e.tagName, name: e.name, type: e.type || '', value: e.value }
            }).filter((f) => f.name)
          : []
        // 搜索按钮（含 search 的 button/a id）
        out.searchBtns = Array.from(document.querySelectorAll('[id*="search" i], [id*="Search" i]'))
          .map((e) => ({ id: e.id, tag: e.tagName, cls: e.className, text: (e.textContent || '').trim().slice(0, 30) }))
          .slice(0, 20)
        return out
      })
      console.log('=== OverallSearchAct ===', info.OverallSearchAct)
      console.log('=== OverallSearchType ===', info.OverallSearchType)
      console.log('=== 全局搜索相关 ===', JSON.stringify(info.globalFns, null, 2))
      console.log('=== form 字段 ===', JSON.stringify(info.formFields, null, 2))
      console.log('=== 搜索按钮 ===', JSON.stringify(info.searchBtns, null, 2))
    },
    { timeout: 60000, cookies }
  )
  await browserFetcher.close()
}

main().catch((e) => {
  console.error('pet 探测出错:', e)
  process.exit(1)
})
