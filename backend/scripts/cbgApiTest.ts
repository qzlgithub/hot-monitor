// 藏宝阁 API 直连测试：不启动浏览器，直接用 HTTP GET recommend.py（带 cookie）
// 验证能否脱离浏览器抓取，若可行则抓取走 ApiFetcher，浏览器仅用于刷新登录态
// 运行：cd backend && npx tsx scripts/cbgApiTest.ts
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import config from '../src/config/index.js'

const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
const REFERER = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_equip'

async function main() {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  console.log('cookie 数:', cookies.length)

  // 装备搜索
  const equipParams = {
    act: 'recommd_by_role',
    page: 1,
    level_min: 60,
    level_max: 160,
    server_type: 3,
    sum_attr_without_melt: 1,
    count: 15,
    search_type: 'overall_search_equip',
    view_loc: 'overall_search',
    callback: 'cb',
  }

  // 召唤兽搜索（参数尽量简单，看返回）
  const petParams = {
    act: 'recommd_by_role',
    page: 1,
    server_type: 3,
    count: 15,
    search_type: 'overall_search_pet',
    view_loc: 'overall_search',
    callback: 'cb',
  }

  const run = async (label: string, params: any) => {
    try {
      const res = await axios.get('https://xyq.cbg.163.com/cgi-bin/recommend.py', {
        params,
        headers: { 'User-Agent': UA, 'Referer': REFERER, 'Cookie': cookieStr, 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 15000,
      })
      const raw = String(res.data)
      const m = raw.match(/^[^(]*\((.*)\)\s*;?\s*$/s)
      if (!m) { console.log(`[${label}] 非 JSONP:`, raw.slice(0, 200)); return }
      const json = JSON.parse(m[1])
      const list = json.equip_list || []
      console.log(`[${label}] status=${json.status} equip_list=${list.length}`)
      if (list[0]) {
        const it = list[0]
        console.log(`[${label}] 示例: name=${it.equip_name || it.pet_name} | ${it.level_desc || ''} | price=${it.price_desc} | ${it.area_name}-${it.server_name} | ${it.equip_status_desc || it.status_desc} | ${it.selling_time} | eid=${it.eid}`)
        console.log(`[${label}] 字段 keys:`, Object.keys(it).join(','))
      }
    } catch (e: any) {
      console.error(`[${label}] 请求失败:`, e.message, '| status:', e.response?.status, '| body:', String(e.response?.data || '').slice(0, 200))
    }
  }

  await run('equip', equipParams)
  await run('pet', petParams)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
