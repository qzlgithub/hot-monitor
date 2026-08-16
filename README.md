# 🔥 热点监控系统 - Hot Monitor

一个轻量级的实时热点监控工具，集成 AI 识别、多源数据爬虫、和智能通知系统。

## ✨ 核心功能

- **关键词监控**: 用户输入关键词，系统自动监控相关热点变化
- **多源数据获取**: 
  - 网页爬虫（新闻网站、社交平台）
  - Twitter/X API 集成
  - RSS 源聚合
  - 知乎、小红书等热点爬取
- **AI 识别引擎**: 使用 DeepSeek API 识别真实热点，过滤虚假内容
- **智能通知**: 
  - 浏览器 Web Notifications
  - 邮件告警
  - 实时通知中心
- **响应式设计**: 完全兼容各类设备的独特 UI 界面

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
npm install
```

### 配置

创建后端配置文件 `backend/.env`：

```env
PORT=3000
NODE_ENV=development

# DeepSeek API (从 https://platform.deepseek.com 获取)
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Twitter/X API (从 https://twitterapi.io 获取)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_URL=https://api.twitter.com/2

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# 定时任务间隔 (分钟)
HOTSPOT_FETCH_INTERVAL=15
NOTIFICATION_CHECK_INTERVAL=5
```

### 开发模式

```bash
# 终端1: 启动后端服务
cd backend
npm run dev

# 终端2: 启动前端开发服务器
cd frontend
npm run dev
```

访问 `http://localhost:5173` 打开应用。

### 生产构建

```bash
# 前端
cd frontend
npm run build

# 后端
cd backend
npm run build
npm start
```

## 📁 项目结构

```
qzl_hot_MONTIOR/
├── frontend/                  # React Web 应用
│   ├── src/
│   │   ├── components/       # UI 组件
│   │   ├── pages/            # 页面
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── styles/           # 样式文件
│   │   └── utils/            # 工具函数
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                   # Node.js API 服务
│   ├── src/
│   │   ├── api/              # API 路由
│   │   ├── services/         # 业务逻辑
│   │   │   ├── dataStore.ts         # 数据存储
│   │   │   ├── deepseekService.ts   # AI 服务
│   │   │   ├── webScraperService.ts # 爬虫
│   │   │   ├── twitterService.ts    # Twitter API
│   │   │   └── notificationService.ts # 通知
│   │   ├── tasks/            # 定时任务
│   │   ├── config/           # 配置文件
│   │   └── server.ts         # 服务器入口
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── skills/                    # Agent Skills (待开发)
└── README.md
```

## 🔌 API 文档

### 仪表盘
- `GET /dashboard/stats` - 获取统计数据

### 关键词管理
- `GET /keywords` - 获取所有关键词
- `POST /keywords` - 添加关键词
- `PATCH /keywords/:id` - 更新关键词
- `DELETE /keywords/:id` - 删除关键词

### 热点数据
- `GET /hotspots` - 获取所有热点
- `GET /hotspots/category/:category` - 按分类获取
- `GET /hotspots/source/:source` - 按来源获取

### 通知
- `GET /notifications` - 获取通知列表
- `PATCH /notifications/:id/read` - 标记为已读
- `DELETE /notifications/:id` - 删除通知

## 🎨 UI 特色

- 🌙 深色主题 + 流光渐变效果
- 📊 实时数据可视化
- 🎯 卡片式热点展示
- 📱 完全响应式设计
- ⚡ 流畅的动画交互
- 🔔 实时通知中心

## 🔧 技术栈

### 前端
- React 18
- TypeScript
- Tailwind CSS
- Recharts (数据可视化)
- Zustand (状态管理)
- Sonner (Toast 提示)
- Vite (构建工具)

### 后端
- Node.js + Express
- TypeScript
- Axios (HTTP 客户端)
- Node-cron (定时任务)
- Nodemailer (邮件服务)
- Cheerio (HTML 解析)
- UUID (ID 生成)

### 第三方 API
- DeepSeek API (AI 识别)
- Twitter API v2 (推文数据)
- 新闻/社交平台爬虫

## 📋 开发路线图

- [x] 项目初始化
- [x] 前端框架搭建
- [x] 后端 API 开发
- [ ] 多源爬虫完善
- [ ] AI 识别引擎优化
- [ ] 邮件通知集成
- [ ] Web Notifications 实现
- [ ] 前端 UI 增强
- [ ] 性能优化
- [ ] Agent Skills 封装

## 📝 开发笔记

### 数据流

```
1. 用户添加关键词
   ↓
2. 定时任务触发 (每15分钟)
   ↓
3. 从多个源爬取数据
   - Web 搜索
   - Twitter API
   - 知乎 API
   - 小红书 API
   ↓
4. AI 识别与评分 (DeepSeek)
   ↓
5. 保存到本地 JSON 存储
   ↓
6. 生成通知
   ↓
7. 前端实时展示
```

### 注意事项

- 爬虫请遵守网站 robots.txt 和服务条款
- API 请求有频率限制，生产环境需要加入缓存机制
- 邮件通知需要配置应用专用密码（Gmail 需要开启两步验证）
- 数据存储使用 JSON 文件，生产环境建议升级为数据库

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 📞 支持

如有问题或建议，请提交 Issue。

---

Made with ❤️ for real-time hotspot monitoring
