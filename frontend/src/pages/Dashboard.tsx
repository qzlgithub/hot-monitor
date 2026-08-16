import { useCallback, useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Eye, AlertCircle, Zap, RefreshCw, Loader2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import OnboardingGuide from '../components/OnboardingGuide'

interface TaskStatus {
  hotspotRunning: boolean
  notificationRunning: boolean
  lastHotspotRun: string | null
  lastNotificationRun: string | null
  hotspotInterval: number
  notificationInterval: number
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalKeywords: 0,
    todayHotspots: 0,
    alerts: 0,
    activeMonitors: 0,
  })

  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [checking, setChecking] = useState(false)

  const [chartData, setChartData] = useState([
    { time: '00:00', count: 0 },
    { time: '06:00', count: 0 },
    { time: '12:00', count: 0 },
    { time: '18:00', count: 0 },
    { time: '24:00', count: 0 },
  ])

  const fetchTaskStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks/status')
      if (response.ok) {
        const data = await response.json()
        setTaskStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch task status:', error)
    }
  }, [])

  const runManualCheck = async () => {
    if (checking) return
    setChecking(true)
    try {
      const response = await fetch('/api/tasks/check', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        toast.success('🚀 检查已启动，正在后台获取最新热点...')
      } else {
        toast.error(`❌ 启动失败: ${data.error || '未知错误'}`)
        setChecking(false)
        return
      }
      // 启动时立即刷新一次任务状态
      await fetchTaskStatus()
    } catch (error) {
      toast.error('❌ 请求失败，请检查后端服务')
      setChecking(false)
    }
  }

  // 当任务运行时，加速轮询以实时显示进度
  useEffect(() => {
    if (!checking) return
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/tasks/status')
        const task = await res.json() as TaskStatus
        setTaskStatus(task)
        // 两个任务都不在运行且已有运行记录，说明检查完成
        if (!task.hotspotRunning && !task.notificationRunning && task.lastHotspotRun) {
          setChecking(false)
          toast.success('✅ 检查完成，已获取最新热点')
          // 同步刷新统计
          const statsRes = await fetch('/api/dashboard/stats')
          if (statsRes.ok) setStats(await statsRes.json())
        }
      } catch (error) {
        console.error('Polling task status failed:', error)
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [checking])

  useEffect(() => {
    // 从后端获取数据
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      }
    }

    fetchDashboard()
    fetchTaskStatus()
    const interval = setInterval(() => {
      fetchDashboard()
      fetchTaskStatus()
    }, 30000) // 每30秒更新一次
    return () => clearInterval(interval)
  }, [fetchTaskStatus])

  // 如果没有关键词，显示引导页面
  if (stats.totalKeywords === 0) {
    return <OnboardingGuide />
  }

  const StatCard = ({ icon: Icon, label, value, trend }: any) => (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-6 card-hover focus-within:ring-2 focus-within:ring-amber-500">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-amber-500/20">
          <Icon className="w-6 h-6 text-amber-400" />
        </div>
        <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold gradient-text">{value}</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-in">
      {/* 页面标题 + 立即检查 */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">仪表盘</h1>
          <p className="text-slate-400">实时热点监控概览</p>
        </div>
        <button
          onClick={runManualCheck}
          disabled={checking}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-lg shadow-orange-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {checking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              检查中...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              立即检查
            </>
          )}
        </button>
      </div>

      {/* 任务运行状态 */}
      {taskStatus && (
        <div className="mb-6 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <Radio className={`w-4 h-4 ${taskStatus.hotspotRunning ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
            热点爬虫: 每 {taskStatus.hotspotInterval} 分钟
            {taskStatus.hotspotRunning && <span className="text-green-400">运行中...</span>}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <Radio className={`w-4 h-4 ${taskStatus.notificationRunning ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
            通知检查: 每 {taskStatus.notificationInterval} 分钟
            {taskStatus.notificationRunning && <span className="text-green-400">运行中...</span>}
          </span>
          {taskStatus.lastHotspotRun && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-500">
              上次热点: {new Date(taskStatus.lastHotspotRun).toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertCircle}
          label="监控关键词"
          value={stats.totalKeywords}
          trend="+2"
        />
        <StatCard
          icon={TrendingUp}
          label="今日热点"
          value={stats.todayHotspots}
          trend="+5"
        />
        <StatCard
          icon={Zap}
          label="新增告警"
          value={stats.alerts}
          trend="+1"
        />
        <StatCard
          icon={Eye}
          label="活跃监控"
          value={stats.activeMonitors}
          trend="100%"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 热点趋势 */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-6 card-hover">
          <h2 className="text-xl font-bold mb-4">热点趋势 (24小时)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis dataKey="time" stroke="rgba(148, 163, 184, 0.5)" />
              <YAxis stroke="rgba(148, 163, 184, 0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="url(#colorGradient)"
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 5 }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 热点分布 */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-6 card-hover">
          <h2 className="text-xl font-bold mb-4">分类分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Tech', value: 35 },
                  { name: 'Finance', value: 25 },
                  { name: 'Entertainment', value: 20 },
                  { name: 'Sports', value: 20 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#f97316" />
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
