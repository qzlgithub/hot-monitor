import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
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
