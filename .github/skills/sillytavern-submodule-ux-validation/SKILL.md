---
name: sillytavern-submodule-ux-validation
description:
  对状态栏管理器子流程做 click/脚本双路径 UX
  验证，覆盖新手可理解性、失败提示、成功反馈、下一步引导，并以截图与分级问题输出结论。只要用户提“子模块流程”“新手不知道下一步”“点击没反馈/动画异常/tabs
  不显示”，必须使用本 Skill。
user-invocable: true
argument-hint: '[目标地址，可选，默认 http://localhost:8000] [模块范围，可选]'
---

# SillyTavern Submodule UX Validation

本 Skill 用于五模块可达之后的“可完成性与可理解性”验证，不是入口冒烟测试的替代。

## 前提

1. `pnpm watch` 正在运行。
2. 外部 Chrome 已被 `chrome-devtools-mcp` 接管。
3. 管理器入口已在桌面和移动端验证可达。

## 核心方法

每个子模块都要走两条路径：

1. click 路径：纯点击完成最小任务。
2. 脚本路径：通过导入/脚本快速达成同目标，用于验证可恢复与批量复测能力。

## UX 检查项（每个子模块必须覆盖）

- 首屏是否知道从哪里开始。
- 失败是否有明确提示。
- 成功后是否有可见反馈。
- 用户是否知道下一步。

## 运行时问题必采字段

若排查“动画不生效、tabs 不显示、点击无反馈”，在改码前必须采集：

- `injection`
- `click`
- `toggle`
- `transitionend`
- `tabCount`
- `domNodes`

仅凭代码阅读不算通过。

若 `tabCount=0` 或子模块标签不可见：

1. 立即判定 P0 阻塞。
2. 停止后续子流程点击。
3. 仅输出阻塞证据与下一步最小动作。

## 推荐步骤（单子模块）

1. 进入子模块（before/after）
2. 做最小可用任务（新建/保存/导出之一）
3. 做失败路径任务（空输入/非法输入）
4. 回到列表确认状态持久化
5. 记录问题分级（P0/P1/P2）

## 问题分级

- P0: 阻塞主流程
- P1: 显著降低效率或理解成本过高
- P2: 体验优化项

## 阻塞时交付要求

即使阻塞也必须交付：

1. 已完成到哪一步
2. 阻塞字段证据
3. 阻塞分类（场景/数据/事件/样式）
4. 下一步最小动作（只能给一个动作）

## 输出模板

```md
### 子模块 UX 验证结果

- 模块/子模块:
- click 路径结果:
- 脚本路径结果:
- 新手可理解性结论:
- 失败提示质量:
- 成功反馈质量:
- 问题分级(P0/P1/P2):
- 截图路径(session-state):
- 运行时字段证据:
- 阻塞点与下一步最小动作(如有):
```

## 参考文件索引

- 仓库 JSON 快速导入：`references/repo-json-fast-import.md`
- 运行时交接模板：`references/runtime-handoff-template.md`
- 执行清单：`references/submodule-checklist.md`
- 历史经验归档：`references/legacy-submodule-ux-notes.md`
