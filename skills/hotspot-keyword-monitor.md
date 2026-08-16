---
name: hotspot-keyword-monitor
description: "Use when you need to set up and manage keyword monitoring for real-time hotspot detection, track trending topics, or create continuous monitoring workflows for specific subjects."
---

# 热点关键词监控 Skill

用于设置和管理关键词监控系统，自动发现相关热点事件。

## 何时使用

使用此 Skill 当您需要：
- 设置对特定主题（如"AI编程"、"技术突破"）的实时监控
- 管理多个监控关键词及其分类
- 追踪特定领域（技术、金融、娱乐等）的最新动态
- 为内容创作或研究收集相关热点信息
- 实现自动化的热点发现工作流

## 工作流

1. **初始化监控**
   ```
   POST /keywords
   {
     "keyword": "AI编程",
     "category": "tech"
   }
   ```

2. **查看所有监控词**
   ```
   GET /keywords
   ```

3. **管理监控状态**（启用/禁用）
   ```
   PATCH /keywords/{id}
   {
     "isActive": true
   }
   ```

4. **删除不需要的监控**
   ```
   DELETE /keywords/{id}
   ```

5. **系统后台自动处理**
   - 每 15 分钟自动扫描新热点
   - 使用 AI 识别真实热点（过滤假信息）
   - 生成热点匹配通知
   - 存储监控历史记录

## 支持的关键词分类

- `general` - 通用热点
- `tech` - 技术相关
- `finance` - 金融相关
- `entertainment` - 娱乐相关
- `sports` - 体育相关
- `other` - 其他

## 数据源

系统从以下多个信息源自动收集数据：
- 🌐 Web 搜索结果和新闻网站
- 🐦 Twitter/X API（实时推文）
- 📱 知乎热点话题
- 💄 小红书热搜
- 📰 RSS 源聚合

## 使用示例

### 示例 1：监控 AI 相关热点
```
关键词: "AI编程"
分类: tech
预期结果: 系统自动发现 ChatGPT 更新、新 AI 模型发布、AI 安全讨论等相关热点
```

### 示例 2：跟踪金融市场动态
```
关键词: "加密货币"
分类: finance
预期结果: 获得 BTC 价格变动、新币种上线、市场风险提示等通知
```

### 示例 3：内容创作参考
```
关键词: ["短视频", "创意营销", "内容趋势"]
分类: entertainment
预期结果: 获得最新的短视频、创意文案、营销案例等灵感来源
```

## 输出格式

监控返回的热点数据包含：

```json
{
  "id": "唯一标识",
  "title": "热点标题",
  "description": "详细描述",
  "source": "Twitter|Web|Zhihu|Xiaohongshu",
  "category": "识别的内容分类",
  "score": 8.5,
  "trend": 45,
  "url": "原始链接",
  "timestamp": "2026-08-15T10:30:00Z",
  "keywords": ["AI编程", "编程工具"]
}
```

## 关键配置

- **监控间隔**：每 15 分钟自动检查一次（可配置）
- **热点评分**：0-10 分，≥5 分才会生成通知
- **数据保留**：最近 1000 条热点记录
- **AI 识别率**：使用 DeepSeek AI 进行真实性验证

## API 响应状态

| 状态 | 含义 |
|-----|-----|
| 200 | 操作成功 |
| 201 | 关键词创建成功 |
| 400 | 请求参数无效 |
| 404 | 关键词不存在 |
| 500 | 服务器错误 |

## 下一步

1. 添加关键词后，查看**"热点"**页面了解检测结果
2. 在**"通知中心"**查看系统生成的告警
3. 根据结果调整关键词和分类
4. 可选：配置邮件通知接收热点信息

## 高级用法

### 监听特定分类的热点
```bash
GET /hotspots/category/tech
```

### 获取特定来源的热点
```bash
GET /hotspots/source/Twitter
```

### 查询完整的监控历史
```bash
GET /keywords
# 查看每个关键词的创建时间、最后更新时间、当前状态
```

---

**提示**：定期检查和更新监控关键词，以确保获取最相关的热点信息。
