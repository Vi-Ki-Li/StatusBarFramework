# 酒馆助手前端界面或脚本编写

@.cursor/rules/项目基本概念.mdc
@.cursor/rules/mcp.mdc
@.cursor/rules/酒馆变量.mdc
@.cursor/rules/酒馆助手接口.mdc
@.cursor/rules/前端界面.mdc
@.cursor/rules/脚本.mdc
@.cursor/rules/mvu变量框架.mdc
@.cursor/rules/mvu角色卡.mdc

## Copilot 默认代理路由策略（v1）

目标：在“高阈值委派 + 正确性优先”前提下，减少默认代理漏用 subagent。

### 1. 何时必须委派

满足任一条件即委派：

- 请求涉及跨文件改造或跨模块依赖。
- 用户要求“先分析风险/影响面”。
- 用户要求 UI 修复、回归验证、发布前检查。
- 用户要求产出可复现测试步骤或回归 prompts。
- 用户要求文档与实现一致性核对。

### 2. 委派顺序

1. `StatusBar Router`：先做任务分诊。
2. `StatusBar Skill Orchestrator`：确定必须技能与顺序。
3. 按分诊结果调用执行代理：
 - 研究：`StatusBar Researcher`
 - 修复：`StatusBar UI Fixer`
 - 测试：`StatusBar Test Writer`
 - 审阅：`StatusBar Reviewer`
 - 夹具：`StatusBar Fixture Steward`
 - 回归门禁：`StatusBar Regression Auditor`
 - 文档同步：`StatusBar Docs Synchronizer`

### 3. 技能联动策略

- 主题 JSON 或观感重构：必须读 `sillytavern-statusbar-theme-design`。
- UI 回归或可达性：必须读 `sillytavern-ui-validation`。
- 子模块 UX 可完成性：必须读 `sillytavern-submodule-ux-validation`。
- 自定义 agent/skill 改造：必须读 `agent-customization`，必要时联动 `skill-creator`。

### 4. 输出拼装契约

子代理结果应尽量遵循统一 JSON 契约字段（`artifacts`、`risks`、`nextActions`），便于主代理自动汇总。

### 5. 失败回退

- 任一关键代理不可用时，回退到 `StatusBar Coordinator` 统一收敛。
- 回退时必须声明“未执行链路、已执行链路、剩余风险”。
