# 架构设计总览

> 本文档描述“通用状态栏框架脚本”的当前架构。  
> 详细阶段执行记录见 `docs/phases/`，当前状态见 `docs/STATE.md`。

## 1. 目标

- 在 SillyTavern 聊天界面渲染可定制状态栏
- 提供管理器浮窗（数据中心、数据工作室、样式工坊、布局编排器、系统配置）
- 支持 JSON 数据、JSON Patch 更新、MVU 兼容接入
- 通过 IndexedDB + 酒馆变量实现配置与聊天数据分层存储

## 2. 分层架构

### 2.1 脚本运行层

- 入口：`src/通用状态栏框架脚本/index.ts`
- 能力：
  - 单例所有权与热重载清理（`core/singleton.ts`）
  - 安全模式快捷键（`core/safe-mode.ts`）
  - 按钮注册到 `#extensionsMenu`
  - 初始化管理器壳与状态栏渲染

### 2.2 管理器 UI 层（Vue）

- 根组件：`manager/App.vue`
- 模块：
  - `DataCenter.vue`
  - `DataStudio.vue`
  - `StyleWorkshop.vue`
  - `LayoutComposer.vue`
  - `SystemConfig.vue`
- 交互增强：
  - 模块深度链接：`manager/navigation.ts`
  - 帮助提示组件：`components/base/OmgHelpTip.vue`

### 2.3 渲染层

- 状态栏渲染器：`renderer/status-bar.ts`
- 模板引擎：`renderer/template-engine.ts`
- 样式单元：`renderer/style-units.ts`

### 2.4 数据层

- 核心类型：`data/types.ts`
- JSON Patch：`data/json-patch.ts`
- 合并逻辑：`data/merge.ts`
- 存储与变量：
  - IndexedDB：`core/storage.ts`
  - 酒馆变量封装：`data/variables.ts`
  - 定义/样式/布局/主题/叙事仓库：`data/*-store.ts`

## 3. 存储分工

- IndexedDB：定义、样式、布局、主题组合、叙事模板
- 聊天变量：框架状态（角色数据、共享数据、角色映射）
- 消息变量：楼层快照
- 脚本变量：少量系统开关配置

## 4. 当前能力边界

已完成：
- Phase 0-8 主干功能

未完成：
- Phase 8 的“世界书条目管理”子项
- Phase 9-10（高级交互、关系图谱、性能与产品化打磨）

## 5. 文档协作约定（新会话必读）

采用固定工作流：**需求 → 讨论 → 研究 → 规划 → 执行 → 验证**  
每个阶段必须同步更新：

- `docs/STATE.md`：当前快照（不是长历史）
- `docs/phases/phase-N-*.md`：阶段详情与执行记录
- `docs/DECISIONS.md`：新增/变更决策
- `docs/TESTING.md`：新增功能对应测试步骤
