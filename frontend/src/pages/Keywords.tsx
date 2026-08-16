import { useEffect, useState } from 'react'
import { Plus, X, Search, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Keyword {
  id: string
  keyword: string
  category: string
  createdAt: string
  lastUpdated: string
  isActive: boolean
}

export default function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    try {
      const response = await fetch('/api/keywords')
      if (response.ok) {
        const data = await response.json()
        setKeywords(data)
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error)
      toast.error('获取关键词失败')
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error('请输入关键词')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword, category }),
      })

      if (response.ok) {
        toast.success(`✅ 已添加关键词: ${newKeyword}`)
        setNewKeyword('')
        setCategory('general')
        fetchKeywords()
      } else {
        toast.error('❌ 添加失败')
      }
    } catch (error) {
      console.error('Failed to add keyword:', error)
      toast.error('❌ 请求失败')
    } finally {
      setLoading(false)
    }
  }

  const deleteKeyword = async (id: string) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('已删除关键词')
        fetchKeywords()
      }
    } catch (error) {
      console.error('Failed to delete keyword:', error)
      toast.error('删除失败')
    }
  }

  const toggleKeyword = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchKeywords()
      }
    } catch (error) {
      console.error('Failed to toggle keyword:', error)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">关键词管理</h1>
        <p className="text-stone-500">添加和管理需要监控的关键词</p>
      </div>

      {/* 添加关键词 */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-orange-500" />
          添加新关键词
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="输入关键词 (例如: AI编程, ChatGPT 更新)"
                className="w-full px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors text-stone-800 placeholder-stone-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors text-stone-800"
            >
              <option value="general">通用</option>
              <option value="tech">技术</option>
              <option value="finance">金融</option>
              <option value="entertainment">娱乐</option>
              <option value="sports">体育</option>
              <option value="other">其他</option>
            </select>

            <button
              onClick={addKeyword}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      </div>

      {/* 关键词列表 */}
      <div className="space-y-3">
        {keywords.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
            <Search className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">暂无关键词，添加一个开始监控吧！</p>
          </div>
        ) : (
          keywords.map((kw) => (
            <div
              key={kw.id}
              className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-sm card-hover"
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleKeyword(kw.id, kw.isActive)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    kw.isActive
                      ? 'bg-amber-500/20 border-amber-500'
                      : 'border-stone-300'
                  }`}
                >
                  {kw.isActive && <CheckCircle className="w-4 h-4 text-orange-500" />}
                </button>

                <div className="flex-1">
                  <p className="font-semibold text-stone-800">{kw.keyword}</p>
                  <p className="text-xs text-stone-500">
                    分类: {kw.category} · 最后更新: {new Date(kw.lastUpdated).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  kw.isActive
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {kw.isActive ? '监控中' : '已禁用'}
                </div>
              </div>

              <button
                onClick={() => {
                if (confirm(`确认删除关键词 "${kw.keyword}" 吗？`)) {
                  deleteKeyword(kw.id)
                }
              }}
                className="flex-shrink-0 p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-label={`删除关键词 ${kw.keyword}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
