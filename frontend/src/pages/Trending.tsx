import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, Share2, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { Spotlight } from '../components/ui/Spotlight'
import { MovingBorderCard } from '../components/ui/MovingBorder'
import { getSourceMeta, formatCount, isViewCountSource, formatRelativeTime } from '../utils/helpers'

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

// B 站全站热门（「热门发现」板块，与关键词热点分开）
interface TrendingVideo {
  id: string
  title: string
  description: string
  url: string
  author: string
  play: number
  like: number
  pic: string
  category: string
  pubdate: string
  collectedAt: string
}

export default function Trending() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<'keyword' | 'popular'>('keyword')

  useEffect(() => {
    fetchHotspots()
    fetchTrending()
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

  const fetchTrending = async () => {
    try {
      const response = await fetch('/api/trending')
      if (response.ok) {
        const data = await response.json()
        setTrendingVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch trending videos:', error)
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
            <h1 className="text-4xl font-bold">热点发现</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              {view === 'keyword' ? `${hotspots.length} 条实时热点` : `${trendingVideos.length} 条热门视频`}
            </span>
          </div>
          <p className="text-stone-500 mt-1.5">AI 识别实时热点，抢先一步发现趋势</p>
        </div>

        <button
          onClick={view === 'keyword' ? fetchHotspots : fetchTrending}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-lg shadow-orange-600/25 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-100 disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '更新中...' : '刷新'}
        </button>
      </div>

      {/* 板块切换：关键词热点 / 热门发现 */}
      <div className="flex gap-2">
        <button onClick={() => setView('keyword')} className={tabClass(view === 'keyword')}>
          关键词热点
        </button>
        <button onClick={() => setView('popular')} className={tabClass(view === 'popular')}>
          热门发现
        </button>
      </div>

      {view === 'keyword' ? (
        <>
          {/* 来源过滤器 */}
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
                {cat === 'all' ? '全部' : getSourceMeta(cat).label}
              </button>
            ))}
          </div>

          {/* 热点列表（整卡可点，跳转来源详情） */}
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
        </>
      ) : (
        /* 热门发现：B 站全站热门（整卡可点跳转） */
        <div className="space-y-4">
          {trendingVideos.length === 0 ? (
            <div className="relative overflow-hidden bg-white border border-stone-200 rounded-xl p-12 text-center">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-pink-500/10 blur-3xl" aria-hidden="true" />
              <Flame className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500">暂无热门视频，请稍后刷新再试</p>
            </div>
          ) : (
            trendingVideos.map((video) => (
              <MovingBorderCard key={video.id} borderRadius="0.85rem">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="点击查看详情"
                  className="block p-5 card-hover group h-full cursor-pointer"
                >
                  <div className="flex gap-4">
                    {video.pic && (
                      <img
                        src={video.pic}
                        alt={video.title}
                        loading="lazy"
                        className="w-36 h-24 object-cover rounded-lg bg-stone-100 flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-stone-800 line-clamp-2 group-hover:text-pink-600 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-stone-500 line-clamp-1 mt-1">
                        {video.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-pink-500/15 text-pink-600 px-2 py-0.5 rounded-full">B站</span>
                        {video.category && (
                          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{video.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                        <span className="truncate">UP主: {video.author}</span>
                        <span className="text-pink-600 font-semibold whitespace-nowrap">播放 {formatCount(video.play)}</span>
                        <span className="whitespace-nowrap">{formatRelativeTime(video.pubdate)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              </MovingBorderCard>
            ))
          )}
        </div>
      )}
    </div>
  )
}
