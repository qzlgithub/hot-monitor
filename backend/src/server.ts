import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import { taskScheduler } from './tasks/taskScheduler.js'
import dashboardRoutes from './api/dashboardRoutes.js'
import keywordRoutes from './api/keywordRoutes.js'
import hotspotRoutes from './api/hotspotRoutes.js'
import notificationRoutes from './api/notificationRoutes.js'

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 任务控制 API
// 获取任务运行状态
app.get('/tasks/status', (req, res) => {
  res.json(taskScheduler.getStatus())
})

// 立即手动检查（触发热点收集 + 通知检查，后台异步执行）
app.post('/tasks/check', (req, res) => {
  try {
    const result = taskScheduler.runManualCheck()
    res.status(202).json(result)
  } catch (error: any) {
    console.error('Error running manual check:', error)
    res.status(500).json({ error: error.message || 'Manual check failed' })
  }
})

// API 路由
app.use('/dashboard', dashboardRoutes)
app.use('/keywords', keywordRoutes)
app.use('/hotspots', hotspotRoutes)
app.use('/notifications', notificationRoutes)

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

// 启动服务器
const port = config.port
app.listen(port, () => {
  console.log(`\n🚀 Hot Monitor Backend Server`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Server running on http://localhost:${port}`)
  console.log(`Environment: ${config.nodeEnv}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // 启动任务调度器
  taskScheduler.startTasks()
})

export default app
