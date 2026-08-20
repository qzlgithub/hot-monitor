// 藏宝阁登录脚本 v2：登录 → 导出 cookie 到 JSON → 用导出的 cookie 启动无头实例验证登录态
// 运行：cd backend && npx tsx scripts/cbgLogin.ts
// 产出的 cookie 文件（backend/src/data/cbg-cookies.json）会被每次抓取前注入，不依赖浏览器 profile 持久化。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { browserFetcher } from '../src/services/fetchers/index.js'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CBG_HOME = 'https://xyq.cbg.163.com/'
const EQUIP_URL = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_equip'
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')

async function main() {
  console.log('🔐 打开藏宝阁（有头窗口）完成登录...')
  const { context, page } = await browserFetcher.openInteractive(CBG_HOME)
  console.log('▶ 请在窗口中完成网易账号登录（扫码 / 账号密码）')
  console.log('  登录成功（顶部出现您的角色名 / [切换角色]）后脚本自动继续。')

  const deadline = Date.now() + 300_000
  let loggedIn = false
  while (Date.now() < deadline) {
    const text = await page.locator('body').innerText().catch(() => '')
    if (text.includes('切换角色')) {
      loggedIn = true
      break
    }
    await new Promise((r) => setTimeout(r, 3000))
  }

  if (!loggedIn) {
    console.log('⏰ 超时未检测到登录，脚本退出（可重跑）')
    await page.close().catch(() => {})
    await browserFetcher.close()
    return
  }

  // 1. 导出 cookie
  const cookies = await context.cookies()
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2))
  console.log(`✅ 已导出 ${cookies.length} 个 cookie → ${COOKIE_FILE}`)

  await page.close().catch(() => {})
  await browserFetcher.close()

  // 2. 用导出的 cookie 注入新无头实例，打开装备搜索页验证登录态
  console.log('🔎 用导出的 cookie 启动无头实例验证...')
  const ctx2 = await chromium.launchPersistentContext(config.browser.userDataDir, {
    headless: true,
    locale: 'zh-CN',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  await ctx2.addCookies(cookies)
  const p2 = await ctx2.newPage()
  await p2.goto(EQUIP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  // 等待登录态异步加载
  let ok = false
  for (let i = 0; i < 15; i++) {
    const text = await p2.locator('body').innerText().catch(() => '')
    if (text.includes('切换角色')) { ok = true; break }
    await p2.waitForTimeout(1000)
  }
  const text = await p2.locator('body').innerText().catch(() => '')
  console.log('验证结果: 切换角色=', text.includes('切换角色'), ' 游客=', text.includes('您好，梦幻玩家'), ' →', ok ? '✅ 登录态有效' : '❌ 登录态无效')
  await p2.close().catch(() => {})
  await ctx2.close()
  console.log('🏁 完成')
}

main().catch((e) => {
  console.error('登录脚本出错:', e)
  process.exit(1)
})
