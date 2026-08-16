import { useEffect, useState } from 'react'
import { Bell, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info'
  keyword: string
  source: string
  timestamp: string
  read: boolean
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 每30秒更新一次
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('已删除通知')
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('删除失败')
    }
  }

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.read === (filter === 'read'))

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-amber-400" />
            通知中心
          </h1>
          <p className="text-slate-400">
            {unreadCount > 0
              ? `您有 ${unreadCount} 条未读通知`
              : '所有通知已读'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button className="btn-primary">
            全部标记为已读
          </button>
        )}
      </div>

      {/* 过滤器 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:text-slate-100'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:text-slate-100'
          }`}
        >
          未读 ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'read'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
              : 'bg-slate-800/50 text-slate-300 hover:text-slate-100'
          }`}
        >
          已读
        </button>
      </div>

      {/* 通知列表 */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/10 rounded-xl p-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {filter === 'all' ? '暂无通知' : '暂无相关通知'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl p-4 card-hover transition-all ${
                notification.read
                  ? 'bg-slate-900/30 border border-slate-700/30'
                  : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 shadow-lg shadow-orange-500/10'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 图标 */}
                <div className={`p-3 rounded-lg flex-shrink-0 ${
                  notification.type === 'success'
                    ? 'bg-green-500/20'
                    : notification.type === 'warning'
                    ? 'bg-yellow-500/20'
                    : 'bg-teal-500/20'
                }`}>
                  {notification.type === 'warning' ? (
                    <AlertCircle className={`w-5 h-5 ${
                      notification.type === 'success'
                        ? 'text-green-400'
                        : notification.type === 'warning'
                        ? 'text-yellow-400'
                        : 'text-teal-400'
                    }`} />
                  ) : (
                    <CheckCircle className={`w-5 h-5 text-green-400`} />
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-slate-100">{notification.title}</h3>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{notification.message}</p>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="bg-slate-700/50 px-2 py-1 rounded">
                      关键词: {notification.keyword}
                    </span>
                    <span className="bg-slate-700/50 px-2 py-1 rounded">
                      来源: {notification.source}
                    </span>
                    <span>
                      {new Date(notification.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                {/* 操作 */}
                <div className="flex gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
                      title="标记为已读"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
