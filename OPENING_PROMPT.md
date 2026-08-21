# 🔥 开启新会话提示词（Hot Monitor 热点监控系统）

> 把下面整个「提示词」区块复制到新会话的第一条消息里，即可让 AI 快速了解项目全貌并接手工作。

---

## 📋 提示词（复制以下内容到新会话）

```
继续「热点监控系统」项目（d:\AI\qzl_hot_MONTIOR）。

开工前请先：
1. 读取仓库级记忆文件 /memories/repo/hot_monitor_project.md（项目状态/架构/踩坑/待办），
   以及 /memories/workflow_preferences.md（我的工作偏好）
2. 若记忆系统异常/换环境，参考项目内「开发记忆/」文件夹（记忆的双保险备份，含工作偏好+项目记忆）
3. 向我汇报当前项目状态和待办项

【技术栈】React18 + TS + Tailwind（前端，Vite 5173）/ Node + Express + TS ESM（后端，tsx watch，端口 3000）
【当前架构】
  · 热点雷达：关键词 → 多变体搜索（B站+关键词扩展）→ DeepSeek AI 分析（相关性/直接间接/keywordMentioned/理由）→ 统计卡片+关键词Tab+排序+限10条可展开
  · 藏宝阁（商人工具）：Playwright 登录(cookie) + recommend.py API 直连 → 搜索规则(条件筛选+最低价前N) → 捡漏雷达(市场价基线/乖离率/捡漏徽章) → 价格走势图(Recharts) → 展示最有代表性3件
【数据源】
  · fetcher 三层（ApiFetcher/HtmlFetcher/BrowserFetcher）+ adapter 架构；B站启用（HTTP API）
  · 藏宝阁：仅装备通道（召唤兽/角色已停用，后端能力保留随时可开）；3年以上服
  · 百度/知乎/Twitter adapter 已注册默认关闭（需 cookie/key）
【当前待办（重要）】
  P1 前端趋势图接真实历史数据
  P2 知乎/微博等源（需 cookie）；部署（Docker/CI）
  P3（暂缓）测试/评估系统（Vitest 方案已调研）
  藏宝阁后续：走势数据积累后做周期提示（自动标注低位/高位）；装备数据稳定后按同样方式开召唤兽/角色通道；历史成交=收费服务（付费后可接，免费靠自建 priceHistory 积累）
【工作偏好（必须遵守）】
  - 新增/调整数据源或较复杂功能：必须先给完整方案（现状调研/候选/权衡/推荐），等我确认后才写代码
  - 有任何不确定先提问确认（vscode_askQuestions）
  - Git 默认由我自己执行，你只给分步指引（status → add → commit → push）；除非我明确说「帮我执行」
  - 前端页面改动必须用 ui-ux-pro-max 技能 + Aceternity UI 组件库（用 Context7 获取用法）
【启动】后端 npm --prefix d:\AI\qzl_hot_MONTIOR\backend run dev；前端 npm --prefix d:\AI\qzl_hot_MONTIOR\frontend run dev
【注意事项】
  - 后端 API 路由无 /api 前缀（如 http://localhost:3000/hotspots、/cbg/*），/api/* 只在 vite 代理层有效
  - 改 .env 后需手动重启后端（tsx watch 不监听 .env）
  - 触发收集：POST /api/tasks/check（热点）；POST /api/cbg/check（藏宝阁）
  - 藏宝阁 cookie 失效时：cd backend && npx tsx scripts/cbgLogin.ts 重新扫码
  - 多变体搜索耗时长（5 变体 × 每变体搜索 + AI 分析）
```

---

## 🔧 常用命令速查

```powershell
# 启动后端（3000）
npm --prefix d:\AI\qzl_hot_MONTIOR\backend run dev
# 启动前端（5173）
npm --prefix d:\AI\qzl_hot_MONTIOR\frontend run dev

# 类型检查（前后端）
node d:\AI\qzl_hot_MONTIOR\backend\node_modules\typescript\bin\tsc -p d:\AI\qzl_hot_MONTIOR\backend\tsconfig.json --noEmit
node d:\AI\qzl_hot_MONTIOR\frontend\node_modules\typescript\bin\tsc -p d:\AI\qzl_hot_MONTIOR\frontend\tsconfig.json --noEmit

# 触发热点收集
Invoke-RestMethod -Method Post 'http://localhost:3000/tasks/check'
# 触发藏宝阁采集
Invoke-RestMethod -Method Post 'http://localhost:3000/cbg/check'
# 藏宝阁重新登录（cookie 失效时）
cd d:\AI\qzl_hot_MONTIOR\backend; npx tsx scripts/cbgLogin.ts
# 修复 cbgSearchRules.json 中文乱码（勿用 GBK 编码保存该文件）
cd d:\AI\qzl_hot_MONTIOR\backend; npx tsx scripts/fixCbgRules.ts

# 端口占用清理（EADDRINUSE）
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```
