import { useState } from 'react'
import {
  Target,
  Radar,
  BellRing,
  ArrowRight,
  Zap,
  Globe,
  Cpu,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Workflow,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

interface ApiEndpoint {
  method: string
  path: string
  desc: string
}

interface Skill {
  id: string
  name: string
  icon: any
  tagline: string
  description: string
  features: string[]
  endpoints: ApiEndpoint[]
  useCases: string[]
  gradient: string
}

const skills: Skill[] = [
  {
    id: 'keyword-monitor',
    name: '热点关键词监控',
    icon: Target,
    tagline: 'Skill 1 · 设置监控词，锁定关注领域',
    description:
      '添加和管理需要监控的关键词，系统后台持续跟踪这些主题的动态变化，为后续热点发现和通知提供基础。',
    features: [
      '支持多分类管理（技术、金融、娱乐等）',
      '启用/禁用按需切换',
      '后台自动扫描（每 30 分钟）',
      '关键词状态实时追踪',
    ],
    endpoints: [
      { method: 'POST', path: '/keywords', desc: '添加新关键词' },
      { method: 'GET', path: '/keywords', desc: '查看所有监控词' },
      { method: 'PATCH', path: '/keywords/{id}', desc: '启用/禁用' },
      { method: 'DELETE', path: '/keywords/{id}', desc: '删除关键词' },
    ],
    useCases: ['追踪 AI 技术前沿', '监控行业热点', '跟进娱乐资讯'],
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'detection-engine',
    name: '热点发现引擎',
    icon: Radar,
    tagline: 'Skill 2 · 多源聚合 + AI 识别',
    description:
      '从 Web、Twitter、知乎、小红书等数据源实时聚合热点，使用 DeepSeek AI 识别真实趋势、评估热度并自动分类。',
    features: [
      '多信息源实时聚合',
      'AI 真实性识别（过滤虚假热点）',
      '热度评分 0-10 + 趋势方向',
      '按分类 / 来源灵活筛选',
    ],
    endpoints: [
      { method: 'GET', path: '/hotspots', desc: '获取实时热点列表' },
      { method: 'GET', path: '/hotspots/category/{cat}', desc: '按分类筛选' },
      { method: 'GET', path: '/hotspots/source/{src}', desc: '按来源筛选' },
    ],
    useCases: ['内容创作选题', '行业趋势分析', '竞品动态监控'],
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'notification-alerts',
    name: '实时通知告警',
    icon: BellRing,
    tagline: 'Skill 3 · 多渠道即时告警',
    description:
      '热点命中关键词时自动生成通知，支持浏览器推送与邮件告警，帮助您在第一时间掌握重要动态。',
    features: [
      '浏览器实时推送',
      '邮件 HTML 告警',
      '通知去重与聚合',
      '已读 / 未读管理',
    ],
    endpoints: [
      { method: 'GET', path: '/notifications', desc: '查看所有通知' },
      { method: 'PATCH', path: '/notifications/{id}/read', desc: '标记已读' },
      { method: 'DELETE', path: '/notifications/{id}', desc: '删除通知' },
    ],
    useCases: ['重要动态实时追踪', '异常预警提醒', '订阅内容推送'],
    gradient: 'from-red-500 to-rose-600',
  },
]

const workflowSteps = [
  {
    icon: Target,
    title: '添加关键词',
    desc: '在"关键词"页面配置关注主题',
  },
  {
    icon: Cpu,
    title: 'AI 分析',
    desc: 'DeepSeek 识别真实性并评分',
  },
  {
    icon: Globe,
    title: '多源采集',
    desc: 'Web / Twitter / 知乎 / 小红书',
  },
  {
    icon: BellRing,
    title: '即时通知',
    desc: '浏览器推送 + 邮件告警',
  },
]

export default function SkillsCenter() {
  const [expanded, setExpanded] = useState<string | null>('keyword-monitor')
  const [copied, setCopied] = useState<string | null>(null)

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      toast.success('✅ 已复制到剪贴板')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('❌ 复制失败')
    }
  }

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div className="space-y-8 animate-slide-in">
      {/* 页面标题 */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="w-9 h-9 text-amber-400" />
          技能中心
        </h1>
        <p className="text-slate-400">
          本系统由 3 个可复用的 Agent Skills 组成，了解每个技能的能力与接入方式
        </p>
      </div>

      {/* 技能概览横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border border-orange-500/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold">三大 Skills 协同工作流</h2>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          关键词监控定义"关注什么"，热点发现引擎负责"发现什么"，通知告警保证"第一时间知道"。
          三者通过 API 无缝衔接，构成完整的自动化热点监控闭环。
        </p>
        {/* 工作流步骤条 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="relative bg-slate-900/50 border border-slate-700/40 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-orange-400">STEP {i + 1}</span>
                </div>
                <p className="font-semibold text-slate-100 text-sm">{step.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/40 z-10" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 技能卡片列表 */}
      <div className="space-y-4">
        {skills.map((skill) => {
          const Icon = skill.icon
          const isOpen = expanded === skill.id
          return (
            <div
              key={skill.id}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-2xl overflow-hidden card-hover"
            >
              {/* 卡片头部 */}
              <button
                onClick={() => toggle(skill.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/30 transition-colors"
                aria-expanded={isOpen}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${skill.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-100">{skill.name}</h3>
                  <p className="text-sm text-slate-400 truncate">{skill.tagline}</p>
                </div>
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                    {skill.endpoints.length} 个 API
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </button>

              {/* 展开内容 */}
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-700/30">
                  <p className="text-slate-300 text-sm leading-relaxed mb-4 mt-4">
                    {skill.description}
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 关键功能 */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                        关键功能
                      </h4>
                      <ul className="space-y-2">
                        {skill.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-amber-400 mt-0.5 flex-shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3 mt-6">
                        典型场景
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skill.useCases.map((u) => (
                          <span
                            key={u}
                            className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-full"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* API 端点 */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                        API 端点
                      </h4>
                      <div className="space-y-2">
                        {skill.endpoints.map((ep) => {
                          const code = `${ep.method} ${ep.path}`
                          const isCopied = copied === code
                          return (
                            <div
                              key={code}
                              className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-2 group"
                            >
                              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                ep.method === 'GET'
                                  ? 'bg-teal-500/20 text-teal-300'
                                  : ep.method === 'POST'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : ep.method === 'PATCH'
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}>
                                {ep.method}
                              </span>
                              <code className="text-xs font-mono text-slate-300 flex-1">
                                {ep.path}
                              </code>
                              <button
                                onClick={() => copyCode(code)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-amber-300 p-1"
                                aria-label={`复制 ${code}`}
                              >
                                {isCopied ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部提示 */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-700/40 p-5 flex items-start gap-3">
        <Workflow className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-slate-300 font-semibold mb-1">
            提示：如何组合使用？
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            先去<strong className="text-amber-300">关键词</strong>页面添加关注主题 → 在
            <strong className="text-amber-300">热点</strong>页面查看 AI 识别结果 → 到
            <strong className="text-amber-300">通知</strong>页面管理告警。三个技能彼此联动，全程无需手动干预。
            完整 API 文档见项目 <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">skills/</code> 目录。
          </p>
        </div>
      </div>
    </div>
  )
}
