import axios from 'axios'
import config from '../config/index.js'

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class DeepSeekService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = config.deepseek.apiKey
    this.apiUrl = config.deepseek.apiUrl
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey
  }

  async chat(messages: DeepSeekMessage[], temperature = 0.7): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured')
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages,
          temperature,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('DeepSeek API error:', error.message)
      throw new Error(`Failed to call DeepSeek API: ${error.message}`)
    }
  }

  // 识别热点真实性和相关性
  async analyzeHotspot(title: string, description: string, keywords: string[]): Promise<{
    isRealTrend: boolean
    relevanceScore: number
    category: string
    reasoning: string
    keywordMentioned: boolean
    relevanceType: 'direct' | 'indirect'
  }> {
    const prompt = `
你是一个专业的热点分析师。请分析以下内容是否与给定关键词相关、是否是真实热点，并说明关联关系。

标题: ${title}
描述: ${description}
关键词: ${keywords.join(', ')}

请用JSON格式回复，包含以下字段:
- isRealTrend (boolean): 是否是真实的热点
- relevanceScore (0-10): 与关键词的相关性得分，越高越相关
- category (string): 内容分类
- reasoning (string): 说明关联关系——明确指出内容中的哪些词/主题与关键词相关，以及为什么给这个分数（1-2句话）
- keywordMentioned (boolean): 内容（标题或描述）是否直接提到了关键词或其明显近义/变体。true=直接提及，false=没有直接提及
- relevanceType (string): 只能是 "direct" 或 "indirect"。direct=直接相关（标题/描述直接提到关键词，如"梦幻西游新区"之于"梦幻西游"）；indirect=间接相关（主题与关键词相关但未直接提及，如"游戏职业选择"之于"梦幻西游"）

仅回复JSON，不要有其他内容。
`

    try {
      const result = await this.chat([{ role: 'user', content: prompt }], 0.3)
      const parsed = this.parseJsonResult(result)
      return {
        isRealTrend: parsed.isRealTrend ?? true,
        relevanceScore: parsed.relevanceScore ?? 5,
        category: parsed.category ?? 'unknown',
        reasoning: parsed.reasoning ?? '',
        keywordMentioned: parsed.keywordMentioned ?? true,
        relevanceType: parsed.relevanceType === 'indirect' ? 'indirect' : 'direct',
      }
    } catch (error) {
      console.error('Failed to analyze hotspot:', error)
      return {
        isRealTrend: true,
        relevanceScore: 5,
        category: 'unknown',
        reasoning: '分析失败，使用默认值',
        keywordMentioned: true,
        relevanceType: 'direct',
      }
    }
  }

  // 从模型输出中提取 JSON 对象（容忍 ```json 代码块包裹 / 前后杂质），解析失败返回空对象
  private parseJsonResult(raw: string): any {
    const trimmed = (raw || '').trim()
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) return {}
    try {
      return JSON.parse(match[0])
    } catch {
      return {}
    }
  }

  // 生成热点总结
  async summarizeHotspot(content: string, maxLength = 200): Promise<string> {
    const prompt = `请用中文为以下内容生成一个不超过${maxLength}字的简明总结:\n\n${content}`

    try {
      return await this.chat([{ role: 'user', content: prompt }], 0.5)
    } catch (error) {
      console.error('Failed to summarize:', error)
      return content.substring(0, maxLength)
    }
  }
}

export const deepSeekService = new DeepSeekService()
