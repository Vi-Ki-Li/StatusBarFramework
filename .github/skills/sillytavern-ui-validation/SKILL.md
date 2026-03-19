---
name: sillytavern-ui-validation
description: 使用外部 Chrome 对本项目进行酒馆页面连接、五模块可用性验证、截图留证与结果归档。适用于 UI 回归、入口失效排查、热更新确认。
user-invocable: true
argument-hint: "[目标地址，可选，默认 http://localhost:8000] [验证范围，可选]"
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

3. 在酒馆页面确认基础条件：

- `#extensions_settings` 存在
- `#extensionsMenu` 存在
- `酒馆助手-实时监听-允许监听` 开关已启用

4. 验证管理器入口：

- 扩展菜单入口：`状态栏管理器`
- 脚本按钮入口：`打开管理器`

5. 验证五模块标签是否可见并可切换：

- 数据中心
- 数据工作室
- 样式工坊
- 布局编排器
- 系统配置

6. 输出证据到 session-state：

- `01-home.png`
- `02-after-open-attempt.png`
- `03-module-probe.png`
……
- `ui-test-results.json`

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
