import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // AI 检测门槛：相关性得分低于该值的候选不进入热点（默认 7，宁缺毋滥）
  ai: {
    minScore: parseInt(process.env.AI_MIN_SCORE || '7', 10),
  },

  // 关键词扩展（DeepSeek 生成搜索变体，提高召回率）
  keywordExpansion: {
    enabled: process.env.KEYWORD_EXPANSION_ENABLED !== 'false',
    variantCount: parseInt(process.env.KEYWORD_EXPANSION_COUNT || '5', 10),
  },
  
  // DeepSeek API
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  },

  // Twitter/X API（通过 twitterapi.io 第三方接口，仅需 X-API-Key，无需官方审核）
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiUrl: process.env.TWITTER_API_URL || 'https://api.twitterapi.io',
  },

  // 数据源配置中心（在 .env 中控制启用/停用 + 填写真实 key）
  // 只需把对应 ENABLED 改为 true 并填好 key/cookie，即可启用该数据源
  sources: {
    baidu: { enabled: process.env.BAIDU_ENABLED === 'true' },
    bilibili: {
      enabled: process.env.BILIBILI_ENABLED !== 'false',
      minPlay: parseInt(process.env.BILIBILI_MIN_PLAY || '50000', 10),
    },
    google: { enabled: process.env.GOOGLE_ENABLED === 'true', apiKey: process.env.GOOGLE_API_KEY || '' },
    zhihu: { enabled: process.env.ZHIHU_ENABLED === 'true', cookie: process.env.ZHIHU_COOKIE || '' },
    twitter: { enabled: process.env.TWITTER_ENABLED === 'true', apiKey: process.env.TWITTER_API_KEY || '' },
  },

  // 藏宝阁（梦幻西游）监控 —— 无头浏览器抓取，需登录态
  cbg: {
    enabled: process.env.CBG_ENABLED === 'true',
    // 服务器范围：3y=3年以上服 / 1to3y=1到3年服 / 1y=1年内服 / ''=全部
    serverAge: process.env.CBG_SERVER_AGE || '3y',
    // 普通规则采集间隔（分钟）
    interval: parseInt(process.env.CBG_INTERVAL || '30', 10),
    // 高频（priority=fast）规则采集间隔（分钟），用于抢低价/捡漏
    fastInterval: parseInt(process.env.CBG_FAST_INTERVAL || '15', 10),
    // 单类搜索最多翻几页
    maxPages: parseInt(process.env.CBG_MAX_PAGES || '2', 10),
  },

  // 无头浏览器（Playwright）
  browser: {
    // 持久会话目录（存登录态，扫码登录后复用）
    userDataDir: process.env.PLAYWRIGHT_USER_DATA_DIR || path.resolve(__dirname, '../data/browser-profile'),
    // 抓取是否无头（登录场景会强制有头）
    headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
  },

  // Data Storage
  dataDir: process.env.DATA_DIR || path.resolve(__dirname, '../data'),

  // Tasks
  tasks: {
    hotspotFetchInterval: parseInt(process.env.HOTSPOT_FETCH_INTERVAL || '30', 10),
  },
}

export default config
