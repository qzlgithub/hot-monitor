# 工作流程偏好（Git + 功能开发）

## Git / 版本控制
- 用户希望自己操作 Git，我只提醒怎么做，不替他执行 `git` 命令。
- 给出分步指令（status → add → commit → push）和每步含义即可。
- 仅在用户明确要求"帮我执行"时才运行 Git 命令。

## 功能开发 / 数据源
- 新增或调整数据源、以及实现较复杂功能时：必须先给出完整方案（含现状调研、候选选项、各自权衡、推荐项），等用户人工确认后才能开始写代码。
- 有任何不确定的内容，必须通过提问（vscode_askQuestions）找用户确认，不要擅自替用户做决定。
- 数据源扩展采用 adapter 架构：加源 = 实现 SourceAdapter + 注册 + .env 开开关，调度器零改动。

## 前端 / UI 美化
- 后期任何页面改动/设计开发：必须使用 ui-ux-pro-max 技能（c:\Users\qzlxn\.agents\skills\ui-ux-pro-max\SKILL.md）进行设计开发。
- 必须采用 Aceternity UI 组件库，并通过 Context7 插件（mcp_context7）获取组件最新用法/文档后再实现。
