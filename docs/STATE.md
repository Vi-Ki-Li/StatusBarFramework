# 项目进度状态

> 本文件在每次工作后更新，用于快速恢复上下文。

## 当前状态

**阶段**: Phase 6 - 数据中心 (已完成)
**最后更新**: 2026-03-17T02:00Z

## 已完成

### 2026-03-16: 项目初始化

- ✅ 需求收集与分析
- ✅ 创建文档体系 (REQUIREMENTS-RAW/REQUIREMENTS/DECISIONS/ROADMAP/STATE)
- ✅ 关键设计决策确认 (DEC-001 ~ DEC-008)

### 2026-03-16: Phase 0 — 基础设施搭建

- ✅ 脚本入口骨架 (`src/通用状态栏框架脚本/index.ts`)
- ✅ 单例所有权机制 (`core/singleton.ts`)
- ✅ 安全模式 Ctrl+Alt+Shift+R (`core/safe-mode.ts`)
- ✅ IndexedDB 存储封装 (`core/storage.ts`)
- ✅ CSS 设计令牌体系 (`styles/tokens.css` - 深浅色主题, `omg-` 前缀)
- ✅ 基础样式 (`styles/base.css` - 重置/排版/工具类)
- ✅ 管理器样式 (`styles/manager.css` - 浮窗/左侧边栏导航/响应式)
- ✅ 管理器浮窗壳 (`manager/shell.ts` + `manager/App.vue`)
- ✅ extensionsMenu + 脚本按钮注册
- ✅ 构建验证通过

### 2026-03-16: Phase 1 — 数据层核心

- ✅ 核心类型定义 (`data/types.ts` — FrameworkState, CharId, PatchOperation, FloorSnapshot 等)
- ✅ Zod 验证 Schema (`data/schemas.ts` — JSON Patch 验证, 角色信息, 状态元数据)
- ✅ 角色 ID 系统 (`data/char-id.ts` — 生成/查找/重命名/删除/在场状态)
- ✅ JSON Patch 解析器 (`data/json-patch.ts` — RFC 6902 完整实现, 从AI消息提取)
- ✅ 数据读写封装 (`data/variables.ts` — 聊天变量/消息变量/脚本变量)
- ✅ 智能合并 (`data/merge.ts` — source_id 裁决/user_modified/优先级降级/会话完整性/nil值/快照)
- ✅ MVU 兼容适配层 (`data/mvu-adapter.ts` — 自动检测/事件监听/双向同步)

### 2026-03-16: Phase 2 — 数据工作室

- ✅ 条目定义数据模型 (`data/definitions.ts` — CategoryDef, DefinitionEntry, 验证规则, 辅助函数)
- ✅ IndexedDB 存储操作 (`data/definitions-store.ts` — 分类/条目 CRUD, 导入/导出)
- ✅ 基础 Vue 组件库 (OmgButton/OmgInput/OmgSelect/OmgModal/OmgEmpty)
- ✅ 数据工作室主界面 (`manager/modules/DataStudio.vue` — 分类/条目 CRUD)
- ✅ App.vue 集成 DataStudio
- ✅ 修复 OmgModal Teleport 在 iframe 上下文中的目标错误

### 2026-03-16: Phase 3 — 状态栏渲染引擎

- ✅ 模板引擎 (`renderer/template-engine.ts` — {{placeholder}} 替换 + 内置辅助占位符)
- ✅ 样式单元系统 (`renderer/style-units.ts` — StyleUnit 接口 + 4套内置样式)
  - builtin-text: 文本（图标+标签+值）
  - builtin-progress: 进度条（图标+标签+值+条形）
  - builtin-boolean: 布尔值（图标+标签+开/关指示器）
  - builtin-badge: 徽章（垂直排列图标+值+标签）
- ✅ 状态栏渲染器 (`renderer/status-bar.ts`):
  - 从聊天变量读取 FrameworkState
  - 匹配定义条目 → 分类分组
  - 未定义数据 → "其他"回退
  - 多角色切换 (横向标签栏 + isPresent 过滤)
  - 分区折叠/展开 + 状态记忆
  - 事件驱动自动刷新 (MESSAGE_RENDERED/CHAT_CHANGED/SWIPED)
- ✅ 状态栏 CSS (`styles/statusbar.css` — 暗色玻璃拟态风格 + 内置样式单元CSS)
- ✅ teleportStyle 将 CSS 注入酒馆页面
- ✅ index.ts 集成渲染器 (initRenderer/destroyRenderer + 清理)
- ✅ 构建验证通过

### 2026-03-17: Phase 2 完善

- ✅ 图标选择器组件 (`components/base/OmgIconPicker.vue` — 搜索+网格+手动输入)
- ✅ 世界书注入功能 (`data/worldbook-inject.ts` — 定义条目→世界书)
- ✅ 测试文档 (`docs/TESTING.md`)

### 2026-03-17: Phase 4 — 样式工坊

- ✅ CSS 安全检查 (`core/css-safety.ts` — 危险规则检测: 通配符隐藏/body选择器/z-index过高等)
- ✅ 样式单元存储 (`data/styles-store.ts` — IndexedDB CRUD + 全局主题 + 导入/导出)
- ✅ 样式工坊主界面 (`manager/modules/StyleWorkshop.vue`):
  - 左侧栏: 内置样式(只读) + 自定义样式 + 全局主题
  - 代码编辑器: HTML 模板 + CSS 双标签页
  - 占位符参考面板 (标准/计算/辅助函数/数据工作室条目)
  - 实时预览 (文本/数字/布尔三种数据类型)
  - CSS 安全检查结果展示
  - 内置样式"复制为自定义" 
  - 全局主题编辑器 (CSS + HTML 模板)
  - 导入/导出
- ✅ App.vue 集成 StyleWorkshop
- ✅ 构建验证通过

### 2026-03-17: Phase 5 — 布局编排器

- ✅ 布局数据模型 (`data/layouts-store.ts`):
  - LayoutNode 树状结构 (容器/条目两种节点)
  - 布局模式: flex-row/flex-col/grid/absolute/custom
  - 树操作函数: 查找/父节点/移除/移动
  - IndexedDB CRUD + 导入/导出
- ✅ 递归树节点组件 (`manager/modules/LayoutTreeNode.vue`):
  - 展开/收起、图标、标签、布局模式标识
  - 递归渲染子节点
- ✅ 布局编排器主界面 (`manager/modules/LayoutComposer.vue`):
  - 左侧: 布局方案列表 CRUD
  - 中间: 结构树 (递归树形展示)
  - 右侧: 属性面板 (布局模式/间距/对齐/条目绑定)
  - 添加容器/添加条目功能
  - 节点移动(上下)/删除
  - 布局预览 (实时渲染)
  - JSON 直接编辑模式
  - 导入/导出
- ✅ App.vue 集成 LayoutComposer
- ✅ 构建验证通过

（无）

## 待开始

- Phase 7: 管理器整合
- Phase 8-10: 后续

## 已知问题

- 状态栏目前仅在有数据时显示（无数据时不渲染）
- 布局为简单的垂直分区，待 Phase 5 实现自定义布局

## 上下文快速恢复指南

如果你是新会话的 AI，请按顺序阅读：

1. `docs/REQUIREMENTS.md` — 了解项目需求
2. `docs/DECISIONS.md` — 了解已做的设计决策
3. `docs/ROADMAP.md` — 了解开发阶段规划
4. `docs/STATE.md` (本文件) — 了解当前进度
5. `.cursor/rules/` 下的所有 `.mdc` 文件 — 了解酒馆助手开发规则
6. `src/通用状态栏框架脚本/index.ts` — 当前代码入口
7. `src/通用状态栏框架脚本/data/` — 数据层核心代码
8. `src/通用状态栏框架脚本/renderer/` — 状态栏渲染引擎
9. `src/通用状态栏框架脚本/manager/modules/DataStudio.vue` — 数据工作室 UI
10. `src/通用状态栏框架脚本/manager/modules/StyleWorkshop.vue` — 样式工坊 UI
11. `src/通用状态栏框架脚本/core/css-safety.ts` — CSS 安全检查
12. `src/通用状态栏框架脚本/components/base/` — 基础组件库
