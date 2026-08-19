import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Radar, RefreshCw, TrendingUp, Share2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Spotlight } from '../components/ui/Spotlight'
import { MovingBorderCard } from '../components/ui/MovingBorder'
import { getSourceMeta, formatCount, isViewCountSource } from '../utils/helpers'

type SortKey = 'hot' | 'latest' | 'score'

interface Hotspot {
  id: string
  title: string
  description: string
  source: string
  category: string
  score: number
  trend: number
  url: string
  timestamp: string
  keywords: string[]
  hotScore?: number
  firstSeenAt?: string
  lastSeenAt?: string
  reasoning?: string
  keywordMentioned?: boolean
  relevanceType?: 'direct' | 'indirect'
}

export default function Trending() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('hot')
  const [keywordNames, setKeywordNames] = useState<string[]>([])
  const [keywordFilter, setKeywordFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchHotspots()
    fetchKeywords()
    const interval = setInterval(() => fetchHotspots(), 60000) // 每分钟刷新一次
    return () => clearInterval(interval)
  }, [sort])

  const fetchHotspots = async (sortValue: SortKey = sort, manual = false) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/hotspots?sort=${sortValue}`)
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
        if (manual) toast.success('热点已刷新')
      }
    } catch (error) {
      console.error('Failed to fetch hotspots:', error)
      toast.error('获取热点失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取监控中的关键词（active），用于关键词分组 Tab
  const fetchKeywords = async () => {
    try {
      const response = await fetch('/api/keywords')
      if (response.ok) {
        const data = await response.json()
        const active = data.filter((k: any) => k.isActive).map((k: any) => k.keyword)
        setKeywordNames(active)
        // 默认选中第一个 active 关键词；若当前选中的关键词已被禁用/删除，自动切到第一个 active
        setKeywordFilter((prev) => {
          if (active.length === 0) return 'all'
          if (prev === 'all') return active[0]
          if (active.includes(prev)) return prev
          return active[0]
        })
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error)
    }
  }

  // 先按关键词分组过滤，再叠加来源过滤
  // 「全部」视图只包含 active 关键词的热点（被禁用/删除关键词的热点不显示）
  const activeSet = new Set(keywordNames)
  const allActiveCount = hotspots.filter(h => h.keywords.some(k => activeSet.has(k))).length
  const byKeyword = keywordFilter === 'all'
    ? hotspots.filter(h => h.keywords.some(k => activeSet.has(k)))
    : hotspots.filter(h => h.keywords.includes(keywordFilter))

  const filteredHotspots = filter === 'all'
    ? byKeyword
    : byKeyword.filter(h => h.source === filter)

  const categories = ['all', ...new Set(hotspots.map(h => h.source))]

  // 统计数据：今日新增（按 firstSeenAt 判断是否今天）、紧急热点（score>=9）
  const todayHotspots = byKeyword.filter((h) => {
    const d = new Date(h.firstSeenAt || h.timestamp)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }).length
  const urgentHotspots = byKeyword.filter((h) => (h.score ?? 0) >= 8).length

  // 立即检查：触发后端收集，轮询等待收集完成后再自动刷新
  const runCheck = async () => {
    try {
      const res = await fetch('/api/tasks/check', { method: 'POST' })
      if (res.ok) {
        toast.success('检查已启动，收集完成后自动刷新')
        // 轮询任务状态，最多等 3 分钟（每 5 秒一次）
        for (let i = 0; i < 36; i++) {
          await new Promise((r) => setTimeout(r, 5000))
          try {
            const s = await fetch('/api/tasks/status').then((r) => r.json())
            if (!s.hotspotRunning) break
          } catch {
            break
          }
        }
        fetchHotspots()
        fetchKeywords()
        toast.success('收集完成，数据已更新')
      } else {
        toast.error('检查启动失败')
      }
    } catch {
      toast.error('检查启动失败')
    }
  }

  const ScoreBar = ({ score }: { score: number }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
          style={{ width: `${Math.min(score * 10, 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-amber-400">{score.toFixed(1)}</span>
    </div>
  )

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-600/20'
        : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
    }`

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="relative flex items-center justify-between mb-8">
        <Spotlight className="-top-8 left-0" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">热点雷达</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              {filteredHotspots.length} 条实时热点
            </span>
          </div>
          <p className="text-stone-500 mt-1.5">AI 识别实时热点，抢先一步发现趋势</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchHotspots(undefined, true); fetchKeywords() }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-800 hover:border-stone-300 font-semibold transition-all"
            title="重新拉取当前数据"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={runCheck}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-lg shadow-orange-600/25 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-100 active:scale-95"
          >
            <Radar className="w-4 h-4" />
            立即检查
          </button>
        </div>
      </div>

      {/* 统计概览：总热数 / 今日新增 / 紧急热点 / 监控词 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative overflow-hidden bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <Spotlight className="-top-16 -left-8" />
          <div className="text-xs font-medium text-stone-500">总热数</div>
          <div className="mt-1 text-2xl font-bold text-stone-800">{byKeyword.length}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-stone-500">今日新增</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{todayHotspots}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-stone-500">紧急热点</div>
          <div className="mt-1 text-2xl font-bold text-red-500">{urgentHotspots}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-medium text-stone-500">监控词</div>
          <div className="mt-1 text-2xl font-bold text-orange-600">{keywordNames.length}</div>
        </div>
      </div>

      <>
          {/* 关键词分组：全部 / 各监控关键词（默认第一个，避免混排） */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setKeywordFilter('all')} className={tabClass(keywordFilter === 'all')}>
              全部
              <span className="ml-1.5 text-xs opacity-70">{allActiveCount}</span>
            </button>
            {keywordNames.map((name) => (
              <button key={name} onClick={() => setKeywordFilter(name)} className={tabClass(keywordFilter === name)}>
                {name}
                <span className="ml-1.5 text-xs opacity-70">
                  {hotspots.filter(h => h.keywords.includes(name)).length}
                </span>
              </button>
            ))}
          </div>

          {/* 来源过滤器 + 排序 */}
          <div className="flex items-center gap-2 pb-2">
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    filter === cat
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                      : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
                  }`}
                >
                  {cat === 'all' ? '全部' : getSourceMeta(cat).label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="ml-auto shrink-0 pl-3 pr-9 py-2 rounded-lg border border-stone-200 bg-white text-sm font-semibold text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              aria-label="排序方式"
            >
              <option value="hot">综合热度</option>
              <option value="latest">最新</option>
              <option value="score">相关性</option>
            </select>
          </div>

          {/* 热点列表（整卡可点，跳转来源详情；最多展示 10 条） */}
          <div className="space-y-4">
            {filteredHotspots.length === 0 ? (
              <div className="relative overflow-hidden bg-white border border-stone-200 rounded-xl p-12 text-center">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
                <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">暂无热点数据</p>
                <p className="text-xs text-stone-400 mt-1">先添加/开启关键词，再点击「立即检查」收集热点</p>
                <Link to="/keywords" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-600/25 hover:from-amber-400 hover:to-orange-500 transition-all">
                  <Plus className="w-4 h-4" /> 去添加关键词
                </Link>
              </div>
            ) : (
              filteredHotspots.slice(0, showAll ? undefined : 10).map((hotspot, index) => (
                <MovingBorderCard key={hotspot.id} borderRadius="0.85rem">
                  <a
                    href={hotspot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="点击查看详情"
                    className="block p-6 card-hover group h-full cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-500">#{index + 1}</span>
                          {index === 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-orange-400 animate-pulse" aria-hidden="true" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-stone-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {hotspot.title}
                          </h3>
                          <p className="text-sm text-stone-500 line-clamp-2 mb-3">
                            {hotspot.description}
                          </p>

                          <div className="mb-3">
                            <ScoreBar score={hotspot.score} />
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${getSourceMeta(hotspot.source).badge}`}>
                              {getSourceMeta(hotspot.source).label}
                            </span>
                            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                              {hotspot.category}
                            </span>
                            {hotspot.relevanceType && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  hotspot.relevanceType === 'direct'
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {hotspot.relevanceType === 'direct' ? '直接相关' : '间接相关'}
                              </span>
                            )}
                            {hotspot.keywords.map((kw) => (
                              <span key={kw} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center gap-1">
                          <TrendingUp className={`w-5 h-5 ${hotspot.trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={`text-xs font-bold ${hotspot.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {isViewCountSource(hotspot.source)
                              ? `播放 ${formatCount(hotspot.trend)}`
                              : `${hotspot.trend > 0 ? '+' : ''}${hotspot.trend}%`}
                          </span>
                        </div>

                        <button
                          className="p-2 hover:bg-amber-500/15 rounded-lg transition-colors text-stone-400 hover:text-orange-600"
                          title="复制链接"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            navigator.clipboard?.writeText(hotspot.url).catch(() => {})
                            toast.success('链接已复制')
                          }}
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-stone-400">
                      {new Date(hotspot.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </a>
                </MovingBorderCard>
              ))
            )}
          </div>

          {filteredHotspots.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-700 hover:border-stone-300 font-semibold text-sm transition-all"
            >
              {showAll ? '收起' : `查看全部 ${filteredHotspots.length} 条`}
            </button>
          )}
        </>
    </div>
  )
}
