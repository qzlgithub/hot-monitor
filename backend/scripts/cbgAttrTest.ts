// 藏宝阁属性筛选实测：验证 recommend.py 是否支持等级/初伤不含命中/附加力量等参数
// 运行：cd backend && npx tsx scripts/cbgAttrTest.ts
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import config from '../src/config/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOKIE_FILE = path.resolve(config.dataDir, 'cbg-cookies.json')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
const REFERER = 'https://xyq.cbg.163.com/cgi-bin/equipquery.py?act=show_overall_search_equip'

async function main() {
  const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))
  const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join('; ')

  const run = async (label: string, extra: Record<string, any>) => {
    try {
      const res = await axios.get('https://xyq.cbg.163.com/cgi-bin/recommend.py', {
        params: {
          act: 'recommd_by_role',
          page: 1,
          server_type: 3,
          count: 15,
          search_type: 'overall_search_equip',
          view_loc: 'overall_search',
          callback: 'cb',
          ...extra,
        },
        headers: { 'User-Agent': UA, 'Referer': REFERER, 'Cookie': cookieStr, 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 15000,
      })
      const m = String(res.data).match(/^[^(]*\((.*)\)\s*;?\s*$/s)
      if (!m) { console.log(`[${label}] 非 JSONP`); return }
      const json = JSON.parse(m[1])
      const list = json.equip_list || []
      console.log(`\n=== ${label} === 返回 ${list.length} 条`)
      if (list[0]) {
        const it = list[0]
        // 打印与力量/属性相关的字段
        const attrKeys = Object.keys(it).filter((k) => /power|li|attr|sum|addon/i.test(k))
        const attrSnippet: Record<string, any> = {}
        attrKeys.slice(0, 12).forEach((k) => { attrSnippet[k] = it[k] })
        console.log(`  首条: ${it.equip_name} | ${it.level_desc} | ¥${it.price_desc} | 初伤不含命中=${it.init_damage_raw ?? '-'}`)
        console.log('  相关字段:', JSON.stringify(attrSnippet))
      }
      // 统计是否符合条件
      const minLevel = extra.level_min
      const minInitRaw = extra.init_damage_raw
      if (minLevel || minInitRaw) {
        const badLevel = minLevel ? list.filter((x: any) => (x.equip_level || 0) < minLevel).length : 0
        const badRaw = minInitRaw ? list.filter((x: any) => (x.init_damage_raw || 0) < minInitRaw).length : 0
        console.log(`  不符合(等级<${minLevel}):${badLevel} | 初伤不含命中<${minInitRaw}):${badRaw}`)
      }
    } catch (e: any) {
      console.error(`[${label}] 失败:`, e.message, e.response?.status)
    }
  }

  await run('等级≥120', { level_min: 120 })
  await run('等级≥120 + 初伤不含命中≥500', { level_min: 120, init_damage_raw: 500 })
  await run('力量属性≥30 (sum_attr_type=power)', { sum_attr_type: 'power', sum_attr_value: 30 })
  await run('力量属性≥30 + 等级≥120 + 初伤≥500', { sum_attr_type: 'power', sum_attr_value: 30, level_min: 120, init_damage_raw: 500 })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
