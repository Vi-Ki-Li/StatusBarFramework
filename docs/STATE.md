# 项目进度状态（当前快照）

> 本文件只记录“当前状态与下一步”，历史细节统一沉淀到 `docs/phases/`。

## 当前状态

- **最后更新**: 2026-03-26
- **当前阶段**: Phase 8.10（角色切换顺滑性与运行时性能打磨）
- **当前主任务**: 降低角色切换时整栏重建导致的卡顿体感，建立可复用的切换顺滑验证口径

补充（2026-03-26，Phase 8.10）:

- 已在状态栏渲染器实现“角色切换优先就地更新 + 全量渲染兜底”。
- 已补充运行时日志字段：`switch-start`、`switch-commit`、`switch-end`、`rerender-count`（通过 commit/end 组合可直接判定单次切换重绘次数）。
- 已完成一次运行时验证：同一状态栏根节点下切换角色成功，`tabCount` 与 DOM 节点总量保持稳定。
- 已新增阶段记录：`docs/phases/phase-8.10-character-switch-smoothness.md`。
- 已补充测试手册中的“角色切换顺滑性”可复用清单。

补充（2026-03-20）:

- 已新增下一阶段草案文档：`docs/phases/phase-8.x-ui-validation-workflow.md`（需求/讨论/研究/规划，待确认后执行）。
- 已新增子模块 UX 测试 skill 草案：`.github/skills/sillytavern-submodule-ux-validation/SKILL.md`（待评审启用）。
- 已完成遗留项补全（本轮）：
  - Phase 3：布局 JSON → DOM 渲染已接入状态栏渲染器（含未布局条目回退）。
  - Phase 8：系统配置新增“世界书条目管理”子模块（刷新、重注入、单条启停、全开全关、删除世界书）。
  - ROADMAP 对应待办已勾选更新。

补充（2026-03-21）:

- 已完成 `<OmgPatch>` 协议接入（无代码块 fallback）。
- 已新增 patch runtime：消息解析→状态合并→快照保存→状态栏刷新。
- 已新增系统配置开关：自动隐藏补丁标签（全局正则可启停）。
- 已修复角色路径自动创建后数据中心不可见问题（自动补 `_characters`）。
- 已修复状态栏样式链路（加载自定义样式单元 + 全局主题注入）。
- 已增加楼层删除后的最近快照回溯能力（基础版）。
- 已接入叙事模板世界书注入（风格常驻 + 本轮变化覆盖）。
- 详细记录见 `docs/phases/phase-8.4-patch-runtime-and-worldbook-loop.md`。

补充（2026-03-21，视觉专项）:

- 已重写武侠视觉测试数据（样式/布局/主题组合/叙事模板）。
- 已新增视觉设计指南：`docs/STATUSBAR-VISUAL-DESIGN.md`。
- 已新增主题设计 Skill：`.github/skills/sillytavern-statusbar-theme-design/SKILL.md`。
- 详细记录见 `docs/phases/phase-8.5-wuxia-visual-refresh-and-theme-design-skill.md`。

补充（2026-03-26，外部 Skill 引入）:

- 已引入 `skill-creator`：`.github/skills/skill-creator/`。
- 已引入 `ui-ux-pro-max`：`.github/skills/ui-ux-pro-max/`。
- 已评估 `find-skills`，本轮结论为“可选，不作为当前常驻依赖”。
- 详细记录见 `docs/phases/phase-8.6-external-skill-onboarding.md`。

补充（2026-03-26，主题 Skill 通用化）:

- 已重写 `.github/skills/sillytavern-statusbar-theme-design/SKILL.md` 为通用场景版本（不再绑定武侠语义和命名）。
- 已在 Skill 中固化框架能力附录：布局模式与各模块 JSON 导入导出顶层格式。
- 已加入 UI 质量检查：配色一致性、形状层级、分组容器、深度材质、微交互与稳定性。
- 已完成二次增强：附录升级为“字段级 JSON 契约”，覆盖 Data Center 运行态、SystemConfig 原始配置与 Full Export 整包迁移格式。
- 详细记录见 `docs/phases/phase-8.7-theme-design-skill-generalization.md`。

## 已完成里程碑

- ✅ Phase 0-8 主干功能完成（基础设施、数据层、数据工作室、渲染、样式工坊、布局编排器、数据中心、管理器整合、系统配置）
- ✅ 管理器 5 大模块已接入
- ✅ 文档体系已建立：`REQUIREMENTS/DECISIONS/ROADMAP/STATE/TESTING/ARCHITECTURE`

## 当前阻塞 / 风险

- ⚠ 仍需在真实酒馆页面完成一轮人工确认（入口与响应式）
- ⚠ 尚有更多 UI 问题待后续批次收敛（本次先处理高优先级）

## 下一步（执行优先级）

1. 在真实酒馆页面做桌面 + 移动端角色切换体感复核（含切换连续点击压测）。
2. 若仍存在轻微闪烁，继续拆分为“内容区最小差异更新”而非整块内容替换。
3. 为角色切换补充性能采样（帧耗时、长任务、切换期间样式重算次数）。
4. 按 `docs/TESTING.md` 扩展 Phase 8.x 回归清单并固定证据模板。
5. 稳定后继续推进 Phase 9 高级功能项。

## 新会话恢复顺序（强制）

1. `docs/STATE.md`（本文件）
2. `docs/ARCHITECTURE.md`
3. `docs/DECISIONS.md`
4. `docs/ROADMAP.md`
5. `docs/phases/` 最新 phase 文档
6. `.cursor/rules/*.mdc`
