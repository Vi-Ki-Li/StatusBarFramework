# Phase 8.6 外部 Skill 引入（skill-creator + ui-ux-pro-max）

## 背景

用户要求基于 skills.sh 引入外部技能，并明确优先级：

1. 先引入 `skill-creator`
2. 评估 `find-skills` 是否适合当前仓库
3. 引入 `ui-ux-pro-max`

## 执行结果

- 已安装：`.github/skills/skill-creator/`
  - 来源：`anthropics/skills` 的 `skills/skill-creator`
- 已安装：`.github/skills/ui-ux-pro-max/`
  - 来源：`nextlevelbuilder/ui-ux-pro-max-skill` 的 `.claude/skills/ui-ux-pro-max`
- 已评估（未安装）：`find-skills`
  - 结论：当前仓库已有明确目标技能与固定来源，本轮无需常驻安装检索型元技能

## 评估结论（find-skills）

`find-skills` 主要用于“按需求搜索并安装其他技能”。在本仓库当前阶段，需求聚焦于：

- 技能编写与迭代方法（`skill-creator`）
- UI/UX 设计规则与检查（`ui-ux-pro-max`）

因此 `find-skills` 的价值更偏“未来扩展搜索入口”，不是当前必需链路。后续若进入多领域技能扩展期，可再按需安装。

## 使用建议

- 当要重写或泛化现有本地 Skill 时：优先触发 `skill-creator`
- 当要做状态栏界面重构、视觉方向选择、可用性审查时：优先触发 `ui-ux-pro-max`

## 风险与边界

- 外部 Skill 体量较大，触发时上下文会增加，建议在任务描述里明确目标，避免泛触发
- 本轮未改动现有业务代码，仅新增技能目录与文档记录
