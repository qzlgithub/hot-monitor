import { deepSeekService } from './deepseekService.js'
import config from '../config/index.js'

// 关键词扩展服务：用 DeepSeek 为关键词生成搜索变体
// （如「鱼皮的AI导航」→「程序员鱼皮的AI导航」「AI导航鱼皮」「鱼皮AI编程教程」），
// 提高单关键词搜索的召回率。生成失败 / 未配置时降级为仅原词，不影响主流程。
class KeywordExpansionService {
  // 生成变体（含原词），最多 variantCount 个；任何异常都兜底返回 [keyword]
  async expand(keyword: string): Promise<string[]> {
    if (!config.keywordExpansion.enabled || !(await deepSeekService.isConfigured())) {
      return [keyword]
    }

    const count = Math.max(1, config.keywordExpansion.variantCount || 5)

    try {
      const prompt = `你是搜索关键词扩展助手。请根据核心关键词生成用于内容搜索的变体短语，以覆盖更多相关结果。
要求：
- 共生成 ${count} 个变体，必须包含原关键词本身
- 变体可以来自：同义词/近义词、补充修饰词（如"程序员""教程""入门""最新"等）、不同语序、更具体的场景化表达
- 各变体之间要有明显区分度，不要只做微小改动
- 每个变体不超过 20 个字
原关键词：${keyword}
只返回 JSON 字符串数组，例如：["${keyword}","变体2","变体3"]，不要返回任何其他内容。`

      const result = await deepSeekService.chat([{ role: 'user', content: prompt }], 0.7)
      const parsed = this.parseVariants(result)
      const variants = this.dedupe([keyword, ...parsed])
      return variants.slice(0, count)
    } catch (error) {
      console.error(`关键词扩展失败，降级为仅原词「${keyword}」:`, (error as Error).message)
      return [keyword]
    }
  }

  // 从模型输出中提取 JSON 数组（容忍 ```json 代码块包裹 / 前后杂质）
  private parseVariants(raw: string): string[] {
    const trimmed = (raw || '').trim()
    const match = trimmed.match(/\[[\s\S]*\]/)
    if (!match) return []
    try {
      const arr = JSON.parse(match[0])
      return Array.isArray(arr)
        ? arr.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean)
        : []
    } catch {
      return []
    }
  }

  // 去重（保留顺序）
  private dedupe(list: string[]): string[] {
    return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)))
  }
}

export const keywordExpansionService = new KeywordExpansionService()
export default keywordExpansionService
