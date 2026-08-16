import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flame, Plus, TrendingUp, Bell, Sparkles, Menu, X } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: '/', label: '仪表盘', icon: Flame },
    { href: '/keywords', label: '关键词', icon: Plus },
    { href: '/trending', label: '热点', icon: TrendingUp },
    { href: '/notifications', label: '通知', icon: Bell },
    { href: '/skills', label: '技能', icon: Sparkles },
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-slate-950">
      {/* 移动设备菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="切换侧边栏"
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-slate-300" />
        ) : (
          <Menu className="w-6 h-6 text-slate-300" />
        )}
      </button>

      {/* 移动设备遮罩 */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 w-64 border-r border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-950 p-6 transition-transform duration-300 z-30 flex flex-col overflow-y-auto`}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">热点监控</h1>
          </div>
          <p className="text-xs text-slate-400">实时热点发现系统</p>
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 focus-visible:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 底部提示 */}
        <div className="border-t border-slate-700/30 pt-4 mt-4">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <p className="text-xs text-slate-300 mb-2 font-semibold">💡 快速开始</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              添加关键词后，系统将自动监控相关热点变化并发送通知。
            </p>
          </div>
        </div>
      </aside>

      {/* 主要内容区 */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
