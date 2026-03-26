---
name: sillytavern-ui-validation
description:
  使用外部 Chrome 对本项目进行酒馆页面连接、五模块可用性验证、截图留证与结果归档。适用于 UI
  回归、入口失效排查、热更新确认。
user-invocable: true
argument-hint: '[目标地址，可选，默认 http://localhost:8000] [验证范围，可选]'
---

# SillyTavern UI Validation

此 skill 用于标准化执行“连接酒馆 → 打开管理器 → 验证五模块 → 截图与记录”的流程，优先使用外部 Chrome。

## 何时使用

- 需要验证“状态栏管理器 / 打开管理器”入口是否可用
- 需要回归五模块（数据中心、数据工作室、样式工坊、布局编排器、系统配置）
- 需要留存可复现证据（截图 + JSON 结果）
- 需要排查脚本注入后的 UI 污染问题

## 标准流程

1. 启动代码实时构建：

```powershell
pnpm watch
```

2. 使用外部 Chrome 连接酒馆页面（参考 `.vscode/launch.json`）：

- 推荐配置名：`编译代码并调试酒馆网页 (Chrome)` 或 `仅调试酒馆网页 (Chrome)`
- 默认地址：`http://localhost:8000`

3. **优先使用 `chrome-devtools-mcp`** 连接当前浏览器实例进行页面检查与交互测试（不要优先 Playwright 脚本化批量操作）。

4. 在 `chrome-devtools-mcp` 下按“逐模块、逐动作、逐截图”执行。

### MCP 端口优先级（重要）

若浏览器“Remote debugging”设置页显示：

`Server running at: 127.0.0.1:<动态端口>`

则优先使用该**动态端口**（例如 `63066`），不要强行改回 `9222`。连通性检查应优先看 TCP 端口是否打开；`/json/version`
在该端口可能是 `404`，不等于不可用。

（现在看有可能动态端口有问题，最好固定 9222 启动）

### 固定 9222 启动（推荐兜底）

如果动态端口不稳定，优先用固定 9222（Windows）：

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug"
```

验证标准：

- `127.0.0.1:9222` 监听中；
- `http://127.0.0.1:9222/json/version` 返回 `200`；
- CDP 客户端可连接并看到页面（如 `http://localhost:8000/`）。

### 外部 Chrome 无法被 MCP 连接时（关键排障）

如果出现“页面没真正打开/一直 loading/酒馆后台没反应”，优先执行下面的**独立 Chrome 调试实例**流程：

```powershell
# 1) 关闭现有 Chrome（避免已有实例吞掉参数）
$pids=(Get-Process chrome -ErrorAction SilentlyContinue).Id
if ($pids) { Stop-Process -Id $pids -Force }

# 2) 用独立用户目录启动外部 Chrome + 远程调试
$chromePath='C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chromePath)) { $chromePath="$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" }
$profile='C:\temp\chrome-mcp-profile'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
Start-Process -FilePath $chromePath -ArgumentList "--user-data-dir=$profile --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --remote-allow-origins=* --new-window http://localhost:8000"

# 3) 验证 DevTools 端口可用（200 才算成功）
Invoke-WebRequest -Uri 'http://127.0.0.1:9222/json/version' -UseBasicParsing
```

成功标志：

- `http://localhost:8000` 可访问；
- `http://127.0.0.1:9222/json/version` 返回 `200` 且包含 `webSocketDebuggerUrl`；
- 此时再使用 `chrome-devtools-mcp` 接管页面。

5. 在酒馆页面确认基础条件：

- `#extensions_settings` 存在
- `#extensionsMenu` 存在
- `酒馆助手-实时监听-允许监听` 开关已启用

6. 验证管理器入口：

- 扩展菜单入口：`状态栏管理器`
- 脚本按钮入口：`打开管理器`

7. 验证五模块标签是否可见并可切换：

- 数据中心
- 数据工作室
- 样式工坊
- 布局编排器
- 系统配置

8. 输出证据到 session-state：

- `01-home.png`
- `02-after-open-attempt.png`
- `03-module-probe.png` ……
- `ui-test-results.json`

### 证据存储位置（强制）

- 截图和测试 JSON 只允许放在 `session-state`。
- 禁止将截图写入仓库目录（例如 `docs/artifacts/`）。
- 若仓库中出现测试截图，必须在提交前清理。

## 截图优先原则（新增）

- 结论以截图为准，不以“代码里有/理论上可见”替代真实可见性。
- 每个模块必须有“操作前/操作后”两张图。
- 命名必须体现模块与阶段，避免重复覆盖：
  - `01-data-center-before-desktop.png`
  - `01-data-center-after-desktop.png`
  - `01-data-center-before-mobile.png`
  - `01-data-center-after-mobile.png`

## 操作方式约束（新增）

- 优先逐个点击（manual-like），不要一次性批量脚本跳转所有模块。
- 每次只做一个动作（输入或点击），立刻截图，避免“看起来像重复图”。
- 视口应贴近用户设备，不要默认超大屏：
  - 桌面：优先使用人工可操作尺寸（推荐 `1366x640`；小屏可用 `1280x600`），避免底部按钮超出可点击区域；
  - 移动：使用真实小屏（如 360x780）并保留顶部/底部占位影响。

## 五模块强制执行清单（新增）

- 连接方式必须优先 `chrome-devtools-mcp`，目标外部 Chrome 优先 `127.0.0.1:9222`。
- 页面初次打开后出现数秒齿轮图标属正常加载态，需先截图留证，再进入后续步骤。
- 五模块必须按顺序逐个点击并截图：
  - 数据中心
  - 数据工作室
  - 样式工坊
  - 布局编排器
  - 系统配置
- 系统配置必须覆盖子模块并逐个点击：
  - 原始数据
  - 主题组合
  - 叙事快照
  - 备份与迁移
  - 使用指南
- 每次点击必须严格有两张图：`before` 和 `after`，结论只允许基于截图给出。
- 输出必须同时覆盖桌面与移动端：
  - 桌面：先读取当前窗口尺寸后执行；
  - 移动：切换到 `360x780` 再完整执行同样流程。

## 阻塞场景处理（新增）

- 若某一步点击无效或模块无法打开，不得跳过，必须保留该步 `before/after` 证据图。
- 对“无法进入后续模块”的情况，按“可达范围内全部完成 + 阻塞点单独标注”输出。
- 阻塞结论同样仅基于截图，不得用“推测代码逻辑”代替。

## 仓库 JSON 快速导入（复测提速）

- 当你需要反复复现同一测试场景时，优先使用“快速导入”而非每次手工点导入。
- 推荐顺序：
  - 文件输入控件直传（`upload_file`）
  - 临时静态服务 + 页面 `fetch`
  - 直接写 IndexedDB（兜底）
- 详细操作与脚本请复用：`../sillytavern-submodule-ux-validation/references/repo-json-fast-import.md`。

## 污染排查检查项

- 禁止全局 reset（如 `*`, `*::before`, `*::after`）直接作用酒馆页面
- 框架样式应限定在 `.omg-root` 或 `.omg-*` 命名空间
- 管理器样式应在 iframe 内隔离，避免影响宿主页面

## 结果记录模板

```md
### UI 验证结果

- 页面是否可打开:
- 管理器入口是否可见:
- 五模块是否可见:
- 是否发现 UI 污染:
- 截图路径:
- JSON 结果路径:
```
