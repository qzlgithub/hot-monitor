// 修复 cbgSearchRules.json：确保 UTF-8 编码 + 恢复正确中文名 + 重新启用
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const file = path.resolve(__dirname, '../src/data/cbgSearchRules.json')

const rules = [
  {
    id: 'default-equip-godweapon',
    name: '装备·高级神兵(等级≥120/初伤≥500/力量≥30)',
    type: 'equip',
    enabled: true,
    topN: 10,
    priority: 'normal',
    conditions: { levelMin: 120, initDamageRaw: 500, sumAttrType: 'power', sumAttrValue: 30 },
    createdAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'default-pet-highvalue',
    name: '召唤兽·高价值(≥200元)',
    type: 'pet',
    enabled: true,
    topN: 10,
    priority: 'normal',
    conditions: { priceMin: 200 },
    createdAt: '2026-08-20T00:00:00.000Z',
  },
]

fs.writeFileSync(file, JSON.stringify(rules, null, 2), 'utf8')
console.log('✅ cbgSearchRules.json 已修复 (UTF-8)')
console.log(fs.readFileSync(file, 'utf8').slice(0, 200))
