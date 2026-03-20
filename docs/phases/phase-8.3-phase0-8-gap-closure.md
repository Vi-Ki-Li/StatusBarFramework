# Phase 8.3（批次 C）：Phase 0-8 遗留项补全（非 Phase 4/5）

## 1) 需求（Requirement）

- 先进行一次基线提交，再进入“需求→讨论→研究→规划→执行→验证”循环。
- 按 `docs/ROADMAP.md` 补齐 Phase 0-8 未完成项。
- 用户将另行提出 Phase 4（样式工坊）与 Phase 5（布局编排器）需求，本轮先处理其他可完成项。
- 同步更新文档状态。

## 2) 讨论（Discussion）

### 本轮范围

- Phase 3：布局 JSON → DOM 渲染落地到状态栏运行时。
- Phase 8：补齐“世界书条目管理”可操作入口。
- 文档回填：`ROADMAP`、`STATE`、本 phase 文档。

### 本轮不做

- Phase 4：可视化 GUI 配置面板、拖拽应用样式。
- Phase 5：WYSIWYG 画布、调整手柄。

## 3) 研究（Research）

- `renderer/status-bar.ts` 仅按分类默认垂直渲染，尚未消费布局树数据。
- 布局存储与编辑能力已存在：`data/layouts-store.ts` + `manager/modules/LayoutComposer.vue`。
- 世界书注入能力已存在：`data/worldbook-inject.ts`，但系统配置缺少“管理条目启停/重注入/删除”的完整入口。
- `ui_type` 关联样式单元在数据工作室与渲染器中已实际可用，属于“已实现未勾选”。

## 4) 规划（Planning）

- [x] 基线提交（checkpoint）
- [x] 渲染器接入布局渲染
- [x] 保留回退策略（未布局条目/其他条目）
- [x] 系统配置新增“世界书条目管理”子模块
- [x] 支持世界书条目单条启停、全开全关、重注入、删除
- [x] 更新路线图与状态文档

## 5) 执行（Execution）

### 代码变更

1. 状态栏布局渲染落地
- 文件：`src/通用状态栏框架脚本/renderer/status-bar.ts`
- 新增读取：布局仓库、主题组合、系统配置。
- 新增能力：
  - 解析当前激活主题中的 `layoutId` 与 `styleOverrides`。
  - 将布局树节点（container/item）渲染为 DOM。
  - 按 `layoutMode` 生成 `flex/grid/absolute/custom` 基础样式。
  - 为未布局条目提供“未布局条目”回退分区，保证信息不丢失。
- 兼容性：若未绑定布局，仍按原分类模式渲染。

2. 状态栏布局样式补充
- 文件：`src/通用状态栏框架脚本/styles/statusbar.css`
- 新增布局相关类样式（根容器、节点、条目最小宽度与容器宽度保障）。

3. 世界书条目管理 API
- 文件：`src/通用状态栏框架脚本/data/worldbook-inject.ts`
- 新增导出与操作：
  - `WB_NAME`、`ENTRY_PREFIX`
  - `getFrameworkWorldbook`
  - `getManagedEntries`
  - `setManagedEntryEnabled`
  - `setAllManagedEntriesEnabled`

4. 系统配置子模块补齐
- 文件：`src/通用状态栏框架脚本/manager/modules/SystemConfig.vue`
- 新增子标签：`世界书条目`
- 新增功能：
  - 刷新世界书状态
  - 重新注入定义
  - 单条启停
  - 全部启用/禁用
  - 删除框架世界书

### 文档变更

- `docs/ROADMAP.md`：勾选以下已完成项
  - Phase 2: `ui_type` 关联样式工坊
  - Phase 3: 布局 JSON → DOM 渲染
  - Phase 8: 世界书条目管理
- `docs/STATE.md`：更新到 Phase 8.3 当前快照并写入本轮进展。

## 6) 验证（Validation）

- 静态检查：改动文件无诊断错误。
- 待实机验证（下一轮执行）：
  1. 在酒馆页面选择一个已绑定布局的主题，确认状态栏按布局树显示。
  2. 切换到无布局主题，确认回退到分类渲染。
  3. 在系统配置-世界书条目中执行“全关→全开→单条切换→重注入→删除”流程，确认结果与提示一致。

## 7) 结论

- 本轮已完成 Phase 0-8 遗留项中的非 Phase 4/5 部分。
- 下一轮等待用户对 Phase 4 与 Phase 5 的具体需求输入后继续推进。
