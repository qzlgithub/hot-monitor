# 🔥 热点监控系统 - Hot Monitor

一个轻量级的实时热点监控工具：关键词监控 → 数据源搜索 → DeepSeek AI 识别过滤 → 热点雷达展示。

## ✨ 核心功能

- **关键词监控**: 添加关键词，系统自动从多个搜索变体收集相关热点
- **关键词扩展**: 用 DeepSeek 自动生成搜索变体（如「鱼皮的AI导航」→「程序员鱼皮的AI导航」「AI导航鱼皮」等），提高召回率
- **AI 识别引擎**: DeepSeek 判断热点相关性、是否直接提及关键词、直接/间接相关，并输出关联理由
- **热点雷达**: 统计概览（总热数/今日新增/紧急热点/监控词）、按关键词分组 Tab、综合热度/最新/相关性排序、默认展示 10 条可展开
- **关键词开关**: 滑动开关一键启用/停用监控关键词，停用关键词的热点自动隐藏
- **藏宝阁监控**: 梦幻西游藏宝阁珍品/召唤兽价格监控（Playwright 登录 + 底层 API 直连抓取），价格历史/涨跌徽章、搜索规则可配置（3 年以上服）
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

# 数据源开关
BILIBILI_ENABLED=true
BILIBILI_MIN_PLAY=10000        # B站播放量门槛
BAIDU_ENABLED=false

# AI 相关性门槛
AI_MIN_SCORE=6

# 关键词扩展（DeepSeek 生成搜索变体提高召回）
KEYWORD_EXPANSION_ENABLED=true
KEYWORD_EXPANSION_COUNT=5

# 定时收集间隔 (分钟)
HOTSPOT_FETCH_INTERVAL=30

# 梦幻西游藏宝阁（需登录：cd backend && npx tsx scripts/cbgLogin.ts 扫码登录导出 cookie）
CBG_ENABLED=true
CBG_SERVER_AGE=3y          # 3年以上服
CBG_INTERVAL=30
CBG_MAX_PAGES=2
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
│   │   │   ├── dataStore.ts            # 数据存储（关键词/热点）
│   │   │   ├── deepseekService.ts      # AI 分析服务
│   │   │   ├── keywordExpansionService.ts # 关键词扩展
│   │   │   └── sources/                # 数据源适配器（bilibili 等）
│   │   ├── tasks/            # 定时任务（热点收集）
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

### 藏宝阁
- `GET /cbg/stats` - 藏宝阁统计
- `GET /cbg/items` - 商品列表（?type=equip|pet|role&limit=）
- `GET /cbg/items/:id` - 商品详情（含价格历史）
- `GET /cbg/search-rules` / `POST /cbg/search-rules` - 搜索规则列表 / 新增
- `PUT /cbg/search-rules/:id` / `DELETE /cbg/search-rules/:id` - 更新 / 删除规则
- `POST /cbg/check` - 立即采集
- `GET /cbg/status` - 采集状态 / 登录态

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
