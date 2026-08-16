# 🚀 热点监控系统 - Agent Skills 套件

完整的可复用 AI Agent Skills，用于构建实时热点监控系统。

## 📚 Skills 清单

### 1. 🎯 [热点关键词监控](hotspot-keyword-monitor.md)
**用途**：设置和管理监控关键词，自动发现相关热点

```
关键功能：
✓ 添加/删除/管理监控词
✓ 支持多分类（技术、金融、娱乐等）
✓ 启用/禁用按需切换
✓ 自动后台扫描（每 15 分钟）

主要 API：
POST   /keywords          # 添加新关键词
GET    /keywords          # 查看所有监控词
PATCH  /keywords/{id}     # 更新关键词状态
DELETE /keywords/{id}     # 删除关键词
```

### 2. 🔥 [热点发现引擎](hotspot-detection-engine.md)
**用途**：实时发现热点事件，分析趋势，生成报告

```
关键功能：
✓ 实时热点发现（多源聚合）
✓ AI 真实性识别
✓ 按分类/来源筛选
✓ 趋势分析和评分

数据来源：
🌐 Web      - 新闻网站、搜索结果
🐦 Twitter  - 实时推文、热搜标签
📱 知乎     - 热点话题、高赞内容
💄 小红书   - 热搜、消费趋势

主要 API：
GET /hotspots                    # 获取实时热点
GET /hotspots/category/{cat}    # 按分类筛选
GET /hotspots/source/{source}   # 按来源筛选
```

### 3. 🔔 [实时通知告警](realtime-notification-alerts.md)
**用途**：设置多渠道通知，在热点匹配时立即告警

```
关键功能：
✓ 浏览器实时推送
✓ 邮件告警通知
✓ 通知去重和聚合
✓ 已读/未读管理

通知渠道：
📱 浏览器通知  - 即时弹窗提示
📧 邮件告警    - HTML 格式邮件
📲 移动推送    - 规划中...

主要 API：
GET    /notifications              # 查看所有通知
PATCH  /notifications/{id}/read    # 标记已读
DELETE /notifications/{id}         # 删除通知
```

---

## 🔄 完整工作流

```
┌─────────────────────────────────────────────────────────────┐
│ 用户添加关键词（技能1：热点关键词监控）                        │
│ 示例："AI编程"                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 系统后台定时扫描（每 15 分钟）                                  │
│ • 从 Web、Twitter、知乎、小红书 收集数据                        │
│ • 使用 DeepSeek AI 进行识别和评分                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 发现相关热点（技能2：热点发现引擎）                            │
│ • 热点1: "ChatGPT API 新功能发布" (评分: 8.5) 📈 +45%        │
│ • 热点2: "GitHub Copilot 月度报告" (评分: 7.2) 📉 -12%       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 生成通知告警（技能3：实时通知告警）                             │
│ • 🔔 浏览器推送：立即弹窗                                       │
│ • 📧 邮件通知：HTML 格式详细内容                                │
│ • 💾 通知中心：历史记录追踪                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 用户接收和管理通知                                              │
│ • 在通知中心查看
│ • 标记已读/未读
│ • 点击查看完整信息
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 集成示例

### 示例 1：内容创作者使用流程

```python
# 步骤 1: 添加监控关键词
POST /keywords
{
  "keyword": "短视频营销",
  "category": "entertainment"
}

# 步骤 2: 等待系统扫描（15分钟）

# 步骤 3: 获取最新热点
GET /hotspots/category/entertainment
# 返回最新的短视频营销相关热点

# 步骤 4: 查看通知
GET /notifications
# 返回所有新热点通知

# 步骤 5: 使用热点创作
# 内容创作者参考热点信息创作短视频
```

### 示例 2：技术工程师的实时监控

```bash
# 监控 AI 相关的最新技术
POST /keywords
{
  "keyword": "AI编程工具",
  "category": "tech"
}

# 获取技术热点排行
GET /hotspots/category/tech
# 响应包含：ChatGPT、编程框架、新算法等

# 追踪 Twitter 上的讨论
GET /hotspots/source/Twitter
# 实时获取技术社区的热议话题
```

### 示例 3：财经分析师的市场监测

```bash
# 监控加密货币市场
POST /keywords {"keyword": "BTC行情", "category": "finance"}
POST /keywords {"keyword": "新币种上线", "category": "finance"}
POST /keywords {"keyword": "市场调整", "category": "finance"}

# 获取金融热点
GET /hotspots/category/finance

# 接收邮件告警
# 系统自动发送市场变化通知到邮箱
```

---

## 🔧 配置要求

### 后端环境变量 (.env)

```env
# API 服务
PORT=3000

# DeepSeek AI (热点识别和评分)
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Twitter/X API (推文获取)
TWITTER_API_KEY=your_key_here

# 邮件通知 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@hotmonitor.local

# 定时任务间隔 (分钟)
HOTSPOT_FETCH_INTERVAL=15      # 热点扫描间隔
NOTIFICATION_CHECK_INTERVAL=5   # 通知检查间隔
```

### 前端配置

Web 应用自动配置，会通过环境变量中的 API 代理连接后端（Vite）。

---

## 📊 数据结构参考

### 关键词对象
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "keyword": "AI编程",
  "category": "tech",
  "createdAt": "2026-08-15T10:30:00Z",
  "lastUpdated": "2026-08-15T14:30:00Z",
  "isActive": true
}
```

### 热点对象
```json
{
  "id": "e1d4c5f2-3a9b-4d8e-9c2f-1e3a5b7d9f11",
  "title": "ChatGPT 推出新功能",
  "description": "OpenAI 宣布...",
  "source": "Twitter",
  "category": "tech",
  "score": 8.5,
  "trend": 45,
  "url": "https://...",
  "timestamp": "2026-08-15T14:30:00Z",
  "keywords": ["AI编程", "ChatGPT"]
}
```

### 通知对象
```json
{
  "id": "a1b2c3d4-e5f6-4a8b-9c2d-3e4f5a6b7c8d",
  "title": "ChatGPT 推出新功能",
  "message": "您监控的关键词 'AI编程' 发现新热点",
  "type": "warning",
  "keyword": "AI编程",
  "source": "Twitter",
  "timestamp": "2026-08-15T14:30:00Z",
  "read": false
}
```

---

## 🎯 使用案例

### 案例 1：新闻记者 📰
```
目标: 第一时间发现重大新闻
方法:
  • 监控热点关键词（政治、经济、科技等）
  • 配置浏览器通知（实时告警）
  • 配置邮件通知（完整详情）
收益: 永远走在信息最前线
```

### 案例 2：内容创作者 🎬
```
目标: 找到最新的创意灵感
方法:
  • 监控分类热点（短视频、营销、时尚等）
  • 查看热点趋势（什么话题增长最快）
  • 参考热点创作
收益: 内容永远紧跟潮流
```

### 案例 3：产品经理 📱
```
目标: 监测竞品动态
方法:
  • 添加竞品相关关键词
  • 追踪用户评价和讨论
  • 分析产品趋势
收益: 快速发现市场机会
```

### 案例 4：投资分析师 💼
```
目标: 实时把握市场动向
方法:
  • 监控行业热点
  • 追踪政策变化
  • 分析市场情绪
收益: 做出更优的投资决策
```

---

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd backend
npm install
npm run dev
# 服务启动在 http://localhost:3000
```

### 2. 启动前端应用
```bash
cd frontend
npm install
npm run dev
# 应用启动在 http://localhost:5173
```

### 3. 添加第一个监控词
```
访问: http://localhost:5173/keywords
操作: 点击"添加关键词"
输入: "AI编程"
分类: 技术
```

### 4. 观察热点发现
```
访问: http://localhost:5173/trending
等待: 15 分钟（系统首次扫描）
查看: 最新的热点列表
```

### 5. 接收通知
```
访问: http://localhost:5173/notifications
查看: 系统生成的告警通知
```

---

## 📖 详细文档

每个 Skill 都有独立的详细文档：

- **[热点关键词监控](hotspot-keyword-monitor.md)** - API、配置、最佳实践
- **[热点发现引擎](hotspot-detection-engine.md)** - 数据来源、算法、分析
- **[实时通知告警](realtime-notification-alerts.md)** - 通知配置、渠道、规则

---

## 🔌 API 完整端点

### 仪表盘 API
```
GET /health                     # 健康检查
GET /dashboard/stats            # 获取统计数据
```

### 关键词管理 API
```
GET    /keywords                # 获取所有关键词
POST   /keywords                # 添加新关键词
PATCH  /keywords/{id}           # 更新关键词（如启用/禁用）
DELETE /keywords/{id}           # 删除关键词
```

### 热点查询 API
```
GET /hotspots                           # 获取所有热点
GET /hotspots/category/{category}      # 按分类筛选
GET /hotspots/source/{source}          # 按来源筛选
```

### 通知管理 API
```
GET    /notifications                   # 获取通知列表
PATCH  /notifications/{id}/read         # 标记为已读
DELETE /notifications/{id}              # 删除通知
```

---

## ⚙️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (React)                       │
│  • 关键词管理界面                                        │
│  • 热点浏览界面                                          │
│  • 通知中心                                              │
│  • 数据可视化 (Recharts)                                 │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP REST API
┌────────────────▼────────────────────────────────────────┐
│                      后端层 (Express)                     │
│  • API 路由层                                            │
│  • 业务逻辑层                                            │
│  • 数据存储层 (JSON)                                     │
│  • 定时任务调度                                          │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
┌───▼──┐  ┌──────▼────┐  ┌────▼──┐  ┌──────▼────┐
│ AI   │  │  爬虫模块  │  │邮件   │  │ 数据存储  │
│识别  │  │           │  │服务   │  │(JSON)     │
│引擎  │  │ Web爬虫   │  │       │  │           │
│      │  │ 知乎爬虫  │  │SMTP   │  │ keywords  │
│Deep- │  │ RSS聚合   │  │       │  │ hotspots  │
│Seek  │  │Twitter API│  │邮件   │  │notifict.. │
│      │  │           │  │模板   │  │           │
└──────┘  └───────────┘  └───────┘  └──────────┘
```

---

## 🔐 安全建议

1. **API Key 管理**
   - 不要在代码中提交 API Key
   - 使用 .env 文件管理敏感信息
   - 定期轮换密钥

2. **邮件配置**
   - 使用应用专用密码（Gmail）
   - 不要用真实邮箱密码
   - 配置 IP 白名单

3. **爬虫礼仪**
   - 遵守网站 robots.txt
   - 不过度频繁请求
   - 合理设置 User-Agent

---

## 📈 性能指标

| 指标 | 值 |
|-----|-----|
| 热点扫描间隔 | 15 分钟 |
| 通知检查间隔 | 5 分钟 |
| 数据保留量 | 最近 1000 条热点 |
| 平均响应时间 | < 200ms |
| 浏览器通知延迟 | < 1 秒 |

---

## 🐛 故障排查

### 没有收到通知？
1. 检查是否添加了关键词
2. 检查浏览器通知权限
3. 等待系统扫描（最多 15 分钟）
4. 查看后端日志

### 邮件没有发送？
1. 检查 SMTP 配置
2. 验证 API Key 是否正确
3. 检查网络连接
4. 测试邮件功能

### 热点数据不更新？
1. 确保后端服务正常运行
2. 检查任务调度器日志
3. 验证 API Key 是否有效

---

## 📝 更新日志

### v0.1.0 (2026-08-15)
- ✅ 核心功能实现
- ✅ 三个主要 Skills 发布
- ✅ 基础 UI/UX 优化
- ✅ 可访问性改进

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Made with ❤️ for real-time hotspot monitoring and AI-powered discovery**
