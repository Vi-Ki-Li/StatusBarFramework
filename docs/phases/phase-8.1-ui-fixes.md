# Phase 8.1（批次 A）：UI 修复与测试补齐

## 1) 需求（Requirement）

- 修复扩展菜单入口按钮丢失（`#extensionsMenu`）问题。
- 收集并修复一批比例/布局问题，优先管理器可用性和响应式。
- 补齐 Phase 4-8 的可复现测试与回归步骤。
- 先完善 subagent/custom agent 协作方案。

## 2) 讨论（Discussion）

### 本批范围

- 在不改动核心业务逻辑前提下，先解决“入口可用 + 管理器布局稳定 + 测试可复现”。
- 将 subagent 配置落地到仓库，便于后续会话复用。

### 不在本批

- 不推进 Phase 9 高级功能开发。
- 不处理与本次目标无关的历史 lint 存量问题。

## 3) 研究（Research）

- 入口按钮仅使用 `#extensionsMenu` 单选择器，存在版本差异与异步渲染风险。
- 管理器样式在部分窗口下比例偏紧，侧边栏固定宽度影响可读性。
- `TESTING.md` 的 Phase 4-8 缺少明确前置条件与期望结果。

## 4) 规划（Planning）

- [x] 入口按钮改为“多容器选择器 + 延迟重试 + DOM 监听”
- [x] 管理器比例与响应式参数优化
- [x] 新增 custom agents（协调/研究/执行/测试/审阅）
- [x] 补齐 `docs/TESTING.md` Phase 4-8 可复现测试
- [x] 按 VS Code Agent Skills 规范落地项目 skill（`.github/skills/.../SKILL.md`）
- [ ] 在真实酒馆页面完成一轮人工确认（待用户侧验证）

## 5) 执行（Execution）

已修改：

- `src/通用状态栏框架脚本/index.ts`
  - 新增扩展菜单入口重试与监听机制；
  - 支持多个菜单容器选择器；
  - 清理流程中增加 observer/timer 回收。
- `src/通用状态栏框架脚本/styles/manager.css`
  - 调整管理器宽高比例；
  - 侧边栏宽度改为 `clamp`；
  - 补充中间断点与移动端高度策略优化。
- `.github/agents/*.agent.md`
  - 新增 coordinator / researcher / ui-fixer / test-writer / reviewer 五个 agent。
- `docs/TESTING.md`
  - 重写 Phase 4-8，补齐前置条件、步骤、期望结果。
- `.github/skills/sillytavern-ui-validation/SKILL.md`
  - 按官方技能规范新增可复用 skill（frontmatter + 使用时机 + 外部 Chrome 验证流程）。
- `src/通用状态栏框架脚本/styles/base.css`
  - 修复潜在页面污染根因：将全局 reset 从 `*` 改为限定在 `.omg-root` 命名空间内。

## 6) 验证（Validation）

- 基线：`pnpm lint` 存在历史存量错误（非本次引入）。
- 本批重点验证：执行 `pnpm build`，确保改动可构建。
- 手工验证建议：
  1. 扩展菜单入口 + 脚本按钮入口都可打开管理器；
  2. 小屏/中屏下管理器布局无明显断裂；
  3. 按 `docs/TESTING.md` Phase 4-8 回归流程执行。

### 6.1 实际自动化测试记录（2026-03-19）

本轮按“先自动化再手工补充”执行了真实页面探测与截图，结果如下：

- 目标地址：`http://localhost:8000/`
- 页面状态：持续停留在加载齿轮（无正文 UI）
- 自动化脚本结论：
  - 未发现“状态栏管理器 / 打开管理器”入口按钮
  - 管理器 iframe 未出现（`.omg-root` 不存在）
  - 数据注入接口在页面上下文不可用（未暴露）
- 控制台/网络错误（关键）：
  - 多次 `500 (Internal Server Error)`
  - 多次 `ERR_CONNECTION_REFUSED` / `ERR_CONNECTION_RESET`
  - 页面错误 `Failed to fetch`

证据文件：

- `C:/Users/Viki Li/.copilot/session-state/f5337e11-f028-4ae5-bfa2-6287b0cdd532/files/ui-test-screenshots/01-home.png`
- `C:/Users/Viki Li/.copilot/session-state/f5337e11-f028-4ae5-bfa2-6287b0cdd532/files/ui-test-screenshots/02-after-open-attempt.png`
- `C:/Users/Viki Li/.copilot/session-state/f5337e11-f028-4ae5-bfa2-6287b0cdd532/files/ui-test-screenshots/03-loading-diagnostic.png`
- `C:/Users/Viki Li/.copilot/session-state/f5337e11-f028-4ae5-bfa2-6287b0cdd532/files/ui-test-results.json`
- `C:/Users/Viki Li/.copilot/session-state/f5337e11-f028-4ae5-bfa2-6287b0cdd532/files/ui-loading-diagnostic.json`

结论：

- 当前阻塞点优先级高于 UI 细节问题：需要先恢复酒馆后端/API 的稳定可用状态，再继续五模块可用性回归。
- 一旦页面不再卡 loading，本轮自动化脚本可直接复跑并补齐五模块截图与问题清单。

### 6.2 外部 Chrome 二次复测（2026-03-20）

按 `.vscode/launch.json` 的 `http://localhost:8000` 目标地址，用外部 Chrome 通道（Playwright `channel: 'chrome'`）再次执行自动化探测。

- 页面可打开：是
- 入口探测：
  - `#extensions_settings` 存在
  - `#extensionsMenu` 存在
  - 未发现“状态栏管理器/打开管理器”按钮
- 五模块可见性：均未探测到（管理器未打开）
  - 数据中心 / 数据工作室 / 样式工坊 / 布局编排器 / 系统配置：`false`
- UI 污染诊断：
  - 本轮页面 `style` 统计未发现 `.omg-*` 样式注入，说明目标脚本尚未在当前页面生效；
  - 代码层面已修复可疑污染源（`base.css` 全局 reset 改为 `.omg-root` 作用域）。

证据文件（本会话）：

- `C:/Users/Viki Li/.copilot/session-state/47bc60ae-8645-4253-892e-adeeb2aefb9d/files/ui-test-screenshots/01-home.png`
- `C:/Users/Viki Li/.copilot/session-state/47bc60ae-8645-4253-892e-adeeb2aefb9d/files/ui-test-screenshots/02-after-open-attempt.png`
- `C:/Users/Viki Li/.copilot/session-state/47bc60ae-8645-4253-892e-adeeb2aefb9d/files/ui-test-screenshots/03-module-probe.png`
- `C:/Users/Viki Li/.copilot/session-state/47bc60ae-8645-4253-892e-adeeb2aefb9d/files/ui-test-screenshots/ui-test-results.json`

结论（本轮）：

- 当前主要阻塞不是模块逻辑，而是“脚本未在目标页面生效/未注入入口按钮”；
- 已同步完成一项防回归修复：避免脚本样式对酒馆主页面产生全局 reset 污染；
- 待脚本实际加载生效后，按同一 skill 流程可直接复跑五模块验证并补全通过截图。
