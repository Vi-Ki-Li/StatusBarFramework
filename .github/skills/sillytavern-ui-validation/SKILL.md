---
name: sillytavern-ui-validation
description:
  使用外部 Chrome + chrome-devtools-mcp 完成状态栏管理器 UI
  验证（可达性、单模块深测、视觉反例排查、系统配置子模块），并输出截图+即时分析证据。凡是 UI
  回归、入口失效、模块可达性、单模块真实使用验证、视觉崩坏/CSS 异常排查，都必须优先使用本 Skill。
user-invocable: true
argument-hint:
  '[目标地址，可选，默认 http://localhost:8000] [mode: smoke-all/module-deep/visual-audit/system-config-deep] [target:
  模块名，可选] [depth: smoke/standard/deep]'
---

# SillyTavern UI Validation

本 Skill 目标是独立完成“连接 -> 真实操作 -> 证据 -> 即时结论”，并避免“只截图不分析”。

默认工作心智：不是证明“页面没问题”，而是主动寻找“哪里最容易出问题”。

## 触发条件

以下任一请求必须触发：

- UI 回归
- 管理器入口失效排查
- 五模块可达性验证
- 热更新后可用性确认
- 单模块深度验证（例如只测数据工作室）
- 视觉问题排查（塌缩/重叠/滚动失效/配色突兀/对齐异常）

## 模式选择（必须先定 mode）

不要默认全量五模块。先根据用户目标选 mode：

1. `smoke-all`

- 用途：全量可达性冒烟。
- 范围：五模块 + 系统配置子模块可达。

2. `module-deep`

- 用途：单模块真实使用验证。
- 范围：仅目标模块（`target` 必填）。

3. `system-config-deep`

- 用途：仅系统配置及其子模块深测。

4. `visual-audit`

- 用途：专查视觉与 CSS 质量问题（不是功能覆盖）。

若用户未指定：

- 默认 `module-deep`，并询问或推断 `target`。
- 只有用户明确说“全量回归”才用 `smoke-all`。

## 强制原则

- 优先使用 `chrome-devtools-mcp`，不要先走批量脚本化自动点击。
- 结论以截图为准，代码仅做辅助解释。
- 证据只放 `session-state`，禁止写入仓库目录。
- 每一步一个动作，动作前后都要可对照。
- 严禁“截图一串后最后统一总结”；必须每个动作后立刻写一条分析记录。
- `evaluate script` 只能做辅助取证，不能替代真实 click/type/select。
- 完成基础检查后，必须执行“发散思考协议”，输出潜在风险而不是只报现状。

## Gate 0：测试夹具导入（深测默认必做）

当 `mode` 为 `module-deep` / `system-config-deep` / `visual-audit` 时，先完成数据基线：

1. 优先导入目录：`docs/.local-data/dso-terminal-imports`。
2. 若目录不存在或缺文件，回退到已知夹具（见快速导入参考）。
3. 导入后至少记录一次“数据已加载”的可视证据（列表、条目计数、或导入成功提示）。

未完成 Gate 0 时，不得给出“深测通过”结论。

## 执行流程（统一骨架）

1. 启动构建监听：`pnpm watch`。
2. 连接外部 Chrome（优先 `127.0.0.1:9222`）。
3. 打开页面后确认：`#extensions_settings`、`#extensionsMenu`、实时监听开关。
4. 验证两个入口：`状态栏管理器` 与 `打开管理器`。
5. 按 mode 执行任务集：

- `smoke-all`：仅做可达性，不做深操作。
- `module-deep`：目标模块最少执行 1 条成功路径 + 1 条失败路径 + 1 条持久化复查。
- `system-config-deep`：子模块逐个最小任务，不是只点开。
- `visual-audit`：按视觉反例词典逐项排查。

6. 每个动作立即产出“动作记录行”（见下文）。
7. 输出截图与 JSON 结果。

## 边界压测动作（deep 模式至少做 2 项）

当 `depth=deep` 时，从下列动作中至少执行 2 项：

1. 连续快速点击关键按钮 3-5 次，观察是否抖动、重复提交、状态错乱。
2. 浏览器缩放到 150% 或 200%，检查重叠和遮挡。
3. 将窗口压到窄宽度，检查布局断裂与横向滚动。
4. 对关键文本注入超长字符串（含 emoji/混合语言）检查截断与溢出。
5. 触发空数据态或大量数据态（可通过夹具）检查空态与性能表现。

若无法执行，必须写明阻塞原因与替代证据。

## 真实使用门槛（防止“只点开就过”）

除了 `smoke-all`，其他 mode 必须满足：

1. 至少一次真实输入或配置修改。
2. 至少一次保存/应用操作。
3. 至少一次返回后复查（重进或刷新）。

若只完成模块切换，不得标记通过。

模块标签定义：

- 指“状态栏管理器”窗口左侧导航中的五个模块入口（数据中心、数据工作室、样式工坊、布局编排器、系统配置）。
- 若左侧导航可见且模块名可读，不得判定为“模块标签不可见”。

若第 4 步后仍未看到五模块标签，执行一次回退检测：

1. 同时尝试两种入口：`状态栏管理器` 与 `打开管理器`。
2. 同时检索中英文模块名（中文与 Data Center / Data Studio / Style Workshop / Layout Composer / System Config）。
3. 若仍不可见，直接判定为阻塞，不继续“假点击”流程。

## 动作后即时分析（强制）

每个动作完成后立刻追加一条记录到 `session-state/.../ui-test-results.json` 的 `actionLogs`：

- `step`: 步骤编号
- `action`: 本次动作
- `evidence`: 截图路径
- `result`: `pass` / `fail` / `blocked`
- `findingType`: `layout` / `visual` / `interaction` / `state`
- `note`: 一句话结论

禁止先跑完整个流程再一次性补结论。

## 证据规范

- `smoke-all`：每模块至少 `before/after`。
- 深测模式：每个任务至少 `before/after`，不是每个模块两张了事。
- 命名包含模块、阶段、端类型。
- 推荐样例：
  - `01-data-center-before-desktop.png`
  - `01-data-center-after-desktop.png`
  - `01-data-center-before-mobile.png`
  - `01-data-center-after-mobile.png`

## 视觉反例排查（新增）

执行 `visual-audit` 或深测时，必须额外检查：

1. 布局与结构：塌缩、重叠、溢出遮挡、滚动失效、间距异常。
2. 样式与可读性：低对比度、配色突兀、对齐断层、截断/换行灾难。
3. 状态文本：`undefined/null/[object Object]`、加载残影、占位符泄漏。
4. 可用性补充：热区过小、焦点丢失、虚假可交互。
5. 动态问题：布局抖动、悬停残留、闪烁或突兀过渡。
6. 环境边界：缩放崩溃、安全区侵入、滚动条引起的页面位移。
7. 细节一致性：圆角冲突、阴影方向错乱、视觉重心失衡。

发现任一高影响问题，至少标记 P1；遮挡关键操作则标记 P0。

## 发散思考协议（强制）

在基础清单完成后，必须追加“破坏性假设测试”并输出三个视角各至少 1 条风险预警：

1. 混沌测试员视角

- 假设用户连续疯狂点击，是否会出现重复提交、状态错乱、闪烁。
- 假设网络慢或失败，中间态是否可理解、是否出现丑陋残留态。
- 假设窗口极窄或缩放极高，哪里最先崩。

2. 挑剔设计总监视角

- 检查圆角、间距、阴影、字号层级是否统一。
- 检查页面重心是否失衡（头重脚轻、局部过挤）。
- 检查是否存在刺眼纯色或风格撕裂。

3. 极端数据注入者视角

- 检查超长文本、混合语言、emoji 是否撑爆布局。
- 检查 0 条数据与大数据量下的空态/滚动/渲染问题。
- 检查资源失败（例如图片或数据缺失）时占位策略是否稳健。

若没有真实复现实验，也必须给出“最可能崩坏点 + 建议验证动作”，不得写“未发现风险”。

## 桌面/移动能力矩阵（防止“嘴硬通过”）

先声明本轮是否要求移动端可用：

1. 若项目当前仅支持桌面：

- 移动端只验证“能否打开管理器”。
- 不能宣称“移动端 UI 正常”。

2. 若项目要求移动端支持：

- 移动端执行同等级任务。

若移动端打不开管理器：

- 直接记为 `blocked`，并在结论中写明“不满足移动端可用性”。

## 阻塞处理

不能点击或不能进入后续模块时，不得跳过：

1. 保留该步骤 before/after。
2. 标记阻塞点。
3. 输出“可达范围内已完成项 + 未完成项 + 下一步最小动作”。
4. 未完成项统一标记 `not-run` 或 `blocked`，禁止默认 `pass`。

## 输出模板

```md
### UI 验证结果

- mode/depth/target:
- 页面是否可打开:
- 管理器入口是否可见:
- 五模块是否可见并可切换:
- 系统配置子模块是否可达:
- 真实使用任务是否完成:
- 严重缺陷(P0):
- 视觉/样式缺陷(P1/P2):
- 发散思考风险预警(3视角):
- 是否发现 UI 污染:
- 截图路径(session-state):
- JSON 结果路径(session-state):
- 阻塞点(如有):
```

## 参考文件索引

- 外部 Chrome 连接与排障：`references/chrome-connect-playbook.md`
- 结果文件示例：`references/result-json-template.md`
- 模式与深度执行说明：`references/validation-modes.md`
- 视觉反例词典：`references/visual-anti-pattern-dictionary.md`
- 发散思考与边界压测：`references/divergent-heuristics.md`
- 模块可见性回退检测：`references/module-visibility-fallback.md`
- 历史经验归档：`references/legacy-ui-validation-notes.md`
- 仓库 JSON 快速导入：`../sillytavern-submodule-ux-validation/references/repo-json-fast-import.md`
