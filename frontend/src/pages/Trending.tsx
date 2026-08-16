import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, Share2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

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
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">热点发现</h1>
          <p className="text-slate-400">AI识别的实时热点事件</p>
        </div>

        <button
          onClick={fetchHotspots}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
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
                : 'bg-slate-800/50 text-slate-300 hover:text-slate-100'
            }`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      {/* 热点列表 */}
      <div className="space-y-4">
        {filteredHotspots.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">暂无热点数据，请稍后再试</p>
          </div>
        ) : (
          filteredHotspots.map((hotspot, index) => (
            <div
              key={hotspot.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-6 card-hover group"
            >
              {/* 排名和热度 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-amber-400">#{index + 1}</span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-2 group-hover:text-amber-300 transition-colors">
                      {hotspot.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {hotspot.description}
                    </p>

                    {/* 热度分数 */}
                    <div className="mb-3">
                      <ScoreBar score={hotspot.score} />
                    </div>

                    {/* 标签 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                        {hotspot.source}
                      </span>
                      <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full">
                        {hotspot.category}
                      </span>
                      {hotspot.keywords.map((kw) => (
                        <span key={kw} className="text-xs bg-slate-700/30 text-slate-300 px-2 py-1 rounded-full">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 趋势和操作 */}
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <TrendingUp className={`w-5 h-5 ${hotspot.trend > 0 ? 'text-green-400' : 'text-red-400'}`} />
                    <span className={`text-xs font-bold ${hotspot.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {hotspot.trend > 0 ? '+' : ''}{hotspot.trend}%
                    </span>
                  </div>

                  <a
                    href={hotspot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors text-slate-400 hover:text-amber-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>

                  <button className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors text-slate-400 hover:text-amber-300">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 时间信息 */}
              <p className="text-xs text-slate-500">
                {new Date(hotspot.timestamp).toLocaleString('zh-CN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
