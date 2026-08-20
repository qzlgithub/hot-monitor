import { useEffect, useMemo, useState } from 'react'
import {
  Gem, RefreshCw, Radar, Plus, Trash2, Sword, PawPrint, User,
  TrendingUp, TrendingDown, ExternalLink, Loader2, AlertTriangle,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { toast } from 'sonner'
import { Spotlight } from '../components/ui/Spotlight'
import { MovingBorder } from '../components/ui/MovingBorder'
import { formatDate, formatRelativeTime } from '../utils/helpers'

type ItemType = 'equip' | 'pet' | 'role'

interface CbgItem {
  id: string
  type: ItemType
  name: string
  level?: string
  server?: string
  serverid?: number
  price: number
  status?: string
  passFairShow: boolean
  sellingTime?: string
  expireTime?: string
  seller?: string
  summary?: string
  url: string
  ruleNames: string[]
  firstSeenAt: string
  lastSeenAt: string
  priceHistory: { ts: string; price: number }[]
}

interface Stats {
  total: number
  todayNew: number
  priceChanged: number
  onSale: number
}

interface SearchCondition {
  levelMin?: number
  levelMax?: number
  priceMin?: number
  priceMax?: number
  frontStatus?: string
  kindid?: number
  initDamageRaw?: number
  allDamage?: number
  damage?: number
  initDefense?: number
  sumAttrType?: string
  sumAttrValue?: number
  [key: string]: any
}

interface SearchRule {
  id: string
  name: string
  type: ItemType
  enabled: boolean
  topN: number
  priority?: 'fast' | 'normal'
  conditions: SearchCondition
  createdAt: string
}

const SUM_ATTRS = [
  { value: 'power', label: '力量' },
  { value: 'physique', label: '体质' },
  { value: 'magic', label: '魔力' },
  { value: 'endurance', label: '耐力' },
  { value: 'dex', label: '敏捷' },
]

// 装备类型（kindid → 名称，来自藏宝阁 weapon_armors 配置）
const EQUIP_KINDS: { id: number; label: string }[] = [
  { id: 10, label: '扇' }, { id: 6, label: '剑' }, { id: 14, label: '刀' },
  { id: 5, label: '斧' }, { id: 15, label: '锤' }, { id: 4, label: '枪' },
  { id: 13, label: '双环' }, { id: 7, label: '双剑' }, { id: 12, label: '鞭' },
  { id: 9, label: '爪刺' }, { id: 11, label: '魔棒' }, { id: 8, label: '飘带' },
  { id: 52, label: '宝珠' }, { id: 53, label: '弓' }, { id: 54, label: '法杖' },
  { id: 18, label: '男衣' }, { id: 59, label: '女衣' }, { id: 17, label: '男头' },
  { id: 58, label: '女头' }, { id: 20, label: '腰带' }, { id: 19, label: '鞋子' },
  { id: 21, label: '饰品' }, { id: 72, label: '灯笼' }, { id: 73, label: '巨剑' },
  { id: 74, label: '伞' }, { id: 83, label: '双斧' }, { id: 91, label: '棍' },
]

const TYPE_META: Record<ItemType, { label: string; icon: any; badge: string }> = {
  equip: { label: '装备', icon: Sword, badge: 'bg-amber-500/15 text-orange-600' },
  pet: { label: '召唤兽', icon: PawPrint, badge: 'bg-violet-500/15 text-violet-600' },
  role: { label: '角色', icon: User, badge: 'bg-sky-500/15 text-sky-600' },
}

export default function Cbg() {
  const [items, setItems] = useState<CbgItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [rules, setRules] = useState<SearchRule[]>([])
  const [priceStats, setPriceStats] = useState<Record<string, any>>({})
  const [trendData, setTrendData] = useState<any[]>([])
  const [trendRule, setTrendRule] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all')
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [ruleFilter, setRuleFilter] = useState('all')
  const emptyForm = {
    name: '',
    type: 'equip' as ItemType,
    topN: '10',
    priority: 'normal',
    levelMin: '', levelMax: '',
    priceMin: '', priceMax: '',
    kindid: '',
    initDamageRaw: '', allDamage: '', damage: '', initDefense: '',
    sumAttrType: '', sumAttrValue: '',
    frontStatus: '',
  }
  const [ruleForm, setRuleForm] = useState(emptyForm)

  const fetchData = async (manual = false) => {
    setLoading(true)
    try {
      const [itemsRes, statsRes, rulesRes, statusRes, priceStatsRes] = await Promise.all([
        fetch('/api/cbg/items'),
        fetch('/api/cbg/stats'),
        fetch('/api/cbg/search-rules'),
        fetch('/api/cbg/status'),
        fetch('/api/cbg/price-stats'),
      ])
      if (itemsRes.ok) setItems(await itemsRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
      if (rulesRes.ok) setRules(await rulesRes.json())
      if (priceStatsRes.ok) setPriceStats(await priceStatsRes.json())
      if (statusRes.ok) {
        const st = await statusRes.json()
        setLoggedIn(!!st.loggedIn)
      }
      if (manual) toast.success('藏宝阁数据已刷新')
    } catch {
      toast.error('获取藏宝阁数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取指定规则的价格走势序列
  const fetchTrend = async (ruleName: string) => {
    if (!ruleName) { setTrendData([]); return }
    try {
      const res = await fetch(`/api/cbg/trend?rule=${encodeURIComponent(ruleName)}`)
      if (res.ok) setTrendData(await res.json())
    } catch {
      setTrendData([])
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(), 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 规则加载后默认展示第一条规则的走势
  useEffect(() => {
    if (rules.length > 0 && !trendRule) {
      setTrendRule(rules[0].name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules])

  // trendRule 变化时拉取走势
  useEffect(() => {
    if (trendRule) fetchTrend(trendRule)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendRule])

  // 立即采集：触发后端采集，轮询等待完成
  const runCollect = async () => {
    try {
      const res = await fetch('/api/cbg/check', { method: 'POST' })
      if (res.ok) {
        toast.success('采集已启动，完成后自动刷新')
        for (let i = 0; i < 36; i++) {
          await new Promise((r) => setTimeout(r, 5000))
          try {
            const s = await fetch('/api/cbg/status').then((r) => r.json())
            if (!s.running) break
          } catch {
            break
          }
        }
        fetchData()
      } else {
        toast.error('采集启动失败')
      }
    } catch {
      toast.error('采集启动失败')
    }
  }

  // 价格变化（对比价格历史最后两条）
  const priceDiff = (item: CbgItem): { diff: number; pct: number } | null => {
    const h = item.priceHistory
    if (h.length < 2) return null
    const prev = h[h.length - 2].price
    const last = h[h.length - 1].price
    return { diff: last - prev, pct: prev ? Math.abs(((last - prev) / prev) * 100) : 0 }
  }

  // 商品相对其规则市场价中位数的乖离率（负 = 低于市场价，捡漏）
  const deviationOf = (item: CbgItem): number | null => {
    for (const rn of item.ruleNames || []) {
      const s = priceStats[rn]
      if (s && s.median > 0) return (item.price - s.median) / s.median
    }
    return null
  }

  const filteredItems = useMemo(() => {
    const byType = typeFilter === 'all' ? items : items.filter((i) => i.type === typeFilter)
    const filtered = ruleFilter === 'all' ? byType : byType.filter((i) => (i.ruleNames || []).includes(ruleFilter))
    // 捡漏优先：有市场基线按乖离率升序（越便宜越前），无基线按价格升序
    return [...filtered].sort((a, b) => {
      const da = deviationOf(a)
      const db = deviationOf(b)
      if (da != null && db != null) return da - db
      if (da != null) return -1
      if (db != null) return 1
      return a.price - b.price
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, typeFilter, ruleFilter, priceStats])

  // 新增搜索规则
  const addRule = async () => {
    if (!ruleForm.name.trim()) {
      toast.error('请输入规则名称')
      return
    }
    const conditions: SearchCondition = {}
    const num = (v: string) => (v === '' || v == null ? undefined : Number(v))
    const lv = num(ruleForm.levelMin); if (lv != null) conditions.levelMin = lv
    const lv2 = num(ruleForm.levelMax); if (lv2 != null) conditions.levelMax = lv2
    const pm = num(ruleForm.priceMin); if (pm != null) conditions.priceMin = pm
    const px = num(ruleForm.priceMax); if (px != null) conditions.priceMax = px
    const ir = num(ruleForm.initDamageRaw); if (ir != null) conditions.initDamageRaw = ir
    const ad = num(ruleForm.allDamage); if (ad != null) conditions.allDamage = ad
    const dmg = num(ruleForm.damage); if (dmg != null) conditions.damage = dmg
    const df = num(ruleForm.initDefense); if (df != null) conditions.initDefense = df
    const kid = num(ruleForm.kindid); if (kid != null) conditions.kindid = kid
    const sv = num(ruleForm.sumAttrValue)
    if (ruleForm.sumAttrType && sv != null) {
      conditions.sumAttrType = ruleForm.sumAttrType
      conditions.sumAttrValue = sv
    }
    if (ruleForm.frontStatus) conditions.frontStatus = ruleForm.frontStatus
    try {
      const res = await fetch('/api/cbg/search-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleForm.name,
          type: ruleForm.type,
          topN: Number(ruleForm.topN) || 10,
          priority: ruleForm.priority === 'fast' ? 'fast' : 'normal',
          conditions,
        }),
      })
      if (res.ok) {
        toast.success('搜索规则已添加')
        setShowAddRule(false)
        setRuleForm(emptyForm)
        fetchData()
      } else {
        toast.error('添加失败')
      }
    } catch {
      toast.error('添加失败')
    }
  }

  const deleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/cbg/search-rules/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('规则已删除')
        fetchData()
      }
    } catch {
      toast.error('删除失败')
    }
  }

  const toggleRule = async (rule: SearchRule) => {
    try {
      await fetch(`/api/cbg/search-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      })
      fetchData()
    } catch {
      toast.error('更新失败')
    }
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-600/20'
        : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
    }`

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500'

  const statCards = stats
    ? [
        { label: '总关注', value: stats.total, cls: 'text-stone-800', spotlight: true },
        { label: '今日新上架', value: stats.todayNew, cls: 'text-emerald-600' },
        { label: '价格异动', value: stats.priceChanged, cls: 'text-orange-600' },
        { label: '上架中', value: stats.onSale, cls: 'text-violet-600' },
      ]
    : []

  return (
    <div className="space-y-6 animate-slide-in">
      {/* 页头 */}
      <div className="relative flex items-center justify-between mb-8">
        <Spotlight className="-top-8 left-0" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">藏宝阁</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              {items.length} 件关注商品
            </span>
          </div>
          <p className="text-stone-500 mt-1.5">梦幻西游藏宝阁 · 珍品/召唤兽价格监控（3年以上服）</p>
        </div>

        <div className="flex items-center gap-2">
          {!loggedIn && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> 未登录，请运行 cbgLogin.ts
            </span>
          )}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-800 hover:border-stone-300 font-semibold transition-all"
            title="重新拉取当前数据"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={runCollect}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-lg shadow-orange-600/25 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-100 active:scale-95"
          >
            <Radar className="w-4 h-4" />
            立即采集
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="relative overflow-hidden bg-white border border-stone-200 rounded-xl p-4 shadow-sm"
          >
            {c.spotlight && <Spotlight className="-top-16 -left-8" />}
            <div className="text-xs font-medium text-stone-500">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 类型 Tab */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'equip'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={tabClass(typeFilter === t)}
          >
            {t === 'all' ? `全部 ${items.length}` : `${TYPE_META[t].label} ${items.filter((i) => i.type === t).length}`}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowAddRule(!showAddRule)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-amber-500/50 text-orange-600 hover:bg-amber-500/10 font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          添加搜索规则
        </button>
      </div>

      {/* 搜索规则 Tab（按规则查看最低价前N） */}
      {rules.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-stone-400 mr-1">按规则查看</span>
          <button onClick={() => setRuleFilter('all')} className={tabClass(ruleFilter === 'all')}>
            全部
          </button>
          {rules.map((rule) => (
            <button
              key={rule.id}
              onClick={() => setRuleFilter(rule.name)}
              className={tabClass(ruleFilter === rule.name)}
            >
              {rule.name}
              <span className="ml-1 text-xs opacity-70">
                ({items.filter((i) => (i.ruleNames || []).includes(rule.name)).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 添加搜索规则对话框 */}
      {showAddRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddRule(false)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-bold text-lg text-stone-800">添加搜索规则</h3>
                <p className="text-xs text-stone-400 mt-0.5">填写筛选要求，按最低价格取前 N 条</p>
              </div>
              <button onClick={() => setShowAddRule(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" aria-label="关闭">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-stone-500 mb-1">规则名称</label>
                  <input className={inputCls} value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} placeholder="如：装备·高级神兵" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">类型</label>
                  <select
                    className={inputCls}
                    value={ruleForm.type}
                    onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value as ItemType })}
                  >
                    <option value="equip">装备（已开启）</option>
                    <option value="pet" disabled>召唤兽（后续开启）</option>
                    <option value="role" disabled>角色（后续开启）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">取最低价前 N 条</label>
                  <input className={inputCls} type="number" min={1} max={50} value={ruleForm.topN} onChange={(e) => setRuleForm({ ...ruleForm, topN: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">采集频率</label>
                  <select className={inputCls} value={ruleForm.priority} onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}>
                    <option value="normal">普通（30分钟）</option>
                    <option value="fast">高频（15分钟，抢低价）</option>
                  </select>
                </div>
              </div>

              {/* 通用筛选：等级 / 价格 / 状态 */}
              <div className="border-t border-stone-100 pt-3">
                <p className="text-xs font-bold text-stone-500 mb-2">基础筛选</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">等级 ≥</label>
                    <input className={inputCls} type="number" value={ruleForm.levelMin} onChange={(e) => setRuleForm({ ...ruleForm, levelMin: e.target.value })} placeholder="120" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">等级 ≤</label>
                    <input className={inputCls} type="number" value={ruleForm.levelMax} onChange={(e) => setRuleForm({ ...ruleForm, levelMax: e.target.value })} placeholder="" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">价格 ≥（元）</label>
                    <input className={inputCls} type="number" value={ruleForm.priceMin} onChange={(e) => setRuleForm({ ...ruleForm, priceMin: e.target.value })} placeholder="" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">价格 ≤（元）</label>
                    <input className={inputCls} type="number" value={ruleForm.priceMax} onChange={(e) => setRuleForm({ ...ruleForm, priceMax: e.target.value })} placeholder="" />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-xs text-stone-500 mb-1">出售状态</label>
                    <select className={inputCls} value={ruleForm.frontStatus} onChange={(e) => setRuleForm({ ...ruleForm, frontStatus: e.target.value })}>
                      <option value="">不限</option>
                      <option value="pass_fair_show">仅已上架</option>
                      <option value="fair_show">仅公示期</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 装备专属：属性筛选 */}
              {ruleForm.type === 'equip' && (
                <div className="border-t border-stone-100 pt-3">
                  <p className="text-xs font-bold text-stone-500 mb-2">装备筛选</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="col-span-2 sm:col-span-4">
                      <label className="block text-xs text-stone-500 mb-1">装备类型</label>
                      <select className={inputCls} value={ruleForm.kindid} onChange={(e) => setRuleForm({ ...ruleForm, kindid: e.target.value })}>
                        <option value="">不限</option>
                        {EQUIP_KINDS.map((k) => (
                          <option key={k.id} value={k.id}>{k.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-stone-500 mb-2">装备属性（下限）</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">初伤(不含命中) ≥</label>
                      <input className={inputCls} type="number" value={ruleForm.initDamageRaw} onChange={(e) => setRuleForm({ ...ruleForm, initDamageRaw: e.target.value })} placeholder="500" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">总伤 ≥</label>
                      <input className={inputCls} type="number" value={ruleForm.allDamage} onChange={(e) => setRuleForm({ ...ruleForm, allDamage: e.target.value })} placeholder="" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">伤害 ≥</label>
                      <input className={inputCls} type="number" value={ruleForm.damage} onChange={(e) => setRuleForm({ ...ruleForm, damage: e.target.value })} placeholder="" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">初防 ≥</label>
                      <input className={inputCls} type="number" value={ruleForm.initDefense} onChange={(e) => setRuleForm({ ...ruleForm, initDefense: e.target.value })} placeholder="" />
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">属性类型</label>
                      <select className={inputCls} value={ruleForm.sumAttrType} onChange={(e) => setRuleForm({ ...ruleForm, sumAttrType: e.target.value })}>
                        <option value="">不限</option>
                        {SUM_ATTRS.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-stone-500 mb-1">属性值 ≥</label>
                      <input className={inputCls} type="number" value={ruleForm.sumAttrValue} onChange={(e) => setRuleForm({ ...ruleForm, sumAttrValue: e.target.value })} placeholder="30" />
                    </div>
                  </div>
                  <p className="text-xs text-stone-400 mt-2">如「力量属性 +30 以上」= 属性类型「力量」+ 属性值 30</p>
                </div>
              )}

              {/* 召唤兽/角色专属（预留） */}
              {ruleForm.type !== 'equip' && (
                <div className="border-t border-stone-100 pt-3">
                  <p className="text-xs font-bold text-stone-500 mb-2">{TYPE_META[ruleForm.type].label}筛选</p>
                  <p className="text-xs text-stone-400">当前支持等级 / 价格筛选，更多条件（成长/技能等）后续扩展</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-stone-200 px-6 py-4 flex gap-2 justify-end">
              <button onClick={() => setShowAddRule(false)} className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-semibold">取消</button>
              <button onClick={addRule} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md shadow-orange-600/25 hover:from-amber-400 hover:to-orange-500">添加规则</button>
            </div>
          </div>
        </div>
      )}

      {/* 价格走势图 */}
      {rules.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-stone-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                价格走势
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">品类市场价（在售中位数/均价）随时间变化，数据随采集自动积累</p>
            </div>
            <select
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={trendRule}
              onChange={(e) => setTrendRule(e.target.value)}
            >
              {rules.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          {trendData.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-sm">
              暂无走势数据，采集几次后这里会显示价格曲线
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="ts" tickFormatter={(v) => formatDate(v, 'MM-dd HH:mm')} stroke="#a8a29e" fontSize={11} minTickGap={30} />
                <YAxis stroke="#a8a29e" fontSize={11} tickFormatter={(v) => `¥${v}`} width={55} />
                <Tooltip
                  formatter={(value: any, name: any) => [`¥${Number(value).toFixed(0)}`, name === 'median' ? '中位数' : '均价']}
                  labelFormatter={(v) => formatDate(v as string, 'yyyy-MM-dd HH:mm')}
                  contentStyle={{ borderRadius: 12, borderColor: '#e7e5e4', fontSize: 12 }}
                />
                <Legend />
                <Line type="monotone" dataKey="median" name="median" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="avg" name="avg" stroke="#78716c" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* 商品列表（仅展示最具代表性的 3 件，捡漏优先） */}
      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20 text-stone-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
          <Gem className="w-10 h-10 mx-auto mb-3 text-stone-300" />
          <p className="font-semibold text-stone-500">暂无商品数据</p>
          <p className="text-sm mt-1">点击「立即采集」拉取藏宝阁商品，或添加搜索规则扩大监控范围</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-stone-600">最具代表性 {Math.min(filteredItems.length, 3)} 件（捡漏优先）</p>
            <p className="text-xs text-stone-400">共 {filteredItems.length} 件 · 规则「{ruleFilter === 'all' ? '全部' : ruleFilter}」</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.slice(0, 3).map((item) => {
            const meta = TYPE_META[item.type]
            const Icon = meta.icon
            const diff = priceDiff(item)
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group relative bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-3xl" aria-hidden="true" />
                {/* 头部：类型 + 名称 + 状态 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                    <h3 className="font-bold text-stone-800 truncate">{item.name}</h3>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.passFairShow
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${item.passFairShow ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                    {item.status || (item.passFairShow ? '上架中' : '公示期')}
                  </span>
                </div>

                {/* 等级 + 区服 */}
                <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                  {item.level && <span className="px-1.5 py-0.5 bg-stone-100 rounded">{item.level}</span>}
                  {item.server && <span className="truncate">{item.server}</span>}
                </div>

                {/* 价格 + 变化 */}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-stone-800">¥{item.price.toFixed(2)}</span>
                    {(() => {
                      const dev = deviationOf(item)
                      if (dev == null || dev >= -0.05) return null
                      return (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-600 animate-pulse">
                          捡漏 · 低{(Math.abs(dev) * 100).toFixed(0)}%
                        </span>
                      )
                    })()}
                    {diff && (
                      <span className={`ml-2 inline-flex items-center gap-0.5 text-xs font-semibold ${diff.diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {diff.diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {diff.diff > 0 ? '+' : ''}{diff.diff.toFixed(2)} ({diff.pct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-orange-500 transition-colors" />
                </div>

                {/* 摘要 + 卖家 */}
                {item.summary && (
                  <p className="mt-2 text-sm text-stone-600 line-clamp-2">{item.summary}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                  <span>{item.seller ? `卖家 ${item.seller}` : ''}</span>
                  <span>{item.sellingTime ? `上架 ${formatRelativeTime(item.sellingTime)}` : ''}</span>
                </div>
              </a>
            )
          })}
          </div>
        </div>
      )}

      {/* 搜索规则管理 */}
      {rules.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
            <Gem className="w-4 h-4 text-orange-500" />
            搜索规则（{rules.length}）
          </h3>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-stone-200 hover:border-stone-300">
                <button
                  onClick={() => toggleRule(rule)}
                  role="switch"
                  aria-checked={rule.enabled}
                  className={`relative w-9 h-5 rounded-full transition-colors ${rule.enabled ? 'bg-orange-500' : 'bg-stone-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-4' : ''}`} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-700 text-sm">{rule.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_META[rule.type].badge}`}>{TYPE_META[rule.type].label}</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {priceStats[rule.name] && (
                      <span className="text-orange-600 font-medium mr-1">
                        市场价 ¥{priceStats[rule.name].median.toFixed(0)}（样本 {priceStats[rule.name].sampleCount}）·
                      </span>
                    )}
                    {rule.priority === 'fast' && <span className="mr-1 text-red-500 font-semibold">高频</span>}
                    最低价前 {rule.topN || 10} 条
                    {rule.conditions?.kindid
                      ? ` · ${EQUIP_KINDS.find((k) => k.id === rule.conditions?.kindid)?.label || rule.conditions?.kindid}`
                      : ''}
                    {rule.conditions?.levelMin || rule.conditions?.levelMax
                      ? ` · 等级 ${rule.conditions?.levelMin ?? '-'}~${rule.conditions?.levelMax ?? '-'}`
                      : ''}
                    {rule.conditions?.priceMin || rule.conditions?.priceMax
                      ? ` · 价格 ${rule.conditions?.priceMin ?? '-'}~${rule.conditions?.priceMax ?? '-'}元`
                      : ''}
                    {rule.conditions?.initDamageRaw ? ` · 初伤≥${rule.conditions.initDamageRaw}` : ''}
                    {rule.conditions?.allDamage ? ` · 总伤≥${rule.conditions.allDamage}` : ''}
                    {rule.conditions?.damage ? ` · 伤害≥${rule.conditions.damage}` : ''}
                    {rule.conditions?.initDefense ? ` · 初防≥${rule.conditions.initDefense}` : ''}
                    {rule.conditions?.sumAttrType && rule.conditions?.sumAttrValue
                      ? ` · ${SUM_ATTRS.find((a) => a.value === rule.conditions?.sumAttrType)?.label || rule.conditions?.sumAttrType}≥${rule.conditions?.sumAttrValue}`
                      : ''}
                  </div>
                </div>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" aria-label="删除规则">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
