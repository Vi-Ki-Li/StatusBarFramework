# Phase 8.12：Phase 4/5 遗留能力补完

日期：2026-03-26

## 1) 需求（Requirement）

- 按 `ROADMAP.md` 补完 Phase 8 之前未完成项，重点是 Phase 4 与 Phase 5。
- 不做最小兜底修补，需打通模块内链路并可回归验证。
- 同步更新路线图、状态与测试文档。

## 2) 讨论（Discussion）

### 本轮范围

1. Phase 4：
   - 可视化 GUI 配置面板；
   - 拖拽应用样式。
2. Phase 5：
   - WYSIWYG 画布区域；
   - 调整手柄。

### 本轮不做

1. Phase 3 `interaction_type → 动态事件绑定`（仍按 ROADMAP 归入 Phase 9）。
2. 新数据模型重构（对象/数组渲染范式），本轮仅归档需求。

## 3) 研究（Research）

- `StyleWorkshop.vue` 已有 HTML/CSS 编辑与预览，但缺少“选择器级可视化编辑”和“拖拽写回条目样式”链路。
- `LayoutComposer.vue` 已有结构树与预览，但预览是只读，不支持“点选联动”和“拖拽调整尺寸”。
- 数据层中：
  - `definitions-store.ts` 可读写 `DefinitionEntry.uiType`；
  - `layouts-store.ts` 已具备节点宽高字段，可直接承载手柄调整结果。

## 4) 规划（Planning）

- [x] 样式工坊：新增可视化配置页签
- [x] 样式工坊：预览点击选中选择器并可编辑常用 CSS 属性
- [x] 样式工坊：左侧样式支持拖拽到预览，写回定义 `uiType`
- [x] 布局编排器：预览区节点可点击选中并反向同步到属性面板
- [x] 布局编排器：新增调整手柄，拖拽写回节点 `width/height`
- [x] 回归验证：针对变更文件 lint + `pnpm build:dev`
- [x] 文档同步：ROADMAP/STATE/TESTING/REQUIREMENTS-RAW

## 5) 执行（Execution）

### 代码变更

1. `manager/modules/StyleWorkshop.vue`
   - 新增样式单元拖拽起点（内置/自定义列表项 `draggable`）。
   - 新增“可视化配置”页签，支持：
     - 预览点击选择器捕获；
     - 字号、颜色、背景、圆角、padding、gap 编辑并回写 CSS 文本。
   - 新增预览区 drop 行为：把拖入样式写回某条定义的 `uiType`，并立即持久化。
   - 修正 `wrapPlaceholder` 的无效转义写法。

2. `manager/modules/LayoutComposer.vue`
   - 预览区改为可交互：点击节点可选中（WYSIWYG 联动结构树/属性面板）。
   - 渲染预览节点时注入 `data-node-id` 与选中态样式。
   - 为选中节点渲染右下角调整手柄，支持鼠标拖拽实时更新 `width/height`。
   - 预览渲染支持叠加 `customCss`，确保“改即见效”。

### 文档变更

1. `docs/ROADMAP.md`
   - 勾选：
     - Phase 4：可视化 GUI 配置面板、拖拽应用样式；
     - Phase 5：WYSIWYG 画布区域、调整手柄。

2. `docs/STATE.md`
   - 追加本轮结论，标记 Phase 4/5 遗留补完。

3. `docs/TESTING.md`
   - 补充 Phase 4/5 对应新能力的可复现步骤。

4. `docs/REQUIREMENTS-RAW.md`
   - 归档 2026-03-26 用户新增补充需求原文。

## 6) 验证（Validation）

执行结果：

1. `pnpm eslint "src/通用状态栏框架脚本/manager/modules/StyleWorkshop.vue" "src/通用状态栏框架脚本/manager/modules/LayoutComposer.vue"`：无 error（仅既有 warning）。
2. `pnpm build:dev`：通过（webpack 多入口 `compiled successfully`）。

说明：

- 仓库当前全量 `pnpm lint` 基线含与本次任务无关的既有错误（如 `tavern_sync.mjs` 等），本次未越权清理。

## 7) 结论

- Phase 8 之前在 ROADMAP 中剩余的 Phase 4/5 未完成项已在代码层补齐并完成构建验证。
- 后续建议进入新增需求的“讨论→研究→规划”阶段，重点优先“对象/数组渲染能力”和“共享/角色数据第一层模型重构”。
