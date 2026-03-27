---
name: sillytavern-ui-validation
description:
  使用外部 Chrome + chrome-devtools-mcp 完成状态栏管理器 UI
  回归（连接、入口、五模块、系统配置子模块、桌面与移动双端）并输出截图证据。凡是 UI
  回归、入口失效、热更新确认、模块可达性排查，都必须优先使用本 Skill。
user-invocable: true
argument-hint: '[目标地址，可选，默认 http://localhost:8000] [验证范围，可选]'
---

# SillyTavern UI Validation

本 Skill 目标是独立完成“连接 -> 验证 -> 证据 -> 结论”，且结论完全由截图支撑。

## 触发条件

以下任一请求必须触发：

- UI 回归
- 管理器入口失效排查
- 五模块可达性验证
- 热更新后可用性确认

## 强制原则

- 优先使用 `chrome-devtools-mcp`，不要先走批量脚本化自动点击。
- 结论以截图为准，代码仅做辅助解释。
- 证据只放 `session-state`，禁止写入仓库目录。
- 每一步一个动作，动作前后都要可对照。

## 标准流程

1. 启动构建监听：`pnpm watch`。
2. 连接外部 Chrome（优先 `127.0.0.1:9222`）。
3. 打开页面后确认：`#extensions_settings`、`#extensionsMenu`、实时监听开关。
4. 验证两个入口：`状态栏管理器` 与 `打开管理器`。
5. 逐个验证五模块：
   - 数据中心
   - 数据工作室
   - 样式工坊
   - 布局编排器
   - 系统配置
6. 系统配置子模块逐个验证：
   - 原始数据
   - 主题组合
   - 叙事快照
   - 备份与迁移
   - 使用指南
7. 视口覆盖：桌面 + 移动（360x780）。
8. 输出截图与 JSON 结果。

模块标签定义：

- 指“状态栏管理器”窗口左侧导航中的五个模块入口（数据中心、数据工作室、样式工坊、布局编排器、系统配置）。
- 若左侧导航可见且模块名可读，不得判定为“模块标签不可见”。

若第 4 步后仍未看到五模块标签，执行一次回退检测：

1. 同时尝试两种入口：`状态栏管理器` 与 `打开管理器`。
2. 同时检索中英文模块名（中文与 Data Center / Data Studio / Style Workshop / Layout Composer / System Config）。
3. 若仍不可见，直接判定为阻塞，不继续“假点击”流程。

## 证据规范

- 每个模块至少两张图：`before` 和 `after`。
- 命名包含模块、阶段、端类型。
- 推荐样例：
  - `01-data-center-before-desktop.png`
  - `01-data-center-after-desktop.png`
  - `01-data-center-before-mobile.png`
  - `01-data-center-after-mobile.png`

## 阻塞处理

不能点击或不能进入后续模块时，不得跳过：

1. 保留该步骤 before/after。
2. 标记阻塞点。
3. 输出“可达范围内已完成项 + 未完成项 + 下一步最小动作”。

## 输出模板

```md
### UI 验证结果

- 页面是否可打开:
- 管理器入口是否可见:
- 五模块是否可见并可切换:
- 系统配置子模块是否可达:
- 是否发现 UI 污染:
- 截图路径(session-state):
- JSON 结果路径(session-state):
- 阻塞点(如有):
```

## 参考文件索引

- 外部 Chrome 连接与排障：`references/chrome-connect-playbook.md`
- 结果文件示例：`references/result-json-template.md`
- 模块可见性回退检测：`references/module-visibility-fallback.md`
- 历史经验归档：`references/legacy-ui-validation-notes.md`
- 仓库 JSON 快速导入：`../sillytavern-submodule-ux-validation/references/repo-json-fast-import.md`
