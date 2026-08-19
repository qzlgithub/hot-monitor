/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format: string = 'yyyy-MM-dd HH:mm'): string {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('yyyy', String(yyyy))
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('HH', HH)
    .replace('mm', mm)
    .replace('ss', ss)
}

/**
 * 相对时间格式（如"2小时前"）
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return formatDate(date, 'yyyy-MM-dd')
}

/**
 * 数据源元信息（显示名 + 品牌色样式类）
 */
export function getSourceMeta(source: string): { label: string; badge: string } {
  const s = (source || '').toLowerCase()
  if (s.includes('bili')) return { label: 'B站', badge: 'bg-pink-500/15 text-pink-600' }
  if (s.includes('baidu') || s.includes('百度')) return { label: '百度', badge: 'bg-blue-500/15 text-blue-600' }
  if (s.includes('google')) return { label: 'Google', badge: 'bg-emerald-500/15 text-emerald-600' }
  if (s.includes('zhihu') || s.includes('知乎')) return { label: '知乎', badge: 'bg-cyan-500/15 text-cyan-600' }
  if (s.includes('twitter') || s.includes('x.com')) return { label: 'X/Twitter', badge: 'bg-sky-500/15 text-sky-600' }
  return { label: source || '未知', badge: 'bg-amber-500/15 text-orange-600' }
}

/**
 * 格式化大数字（播放量/点赞等）：12345 → 1.2万，340000000 → 3.4亿
 */
export function formatCount(n: number): string {
  const num = Number(n) || 0
  if (num >= 100000000) return (num / 100000000).toFixed(1).replace(/\.0$/, '') + '亿'
  if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(num)
}

/**
 * 判断是否为「播放量」类趋势来源（B 站等视频平台），显示"播放 x"而非百分比
 */
export function isViewCountSource(source: string): boolean {
  const s = (source || '').toLowerCase()
  return s.includes('bili')
}
