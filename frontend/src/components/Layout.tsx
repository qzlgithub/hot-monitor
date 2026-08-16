import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Flame, Plus, TrendingUp, Bell, Menu, X } from 'lucide-react'

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
  ]

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen bg-stone-100">
      {/* 移动设备菜单按钮 */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 hover:bg-stone-200 rounded-lg transition-colors"
        aria-label="切换侧边栏"
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? (
          <X className="w-6 h-6 text-stone-600" />
        ) : (
          <Menu className="w-6 h-6 text-stone-600" />
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
        } fixed md:static inset-y-0 left-0 w-64 border-r border-stone-200 bg-white/80 backdrop-blur-xl p-6 transition-transform duration-300 z-30 flex flex-col overflow-y-auto`}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Flame className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold gradient-text">热点监控</h1>
          </div>
          <p className="text-xs text-stone-500">实时热点 · 第一时间发现</p>
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-orange-600 border border-amber-500/30 shadow-inner'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 focus-visible:text-stone-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 底部提示 */}
        <div className="border-t border-stone-200 pt-4 mt-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-orange-500/20 p-4">
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-orange-500/20 blur-2xl" aria-hidden="true" />
            <p className="text-xs text-stone-700 mb-2 font-semibold flex items-center gap-1.5">
              ⚡ 快速开始
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              添加关键词，第一时间发现并分享热点。
            </p>
          </div>
        </div>
      </aside>

      {/* 主要内容区 */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0 relative z-10">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
