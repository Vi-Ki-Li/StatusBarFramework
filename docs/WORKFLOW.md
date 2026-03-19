# 协作文档工作流（固定）

> 本项目统一采用：**需求 → 讨论 → 研究 → 规划 → 执行 → 验证**。  
> 新会话必须先阅读本文档，再开始改代码。

## 1) 需求（Requirement）

- 输入来源：用户自然语言描述、补充约束、UI 期望
- 产物：
  - `docs/REQUIREMENTS.md`（结构化需求）
  - 必要时更新 `docs/REQUIREMENTS-RAW.md`（原始需求归档）

## 2) 讨论（Discussion）

- 目标：澄清范围、确定本次迭代的边界（做什么/不做什么）
- 产物：
  - `docs/phases/phase-N-*.md` 中的“范围与边界”章节

## 3) 研究（Research）

- 目标：阅读现有实现、定位影响面、确认复用点与风险
- 产物：
  - `docs/phases/phase-N-*.md` 中的“现状与影响分析”
  - 如有关键取舍，补充到 `docs/DECISIONS.md`

## 4) 规划（Planning）

- 目标：给出可执行任务分解与验收标准
- 产物：
  - `docs/phases/phase-N-*.md` 中的任务清单（checkbox）
  - `docs/ROADMAP.md` 勾选/调整对应 phase 条目

## 5) 执行（Execution）

- 目标：最小改动实现功能/修复问题
- 产物：
  - 代码变更 + 提交
  - `docs/phases/phase-N-*.md` 中“实现记录”

## 6) 验证（Validation）

- 目标：证明修改可工作且不破坏已有行为
- 产物：
  - 构建/测试结果写入 `docs/phases/phase-N-*.md`
  - 更新 `docs/TESTING.md`（新增可复用测试步骤）
  - `docs/STATE.md` 更新为“当前快照”

---

## 文档职责（必须遵守）

- `docs/STATE.md`：**只放当前状态快照**（当前阶段、风险、下一步、恢复顺序）
- `docs/phases/phase-N-*.md`：**阶段详细记录**（讨论/研究/规划/执行/验证）
- `docs/DECISIONS.md`：**关键决策**（有取舍、有影响面时必须记录）
- `docs/TESTING.md`：**可复用测试手册**（按 Phase 持续补齐）
- `docs/ARCHITECTURE.md`：**系统架构总览**（结构变化时更新）

## 新会话启动顺序

1. `docs/STATE.md`
2. `docs/WORKFLOW.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/ROADMAP.md`
6. 最新 `docs/phases/phase-N-*.md`
7. `.cursor/rules/*.mdc`
