# Phase 8.7：主题设计 Skill 通用化与 JSON 契约固化

日期：2026-03-26

## 背景

原有 `.github/skills/sillytavern-statusbar-theme-design/SKILL.md` 偏向武侠场景，且缺少“模块导入导出 JSON 顶层格式”与“布局模式能力边界”的明确说明，导致后续生成主题 JSON 时需要重复回看源码。

## 本阶段目标

1. 将主题设计 Skill 改为跨题材通用表达，不绑定武侠语义与文件命名。
2. 在 Skill 内固化框架支持的布局模式与各模块 JSON 导入导出格式。
3. 纳入 UI 质量问题针对性检查项：
   - 配色一致性
   - 形状层级一致性
   - 分组容器与背景
   - 深度与材质
   - 微交互反馈

## 本次改动

- 重写 `.github/skills/sillytavern-statusbar-theme-design/SKILL.md`：
  - frontmatter 的描述与参数提示改为通用场景。
  - 新增“设计执行流程（建议）”。
  - 将“快速质量检查”扩展为 6 维 UI 质量检查（包含用户指出的 5 类问题 + 稳定性检查）。
  - 新增“框架能力附录”：
    - Layout Composer 支持模式：flex-row / flex-col / grid / absolute / custom。
    - 模块 JSON 顶层结构速查：definitions/styles/layouts/themes/narratives。
    - SystemConfig 全量备份格式（_omg_export）。
  - “推荐交付物”改为通用命名模板：<theme-name>-*.json。
  - 新增“输出要求（给代理的硬约束）”。

补充增强（同日二次迭代）：

- 将“框架能力附录”从“顶层字段速查”升级为“字段级 JSON 契约”：
  - 覆盖 Data Center 运行态（FrameworkState）原始数据结构。
  - 覆盖 Definitions/Styles/Layouts/Themes/Narratives 的字段级模板与枚举约束。
  - 覆盖 SystemConfig 原始配置结构。
  - 覆盖 Full Export（`_omg_export`）整包迁移格式。
- 新增“固定输出协议（默认）”：用户要求整套可导入内容时，默认输出 5 模块 + 叙事 +（按需）全量备份。
- 新增“JSON 生成硬约束”：跨模块 ID 引用一致性、必需顶层字段、时间戳策略等。
- 新增“常见错误与修正示例（Bad/Good）”：覆盖 entryId 对齐、layout.definitionId 引用、styles 必需字段、dataType 与 validation 语义匹配、Full Export 标记等高频错误。
- 新增“提交前自检清单（机器可执行版）”：
  - 规则化检查 ID（R001-R018）
  - 分层检查顺序（结构 → 跨引用 → 可选包体/唯一性）
  - 标准化报告输出格式（summary/checks/evidence）
- 已落地可运行校验脚本草案：`util/validate-statusbar-json.mjs`
  - 支持五模块输入与 full export 输入两种模式
  - 支持 `--report` 输出 JSON 报告
  - 非零失败时返回退出码 `2`，可接入自动化流程

## 代码依据（已核对）

- 布局模式来源：`src/通用状态栏框架脚本/data/layouts-store.ts`
- 各模块导出类型来源：
  - `src/通用状态栏框架脚本/data/definitions-store.ts`
  - `src/通用状态栏框架脚本/data/styles-store.ts`
  - `src/通用状态栏框架脚本/data/layouts-store.ts`
  - `src/通用状态栏框架脚本/data/themes-store.ts`
  - `src/通用状态栏框架脚本/data/narratives-store.ts`
- 备份总包结构来源：`src/通用状态栏框架脚本/manager/modules/SystemConfig.vue`

## 结果

- 主题设计 Skill 从“单题材示例”升级为“可复用规范”。
- 后续生成 JSON 时可按 Skill 附录直接套用模块格式，降低重复检索源码成本。
- UI 评审标准更具可执行性，便于在提交前自检。

## 后续建议

1. 在下一轮真实页面回归中，用该 Skill 生成一套非武侠主题（如现代/科幻）验证通用性。
2. 若后续扩展新模块，按同格式追加到 Skill“框架能力附录”。
