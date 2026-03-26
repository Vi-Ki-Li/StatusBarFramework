# Phase 8.8：战斗面板复刻稳定性修复（宽度阈值 / 未布局条目 / 分类分组）

日期：2026-03-26

## 背景

用户在“参考图复刻-全量”下反馈了三个关键问题：

1. 页面宽度稍窄时双栏退化为单栏，不符合预期。
2. 分类名（如“基本生存属性”）没有在布局中显式展示。
3. 有时出现“未布局条目”与样式字号不一致（导入后仍显示旧大字）。

## 根因分析

### 1) 双栏宽度问题

- 复刻布局中中部与底部双栏容器使用了较大的 `flex-basis`（430px）。
- 在聊天气泡可用宽度略小于阈值时，`flex-wrap` 会改为单列。

### 2) 分类名不显示

- 现有渲染器仅显示“整个 layout 的 section 标题”。
- 布局树中的 container `label` 默认不渲染为视觉标题。

### 3) 字号与样式“看起来没更新”

- 渲染器的动态样式注入按 `styleUnit.id` 去重。
- 当同 ID 样式内容更新后，旧 CSS 仍可能驻留，导致视觉继续使用旧字号。

## 本次修改

### A. 渲染器增强（主题作用域 + 容器分组 + 样式热更新）

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 有激活主题时按 `theme.entryIds` 过滤 definitions，再参与渲染。
- `loadDefinitions()` 中重置动态样式缓存：
  - `injectedCssIds.clear()`
  - 清空 `data-omg-su-css` 内容
- 为布局 container 增加可选元字段支持：
  - `showLabel: true` 显示容器标题
  - `collapsible: true` 允许容器级折叠
- 新增布局分组折叠事件 `data-omg-layout-toggle`。

### B. 基础样式补充（布局分组标题/折叠）

文件：`src/通用状态栏框架脚本/styles/statusbar.css`

- 新增 `.omg-sb__layout-group*` 样式：
  - 分组标题行、箭头、折叠过渡
  - 容器体展开/收起动画

### C. 复刻布局阈值优化

夹具：`fixtureId=fx-combat-20260326-01`（布局模块）

- 中部双栏、底部双栏容器的 `flex-basis` 从 430px 下调到 320px。
- 新增 `min-width: 300px`，让双栏在更窄可用宽度下仍能维持。
- 在关键容器上启用：
  - `showLabel: true`
  - `collapsible: true`

## 影响

- 视觉上可见分类标题，且支持在布局内按分组折叠。
- 双栏退化阈值下降，正常聊天宽度下更容易维持两列。
- 样式导入后同 ID 更新能立即生效，减少“明明改了还像旧版”的错觉。

## 校验

- 运行 `util/validate-statusbar-json.mjs`：R001-R018 全通过。
- `renderer/status-bar.ts` 无新增 TypeScript 错误。

## 后续建议

1. 在布局编排器 UI 中显式暴露 `showLabel/collapsible` 开关（当前可通过 JSON 导入生效）。
2. 后续若需要“分类作为可绑定节点”，可扩展 `node.type=category`（见 DEC-012）。

## 追加修复（2026-03-26）

### D. 分类动态绑定（可开关）+ 排序策略

文件：`src/通用状态栏框架脚本/data/layouts-store.ts`

- 新增容器可选字段：
  - `autoSyncFromCategory`
  - `bindCategoryId`
  - `categorySortStrategy`

文件：`src/通用状态栏框架脚本/manager/modules/LayoutComposer.vue`

- 在容器属性面板新增“动态绑定数据工作室分类”开关与“绑定分类”选择。
- 新增“动态排序策略”选择：
  - 按分类原始顺序
  - 按布局手动顺序优先

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 运行时支持按绑定分类动态展开条目。
- 排序策略实现：
  - `category`：直接使用分类顺序
  - `layout`：先按容器原 children 顺序匹配，再追加分类新增条目

### E. 折叠概率异常修复

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 新增分组折叠状态缓存（按 `node.id`）并在渲染时回放，降低重渲染导致的“点击后状态被覆盖”现象。

文件：`src/通用状态栏框架脚本/styles/statusbar.css`

- 折叠态强制覆盖 `min-height/height/padding/gap`，确保容器高度能真实回收。

### F. 战斗测试布局去除硬编码高度

夹具：`fixtureId=fx-combat-20260326-01`（布局模块）

- 移除关键双栏容器的 `min-height` 与 `height:100%`，改为内容驱动，减少空白区。

### G. 概率性不展开修复（渲染竞态）

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 为 `renderStatusBar` 增加渲染代次保护，丢弃过期渲染结果，降低并发事件导致的状态回退。
- 在分组折叠点击后主动触发一次刷新，使 DOM 与内存状态一致。

文件：`src/通用状态栏框架脚本/styles/statusbar.css`

- `layout-group-body` 默认改为内容驱动高度（`min-height:0; height:auto;`），降低旧布局内联高度残留造成的空白。

### H. 布局编排器保存稳定性修复

文件：`src/通用状态栏框架脚本/manager/modules/LayoutComposer.vue`

- 增加布局脏状态标记与自动保存（防抖 900ms）。
- 切换布局前自动尝试保存当前改动。
- 模块卸载时执行兜底保存，减少切页后“看起来没保存”的情况。
- 在保存栏显示“未保存修改”提示。

### I. 跨模块保存失败与折叠动画收尾修复

文件：`src/通用状态栏框架脚本/core/storage.ts`

- 为 IndexedDB 写入增加 `normalizeForIDB`：优先 `structuredClone`，失败后回退到 `JSON.parse(JSON.stringify(...))`。
- `putItem/putItems` 统一先做可克隆归一化，规避 Vue 响应式对象写入触发 `DataCloneError`。

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 移除分组折叠点击后的“立即重渲染”调用，避免折叠动画过程中 DOM 被替换导致的视觉抖动。

夹具：`fixtureId=fx-combat-20260326-01`（布局模块）

- 四个双栏列容器改为 `flex:1 1 0; min-width:0;`，从“基于阈值换行”转为“优先等分拉伸填满”，减少中部与底部空白区。

## 再次校验（本轮收尾后）

- 运行 `util/validate-statusbar-json.mjs`：R001-R018 全通过（18/18）。
- `core/storage.ts`、`renderer/status-bar.ts`、`combat-layout-composer.json` 均无新增错误。

## 追加修复（2026-03-26，第二轮）

### J. 折叠可靠性与状态隔离

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 分组折叠状态键从 `node.id` 升级为 `layoutScope + node.id`，避免不同布局复用节点 ID 导致折叠状态串扰。
- 分组节点输出补充 `data-omg-layout-scope`，点击折叠时按作用域写回状态。

文件：`src/通用状态栏框架脚本/styles/statusbar.css`

- 分组折叠体样式改为稳定优先：折叠时 `display:none`，避免动画过程中的高度计算残留导致“看似无法展开”。

### K. 布局层子项自动等分宽度（非样式层固化）

文件：`src/通用状态栏框架脚本/data/layouts-store.ts`

- 新增容器字段 `autoEqualizeItems`（仅 `flex-row` 生效）。

文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`

- 当容器开启 `autoEqualizeItems` 时，直接子条目按 `flex:1 1 0; min-width:0;` 渲染，实现 1/2/3/N 项自动等分填满。

文件：`src/通用状态栏框架脚本/manager/modules/LayoutComposer.vue`

- 容器属性面板新增“子项自动等分宽度（仅 flex-row）”开关。
- 预览区同步等分逻辑，保证编排器观感与运行时一致。

夹具：`fixtureId=fx-combat-20260326-01`（布局模块）

- 在中部双栏、底部双栏容器启用 `autoEqualizeItems: true`。

### L. 模块级自动保存开关（先落地 Layout Composer）

文件：`src/通用状态栏框架脚本/data/variables.ts`

- `SystemConfig` 新增 `managerAutoSave` 分模块开关结构，并在读取配置时进行深合并默认值。

文件：`src/通用状态栏框架脚本/manager/modules/LayoutComposer.vue`

- 保存栏新增“自动保存”开关，并持久化到 `managerAutoSave.layoutComposer`。
- 关闭自动保存后保留脏状态提示与手动保存，不再防抖自动落盘。

### M. Skill 文档同步

文件：`.github/skills/sillytavern-statusbar-theme-design/SKILL.md`

- 补充 `autoEqualizeItems`、折叠作用域键、布局层与样式层边界、模块级自动保存约束。
