import { ArrowRight, Plus, TrendingUp, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingGuide() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
      {/* 欢迎卡片 */}
      <div className="max-w-3xl text-center mb-16">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/50">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-5xl font-bold mb-4 gradient-text">欢迎使用热点监控</h1>
        <p className="text-xl text-slate-300 mb-2">实时发现、智能分析、及时通知</p>
        <p className="text-slate-400 mb-12">3个步骤，开始掌握热点变化</p>
      </div>

      {/* 步骤流程 */}
      <div className="max-w-4xl w-full mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 步骤 1：添加关键词 */}
          <div className="group">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-6 card-hover h-full">
              <div className="w-14 h-14 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mb-4">
                <Plus className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">1. 添加关键词</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                在"关键词"页面输入您想监控的热点主题，可添加多个不同分类的关键词。
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                例如：AI编程、ChatGPT、技术前沿
              </div>
            </div>
          </div>

          {/* 箭头 */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-amber-400 opacity-50" />
          </div>

          {/* 步骤 2：系统监控 */}
          <div className="group">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-6 card-hover h-full">
              <div className="w-14 h-14 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center mb-4 animate-pulse">
                <TrendingUp className="w-7 h-7 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">2. 系统监控中</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                系统自动从多个信息源收集相关热点，使用 AI 进行真实性识别和相关性评分。
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                数据源：Web、Twitter、知乎、小红书
              </div>
            </div>
          </div>

          {/* 箭头 */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-8 h-8 text-amber-400 opacity-50" />
          </div>

          {/* 步骤 3：接收通知 */}
          <div className="group">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-6 card-hover h-full">
              <div className="w-14 h-14 rounded-lg bg-green-600/20 border border-green-500/50 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-lg font-bold mb-2">3. 接收通知</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                热点匹配您的关键词时，系统立即发送浏览器通知和邮件提醒。
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                方式：实时推送 + 邮件告警
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 特性列表 */}
      <div className="max-w-2xl w-full mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">系统特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🤖', title: 'AI 识别', desc: '智能过滤虚假热点' },
            { icon: '📊', title: '数据可视化', desc: '热点趋势一目了然' },
            { icon: '🌍', title: '多源聚合', desc: '覆盖全网热点' },
            { icon: '⚡', title: '实时推送', desc: '第一时间获知信息' },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <span className="text-2xl flex-shrink-0">{feature.icon}</span>
              <div>
                <p className="font-semibold text-slate-100">{feature.title}</p>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 立即开始 CTA */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/keywords')}
          className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg"
          aria-label="前往关键词管理页面，开始添加监控关键词"
        >
          <Plus className="w-5 h-5" />
          添加第一个关键词
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="btn-secondary flex items-center justify-center gap-2 px-8 py-3 text-lg"
          aria-label="查看仪表盘概览"
        >
          查看仪表盘
        </button>
      </div>

      {/* 底部提示 */}
      <div className="mt-16 max-w-2xl text-center">
        <div className="p-4 rounded-lg bg-amber-600/10 border border-amber-500/20">
          <p className="text-sm text-slate-300">
            💡 <strong>提示：</strong> 系统会每30分钟自动检查一次热点变化，也可随时点击"立即检查"手动触发。首次使用建议添加 2-3 个感兴趣的关键词。
          </p>
        </div>
      </div>
    </div>
  )
}
