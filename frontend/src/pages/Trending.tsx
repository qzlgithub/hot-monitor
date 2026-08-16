import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, Share2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Spotlight } from '../components/ui/Spotlight'
import { MovingBorderCard } from '../components/ui/MovingBorder'

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
}

export default function Trending() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchHotspots()
    const interval = setInterval(fetchHotspots, 60000) // 每分钟刷新一次
    return () => clearInterval(interval)
  }, [])

  const fetchHotspots = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/hotspots')
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
      }
    } catch (error) {
      console.error('Failed to fetch hotspots:', error)
      toast.error('获取热点失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredHotspots = filter === 'all'
    ? hotspots
    : hotspots.filter(h => h.source === filter)

  const categories = ['all', ...new Set(hotspots.map(h => h.source))]

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

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="relative flex items-center justify-between mb-8">
        <Spotlight className="-top-8 left-0" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">热点发现</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              {hotspots.length} 条实时热点
            </span>
          </div>
          <p className="text-stone-500 mt-1.5">AI 识别实时热点，抢先一步发现趋势</p>
        </div>

        <button
          onClick={fetchHotspots}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-lg shadow-orange-600/25 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-100 disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '更新中...' : '刷新'}
        </button>
      </div>

      {/* 过滤器 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
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
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* 热点列表 */}
      <div className="space-y-4">
        {filteredHotspots.length === 0 ? (
          <div className="relative overflow-hidden bg-white border border-stone-200 rounded-xl p-12 text-center">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
            <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">暂无热点数据，请稍后再试</p>
          </div>
        ) : (
          filteredHotspots.map((hotspot, index) => (
            <MovingBorderCard key={hotspot.id} borderRadius="0.85rem">
              <div className="p-6 card-hover group h-full">
              {/* 排名和热度 */}
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

                    {/* 热度分数 */}
                    <div className="mb-3">
                      <ScoreBar score={hotspot.score} />
                    </div>

                    {/* 标签 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-amber-500/15 text-orange-600 px-2 py-1 rounded-full">
                        {hotspot.source}
                      </span>
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                        {hotspot.category}
                      </span>
                      {hotspot.keywords.map((kw) => (
                        <span key={kw} className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 趋势和操作 */}
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <TrendingUp className={`w-5 h-5 ${hotspot.trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-bold ${hotspot.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hotspot.trend > 0 ? '+' : ''}{hotspot.trend}%
                    </span>
                  </div>

                  <a
                    href={hotspot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-500/15 rounded-lg transition-colors text-stone-400 hover:text-orange-600"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>

                  <button className="p-2 hover:bg-amber-500/15 rounded-lg transition-colors text-stone-400 hover:text-orange-600">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 时间信息 */}
              <p className="text-xs text-stone-400">
                {new Date(hotspot.timestamp).toLocaleString('zh-CN')}
              </p>
              </div>
            </MovingBorderCard>
          ))
        )}
      </div>
    </div>
  )
}
