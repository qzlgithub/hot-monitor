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
  
  // DeepSeek API
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  },

  // Twitter API
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiUrl: process.env.TWITTER_API_URL || 'https://api.twitter.com/2',
  },

  // 数据源配置中心（在 .env 中控制启用/停用 + 填写真实 key）
  // 只需把对应 ENABLED 改为 true 并填好 key/cookie，即可启用该数据源
  sources: {
    baidu: { enabled: process.env.BAIDU_ENABLED !== 'false' },
    google: { enabled: process.env.GOOGLE_ENABLED === 'true', apiKey: process.env.GOOGLE_API_KEY || '' },
    zhihu: { enabled: process.env.ZHIHU_ENABLED === 'true', cookie: process.env.ZHIHU_COOKIE || '' },
    twitter: { enabled: process.env.TWITTER_ENABLED === 'true', apiKey: process.env.TWITTER_API_KEY || '' },
  },

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@hotmonitor.local',
  },

  // Data Storage
  dataDir: process.env.DATA_DIR || path.resolve(__dirname, '../data'),

  // Tasks
  tasks: {
    hotspotFetchInterval: parseInt(process.env.HOTSPOT_FETCH_INTERVAL || '30', 10),
    notificationCheckInterval: parseInt(process.env.NOTIFICATION_CHECK_INTERVAL || '5', 10),
  },
}

export default config
