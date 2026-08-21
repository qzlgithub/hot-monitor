# 热点监控系统 - 项目记忆

## 📌 当前状态速览（2026-08-21 · 会话交接用）
- **服务已停止**（2026-08-21 收尾，端口 3000/5173 已释放）。启动：后端 `npm --prefix d:\AI\qzl_hot_MONTIOR\backend run dev`（3000），前端 `npm --prefix d:\AI\qzl_hot_MONTIOR\frontend run dev`（5173）
- **Git**：本轮藏宝阁工作已**提交本地 master = f4acf98**（32文件 +2609行，含 fetcher分层/藏宝阁/捡漏雷达/走势图/装备通道），**未推送**（origin/master 仍 3c308c6）；如需推送由用户执行 `git push`；工作区仅剩未跟踪 OPENING_PROMPT.md
- **数据源**：B站 + **藏宝阁装备通道**（召唤兽/角色已停用，后端能力保留）；登录态 cookie 已保存（backend/src/data/cbg-cookies.json）
- **待办**：① 前端趋势图接真实历史数据 ② 知乎/微博源 ③ 部署 ④ 藏宝阁：等走势数据积累后做周期提示、装备数据稳定后开召唤兽/角色通道

## 项目基础信息
- **路径**：d:\AI\qzl_hot_MONTIOR ｜ **技术栈**：React18+TS+Tailwind（前端）/ Node+Express+TS（后端）
- **核心需求**：关键词监控 → 多源发现热点 → DeepSeek AI 识别/过滤 → 热点雷达展示（通知功能已于 2026-08-19 删除）

## 关键配置（backend/.env）
- `DEEPSEEK_API_KEY`（sk-34cd...，实测可用）、`DEEPSEEK_API_URL=https://api.deepseek.com/v1`
- `BILIBILI_ENABLED=true`、`BILIBILI_MIN_PLAY=10000`（2026-08-19 从 50000 放宽到 10000）、`BAIDU_ENABLED=false`
- `AI_MIN_SCORE=6`（2026-08-19 从 7 放宽到 6）
- `KEYWORD_EXPANSION_ENABLED=true`、`KEYWORD_EXPANSION_COUNT=5`（关键词扩展：DeepSeek 生成搜索变体提高召回）
- ⚠️ 改 .env 后需手动重启后端（tsx watch 不监听 .env）；B站搜索只取单页 20 条候选不翻页（候选池小，可优化）
- 定时：热点收集 30 分钟（可调）

## 数据源架构（重点）
- `backend/src/services/sources/`：SourceAdapter 接口 + 注册表（getEnabledSources）
- **加源方式**：① 实现 SourceAdapter（isEnabled+search）② 在 sources/index.ts 注册 ③ .env 开开关，调度器零改动
- 已注册：bilibili（search）、baidu/zhihu/twitter（默认关闭）
- 调度器：关键词热点走各源 search + DeepSeek 检测（热门发现已删）
- 过滤：B站 = 播放量≥BILIBILI_MIN_PLAY + AI 相关性≥AI_MIN_SCORE（内容平台不要求 isRealTrend）；新闻类源要求 isRealTrend

## fetcher 层（2026-08-20 新增）
- `backend/src/services/fetchers/`：ApiFetcher（axios JSON）/ HtmlFetcher（axios+cheerio）/ BrowserFetcher（Playwright）
- 存量源已渐进迁移：bilibiliService→apiFetcher、webScraperService（百度/知乎/小红书）→htmlFetcher/apiFetcher
- BrowserFetcher：单例 launchPersistentContext（userDataDir）+ 串行任务 + scrape(url, extract) 通用方法 + cookies 注入（scrape 传 opts.cookies）；登录用 openInteractive（强制有头）

## 梦幻西游藏宝阁（2026-08-20 上线，重点）
- **架构**：登录用 BrowserFetcher（Playwright，cbgLogin.ts 扫码 → 导出 cookie 到 `backend/src/data/cbg-cookies.json`）；**抓取走 HTTP API 直连**（`recommend.py` JSONP，带 cookie+referer+UA），无需每次起浏览器
- **搜索 API**：`GET https://xyq.cbg.163.com/cgi-bin/recommend.py?act=recommd_by_role&page=N&server_type=3&count=15&search_type=overall_search_equip|overall_search_pet&view_loc=overall_search&callback=cb` → JSONP 剥壳后 `equip_list[]`
- **字段**：eid/equip_name/level_desc/price(分)/price_desc/area_name/server_name/serverid/equip_status_desc/pass_fair_show/selling_time/expire_time/seller_nickname/desc_sumup 等；价格单位是「分」需 /100
- **核心文件**：`services/cbgService.ts`（搜索+JSONP解析+属性参数映射）、`cbgDataStore.ts`（CbgItem+priceHistory 存储 cbgItems.json；CbgSearchRule 存储 cbgSearchRules.json）、`cbgMonitorService.ts`（按规则采集，防重入）、`api/cbgRoutes.ts`（/cbg/stats|items|items/:id|search-rules CRUD|check|status）、调度 30 分钟
- **规则模型（2026-08-20 重构）**：每条搜索规则 = `{ name, type, enabled, topN(最低价前N默认10), conditions(筛选条件) }`；采集=翻页收集→按 price 升序→取最低价前 topN 入库；商品 `ruleNames[]` 关联多规则；前端按规则 Tab 查看 + 配置对话框（基础筛选：等级/价格/出售状态；**装备类型 kindid**（27种：扇10剑6刀14斧5锤15枪4双环13双剑7鞭12爪刺9魔棒11飘带8宝珠52弓53法杖54男衣18女衣59男头17女头58腰带20鞋子19饰品21灯笼72巨剑73伞74双斧83棍91）；装备属性：初伤不含命中 init_damage_raw/总伤 all_damage/伤害 damage/初防 init_defense；属性计算 sum_attr_type=power力量|physique体质|magic魔力|endurance耐力|dex敏捷 + sum_attr_value）——所有参数已实测生效
- **前端**：`pages/Cbg.tsx`（路由 /cbg，侧边栏「藏宝阁」Gem 图标）；统计卡片+类型Tab+按规则Tab+商品卡片（按价格升序）+「添加搜索规则」对话框（分类型显示字段）+规则管理（开关/条件摘要/删除）
- **配置**（.env）：CBG_ENABLED=true、CBG_SERVER_AGE=3y（3年以上服）、CBG_INTERVAL=30、CBG_MAX_PAGES=2
- **登录态刷新**：cookie 失效时 cbgService 抛 CBG_AUTH_EXPIRED → 重跑 `cd backend && npx tsx scripts/cbgLogin.ts`
- **捡漏雷达（2026-08-20，商人工具）**：每条规则采集后统计在售同类商品价格基线（中位数/均值/样本数）存 `cbgPriceStats.json`；商品乖离率=(价-中位数)/中位数，低于 -5% 标「捡漏·低x%」红色徽章；前端默认捡漏优先排序（乖离率升序）；规则 `priority`=fast（15分钟高频，config `CBG_FAST_INTERVAL`）/normal（30分钟），taskScheduler 双 cron；API `GET /cbg/price-stats`
- **价格走势图（2026-08-21）**：每次采集追加走势点（中位/均价/样本）存 `cbgTrendHistory.json`（上限2000点）；API `GET /cbg/trend?rule=`；前端 Recharts 折线（橙色中位数+灰色均价，X=时间）；商品列表只展示**最有代表性 3 件**（捡漏优先 slice(0,3)）
- **通道策略（2026-08-21）**：先**只开放装备**通道（用户决定专注装备数据可靠性）——pet 规则已停用（enabled=false，历史数据保留可重开），前端类型 Tab 只显示「全部/装备」、对话框类型下拉将召唤兽/角色设为 disabled「后续开启」；后端 pet/role 能力保留
- **历史成交逆向（2026-08-21 结论）**：**收费服务**！真实接口在移动版 `xyq-m.cbg.163.com`：先 `get_user_service_data`（检查用户付费服务）→ 成交查询页 `history/query`；需独立 H5 登录 token（h5_login_token）；免费逆向不可行，靠自建 priceHistory 积累；若用户付费开通可再接
- **踩坑**：① cbgSearchRules.json 曾被 GBK 编码写坏中文乱码 → 用 `scripts/fixCbgRules.ts` 以 UTF-8 重写；② PowerShell `Invoke-RestMethod` 发中文 JSON 会乱码，测试接口用 node/fetch（UTF-8）
- **踩坑**：① 藏宝阁「全服搜索」是导航 tab 不是按钮，真按钮是 `#btn_equip_search`/`#btn_pet_search`；② 首页不显示登录态，登录检测看「切换角色」；③ Playwright profile 持久化不可靠（重启丢失），必须导出 cookie 到 JSON 注入；④ server_type=3=3年以上服（对应表单「开服时间」）

## B 站接口要点
- 热门列表 `GET /x/web-interface/popular`（可用）、关键词搜索 `GET /x/web-interface/search/all/v2`（可用，取 result_type==='video' 块）
- ⚠️ `ranking/v2` 排行榜被风控（-352）不可用；百度贴吧 PC 403 / 移动版诱导 App 不可用
- 坑：标题含 `<em class="keyword">` 需清理；pic 以 `//` 开头需补 https:；pubdate 是 unix 秒需 *1000；URL 统一 `https://www.bilibili.com/video/{bvid}`
- B 站"新能源"相关 ≥5万 播放的视频很少（约 1 条），关键词内容少是客观情况

## 前端要点
- Trending 页：Tab「关键词热点/热门发现」；来源标签（B站粉色）；趋势显示播放量（formatCount）；整卡可点跳转 + 复制链接
- 主题：浅色高级灰 + 琥珀橙；Aceternity MovingBorder/Spotlight 组件
- helpers.ts：getSourceMeta/formatCount/isViewCountSource/formatRelativeTime

## 踩坑记录
1. Windows 下 `tsx watch` 改代码重启报 EADDRINUSE(3000)：清端口（Get-NetTCPConnection -LocalPort 3000 → Stop-Process）再重启
2. DeepSeek key 未加载：dotenv path 需指向 backend/.env（../../.env）
3. 通知重复：按 hotspotId 去重（Notification 有 hotspotId 字段）
4. 前端 tsc 曾不过：tsconfig moduleResolution 需 NodeNext；@types/fs-extra、@types/uuid、@types/node-cron 需补装

## API 端点
- /health、/keywords CRUD（+ POST /:id/expand 关键词扩展）、/hotspots（+category/source/since/sort/limit/page 筛选）、/tasks/status、POST /tasks/check
- ⚠️「热门发现」已于 2026-08-19 彻底删除（前端 Tab + 后端收集/API/存储 + trending.json + adapter fetchTrending + getPopularVideos）

## Git
- 远程：https://github.com/qzlgithub/hot-monitor.git（origin, master）
- 用户自操作 Git；提交规范 `git add . → git commit -m "类型: 描述" → git push`
- .env 已 gitignore，不含泄露风险

## 待办 / 下一步（优先级）
- P1：前端趋势图接真实历史数据（藏宝阁已预留 priceHistory，B站热点需补历史快照存储）
- P2：知乎/微博等源（浏览器类，知乎热榜可用 BrowserFetcher 或现有 zhihu API adapter；需 cookie）
- P2：部署（Docker/CI）
- P3（暂缓）：测试/评估系统 —— 用户 2026-08-19 曾提议（Vitest 单测+冒烟+AI评估），后决定先不做；当前项目**无任何测试框架/测试文件**，如需搭建方案已调研好（Vitest + supertest + RTL/jsdom + smoke-test + evaluate-ai 脚本）

## 2026-08-19 完成：「信息筛选和排序」模块
- **去重 upsert**：`dataStore.addHotspot` 按 url 去重（同视频更新 score/trend/lastSeenAt，id 稳定）；Hotspot 新增 `firstSeenAt`/`lastSeenAt` 可选字段；返回 `{hotspot,isNew}`
- **清理历史重复**：`dataStore.dedupeHotspots()` 按 url 分组保留最优质一条（lastSeenAt→score→trend）；服务启动时 + 每次 collectHotspots 完成后调用（⚠️ upsert 只防新增重复，历史遗留重复必须靠 dedupeHotspots 清理）
- **排序（纯语义）**：`utils/hotspotRanking.ts` → hot=播放量降序（综合热度）、latest=发布时间 timestamp 降序、score=AI分降序；API 的 hotScore 字段=log10 播放量归一（0-10）。⚠️ 进入热点页的数据已过筛选（播放量+AI分），故排序不混权重，纯按字段
- **API 扩展**：`GET /hotspots`（⚠️ 后端路由无 /api 前缀！前端经 vite proxy 去 /api 前缀转发）支持 `?source=&category=&since=24h|7d&sort=hot|latest|score&limit=&page=`，响应附加 `hotScore`；旧 /category/:x /source/:x 兼容
- **trend 去脏**：无播放量源 trend 存 0（去掉 Math.random）
- **通知**：`NOTIFY_MIN_SCORE`（.env，默认 7）阈值 + 按 url 额外去重
- **前端**：Trending 页排序下拉（综合热度/最新/相关性）+ 刷新按钮 toast 反馈（手动刷新才 toast，自动轮询不弹）
- **关键词扩展（2026-08-19）**：`services/keywordExpansionService.ts` 用 DeepSeek 生成搜索变体（含原词，默认 5 个，失败降级仅原词）；Keyword 加 `expansions?: string[]` 字段缓存；`taskScheduler.fetchHotspotsForKeyword` 改为多（原词+变体）搜索→按 URL 去重合并→再 AI 过滤；新增 `POST /keywords/:id/expand` 手动重新生成；前端关键词页展示变体标签（可删单个）+重新生成按钮。实测梦幻西游 3→13 条
- **UI 修复 + 分类移除（2026-08-19）**：select 下拉箭头重叠 = `@tailwindcss/forms` 给 select 的 padding-right 被 `px-4/px-3` 覆盖 → 改 `pl-4 pr-10`；关键词分类下拉（通用/技术/金融...）已按用户决定移除（前端移除 select+展示，后端 POST category 改可选默认 'general'，keywords.json 的 category 字段保留但不展示）
- **AI 分析 Prompt 优化（2026-08-19）**：`deepseekService.analyzeHotspot` 返回扩展为 `isRealTrend/relevanceScore/category/reasoning(解释关联关系)/keywordMentioned(是否直接提关键词)/relevanceType(direct直接相关|indirect间接相关)`；Hotspot 增加 `reasoning/keywordMentioned/relevanceType` 可选字段（upsert 更新时同步）；前端热点卡片显示「直接相关/间接相关」徽章（只存展示，不参与过滤/排序——用户确认）
- **删除热门发现（2026-08-19）**：用户决定彻底删除（前端 Tab/渲染 + 后端 collectTrendingFromSources、trendingRoutes.ts、dataStore TrendingVideo、bilibiliAdapter.fetchTrending、SourceAdapter.fetchTrending 接口、bilibiliService.getPopularVideos、trending.json 全部移除）；SourceAdapter 接口现只剩 search
- **关键词分组 Tab（2026-08-19）**：热点页顶部新增关键词 Tab（全部/各 active 关键词，每个显示条数），**默认选中第一个 active 关键词**避免多关键词混排；过滤逻辑=先按关键词（h.keywords.includes）再按来源；关键词来自 GET /api/keywords（active）；纯前端改动，后端未改
- **删除关键词清理热点（2026-08-19）**：`dataStore.deleteKeyword` 现在会同步清理关联热点（仅由该关键词支持的热点整条删除；多关键词共享的只移除该词保留热点）；新增 `dataStore.cleanupOrphanHotspots()` 兜底清理无 active 关键词支持的热点，每次收集完成后调用（配合 dedupeHotspots）。⚠️ 踩坑：cleanupOrphanHotspots 初版用收集开始时的 activeKeywords 快照，收集进行中删关键词会误判（快照过时）→ 已改为**内部实时读取当前 active 关键词**（不传参）。隔离目录脚本验证通过
- **删除仪表盘 + 热点雷达改版（2026-08-19）**：删除 `pages/Dashboard.tsx`、App 路由 `/` 改 `<Navigate to="/trending">`；侧边栏去掉「仪表盘」，热点改「热点雷达」；Trending 页：标题改「热点雷达」，顶部新增 4 个统计卡片（总热数 byKeyword.length / 今日新增 firstSeenAt 今天 / 紧急热点 score>=9 / 监控词 keywordNames.length，首个卡片用 Spotlight），页头加「立即检查」按钮（POST /tasks/check 后 3s 自动刷新）+ 保留「刷新」；热点列表**最多展示 10 条**（slice(0,10)）。OnboardingGuide.tsx 已无引用（未删，无害）
- **关键词滑动开关 + 热点过滤修复（2026-08-19）**：关键词页 toggle 改为滑动开关（role=switch，开=橙滑块/关=灰）；热点雷达「全部」视图**只显示 active 关键词的热点**（`h.keywords.some(k => activeSet.has(k))`，被禁用/删除关键词热点不显示），无 active 关键词显示空；刷新按钮同步 fetchKeywords + keywordFilter 自动切到第一个 active（当前选中失效时）；「全部」Tab 计数用 allActiveCount 与列表一致。⚠️ 踩坑：DeepSeek 返回 ```json 代码块导致 analyzeHotspot 的 JSON.parse 失败全降级默认 → 新增 `parseJsonResult` 容错提取 `{...}`
- **删除通知功能 + dashboard（2026-08-19）**：前端通知页/useNotification hook/路由/侧边栏 + 后端 notificationRoutes/notificationService/checkNotifications 调度/dataStore Notification/notifications.json + 已无用的 dashboardRoutes（含 /dashboard/stats）+ config 的 smtp/notifyMinScore/notificationCheckInterval 全部删除；后端仅剩热点收集调度（30 分钟）+ 手动检查
- **流程优化（2026-08-19）**：① B站 searchVideos 支持翻页（maxPages=3，多页凑够 pageSize，翻页间隔 300ms 防风控）；② 热点雷达「立即检查」改为轮询 /tasks/status 直到 hotspotRunning=false 再刷新（最多等 3 分钟）；③ 空态加「去添加关键词」引导按钮 + 限10条后可「查看全部 N 条」展开/收起（showAll state）；④ 紧急热点口径 score>=9→8；⑤ 更新 README（当前系统）+ 删 OnboardingGuide.tsx + helpers 清理未用函数（truncateText/extractDomain/getChartColor/delay/debounce/throttle）
- ⚠️ 注意：多变体搜索会增加 B 站请求次数（每轮 5 次搜索）与 AI 分析次数（去重后候选），收集耗时变长
- ⚠️ 默认排序从「时间倒序」变为「综合热度」，前端下拉默认 hot
- ⚠️ 直接访问后端 API 路径不带 /api（如 http://localhost:3000/hotspots），/api/* 只在 vite 代理层有效
