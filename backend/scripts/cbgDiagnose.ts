// 藏宝阁会话诊断：检查 userDataDir 是否保存了登录态（cookie/localStorage）
// 运行：cd backend && npx tsx scripts/cbgDiagnose.ts
import { chromium } from 'playwright'
import config from '../src/config/index.js'

async function main() {
  console.log('userDataDir:', config.browser.userDataDir)
  const ctx = await chromium.launchPersistentContext(config.browser.userDataDir, {
    headless: true,
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()
  await page.goto('https://xyq.cbg.163.com/', { waitUntil: 'domcontentloaded', timeout: 30000 })

  const cookies = await ctx.cookies()
  console.log('总 cookie 数:', cookies.length)
  const byDomain: Record<string, number> = {}
  cookies.forEach((c) => {
    byDomain[c.domain] = (byDomain[c.domain] || 0) + 1
  })
  console.log('cookies 按域:', JSON.stringify(byDomain, null, 2))

  const lsKeys = await page.evaluate(() => Object.keys(localStorage).slice(0, 80))
  console.log('localStorage keys:', JSON.stringify(lsKeys, null, 2))

  // 等待登录态异步加载（轮询最多 15 秒）
  let text = ''
  for (let i = 0; i < 15; i++) {
    text = await page.locator('body').innerText()
    if (text.includes('切换角色')) break
    await page.waitForTimeout(1000)
  }
  console.log('游客=', text.includes('您好，梦幻玩家'), ' 切换角色=', text.includes('切换角色'), ' 含登录=', text.includes('登录'))
  // 打印顶部 800 字符（登录态区域）
  console.log('--- 页面顶部文本 ---')
  console.log(text.slice(0, 800))

  await ctx.close()
  console.log('诊断完成')
}

main().catch((e) => {
  console.error('诊断出错:', e)
  process.exit(1)
})
