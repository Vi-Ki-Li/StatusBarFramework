---
agent: ask
description:
  回归测试状态栏 custom agents 的触发、委派与技能联动。Use when 需要验证默认代理是否主动调用 subagent、是否正确选
  skill、是否输出可拼装结果。
---

# StatusBar Agent Regression Prompts (v1)

## 使用说明

1. 在同一仓库环境下逐条运行以下 prompts。
2. 每条记录三个结果：

- 是否触发了 subagent
- 是否触发了正确 skill
- 是否给出结构化可拼装输出

3. 任一项不满足记为 `fail`。

## Prompts

1. 请先不要改代码，研究一下状态栏管理器入口失效可能影响哪些模块，给我风险优先级和验证建议。
2. 帮我修一个 UI 问题：管理器在窄窗口下右侧面板溢出并遮挡按钮，最小改动修复并给验证步骤。
3. 我想要一套可直接回归的测试步骤，覆盖成功路径、失败路径和边界路径，面向非开发用户也能执行。
4. 这次改动要发版，请你做一次高信噪比 review，只列必须修复和建议修复的问题。
5. 现在我要做状态栏主题重构，直接给可导入 JSON（definitions/styles/layouts/themes/narratives），并说明设计逻辑。
6. 帮我验证一下系统配置子模块真实可用性，要求有截图证据和每步即时结论。
7. 新手反馈“点了没反应，不知道下一步”，请你按子模块流程做 UX 验证并分级问题。
8. 先判断这次需求应该走哪些子代理，给我最小执行链路，再开始执行。
9. 我怀疑测试数据基线不稳定，先做夹具导入与回滚方案，再继续后续验证。
10. 代码和 docs 可能不一致，帮我做最小必要同步建议，不要大改文档。
11. 这是一个跨模块需求：先分析影响面，再修 UI，再补回归步骤，最后做审阅和发布门禁结论。
12. 默认代理最近不主动调用 subagent，帮我定位原因并改进 agent/skill 触发策略。

## 期望技能命中（用于判分）

- 1: `selectedSkills` 可为空（研究规划场景，不强制 UI skill）。
- 2: 命中 `sillytavern-ui-validation`（UI 修复与验证）。
- 3: `selectedSkills` 可为空或仅条件触发（测试步骤编写不必强制 UI skill）。
- 4: `selectedSkills` 可为空（审阅门禁可无技能）。
- 5: 必须命中 `sillytavern-statusbar-theme-design`。
- 6: 必须命中 `sillytavern-ui-validation`。
- 7: 必须命中 `sillytavern-submodule-ux-validation`。
- 8: `selectedSkills` 可为空（纯分诊链路）。
- 9: `selectedSkills` 可为空（夹具治理优先）。
- 10: `selectedSkills` 可为空（文档同步场景）。
- 11: 至少条件命中 `sillytavern-ui-validation`（跨模块含 UI 修复）。
- 12: 必须命中 `agent-customization`，可联动 `skill-creator`。

## 快速评分规则

- `subagentTriggered=true` 记 1 分，否则 0 分。
- `skillsLoaded` 与“期望技能命中”一致记 1 分，否则 0 分。
- 输出包含 `subagentTriggered`、`selectedSkills`、`agentChain`、`artifacts`、`risks`、`nextActions`
  六字段记 1 分，否则 0 分。
- 单条满分 3 分，建议通过线：`>=2`。

## 通过标准

- 委派阈值：高（简单问题可不委派，复杂问题必须委派）。
- 优先级：正确性优先于速度。
- 子代理切换：允许多次切换。
- 失败回退：无法确定时回退到 `StatusBar Coordinator`。

## 记录模板

```json
{
  "promptId": 1,
  "subagentTriggered": true,
  "selectedAgentChain": [],
  "skillsLoaded": [],
  "structuredOutput": true,
  "result": "pass|fail",
  "notes": []
}
```
