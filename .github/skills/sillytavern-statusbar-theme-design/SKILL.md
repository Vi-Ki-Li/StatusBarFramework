---
name: sillytavern-statusbar-theme-design
description:
  为酒馆状态栏设计并直接交付可导入 JSON（Definitions/Styles/Layouts/Themes/Narratives/Full
  Export）。只要用户提到状态栏主题、导入包、模块 JSON、观感重构、层级优化、主题组合映射，就必须使用本
  Skill，即使用户未提到 schema 或源码。
user-invocable: true
argument-hint: '[主题名] [信息密度: 低/中/高] [场景: 通用/战斗/日常/探索]'
---

# SillyTavern Statusbar Theme Design

本 Skill 目标是让代理在不依赖额外口头补充的前提下，独立完成“设计 -> 生成 JSON -> 本地校验 -> 可导入交付”。

## 立即触发条件

出现任一信号就触发：

- 用户要“状态栏主题/重构观感/层级优化”。
- 用户要“可导入 JSON/导入包/整包迁移”。
- 用户要求“不看源码直接给模块 JSON”。
- 用户提到五模块联动：Definitions、Styles、Layouts、Themes、Narratives。

## 最小输入

若用户未给全量信息，使用以下默认值并继续执行，不等待补充：

- 主题名：`default-theme`
- 信息密度：`中`
- 场景：`通用`
- 交付范围：五模块 JSON + 主题说明；若用户提“迁移/一键导入”再加 Full Export。

## 执行顺序（必须）

1. Definitions：先固定条目语义、分组、dataType、entryId。
2. Layouts：先确定阅读顺序与容器骨架，再定布局参数。
3. Styles：按文本/数值/布尔/摘要拆样式家族，再补材质和状态反馈。
4. Themes：最后做 entryIds + styleOverrides + layoutId 绑定。
5. Narratives：补叙事模板。
6. 校验：跑规则 R001-R018；失败不得标记为“可导入交付”。

禁止跳步。若中途改 entryId，必须回滚到第 1 步重做跨引用。

## 输出协议（默认强制）

除非用户明确要求只要单模块，否则必须交付：

1. 主题说明（信息架构、视觉语言、总览版/紧凑版差异）
2. `definitions.json`
3. `styles.json`
4. `layouts.json`
5. `themes.json`
6. `narratives.json`

若用户要求迁移包，再加：

7. `full-export.json`
8. （可选）`system-config.json`

## 交付前自检

- 结构检查通过：R001-R011
- 跨引用检查通过：R012-R014
- 包体与唯一性检查通过：R015-R018
- 命令执行成功且返回通过

若环境阻塞（无法运行命令），必须输出阻塞报告：

- 阻塞点
- 已完成范围
- 未验证风险
- 用户可复现命令

## 参考文件索引

- JSON 契约与最小模板：`references/json-contract.md`
- 校验规则与命令：`references/validation-and-delivery.md`
- 设计流程与质量门槛：`references/design-workflow.md`
- 历史经验与扩展说明归档：`references/legacy-knowledge-archive.md`

执行时按需读取，不要把大段契约重复粘贴到最终回复。
