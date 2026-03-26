# Phase 8.10：角色切换顺滑性与局部重绘

日期：2026-03-26

## 需求

用户反馈：切换角色时状态栏体感卡顿，不自然，疑似每次切换都触发整栏刷新。

本阶段目标：

1. 角色切换优先走局部更新，避免整栏销毁重建。
2. 增加可观测日志，能判定一次切换是否只发生一次有效提交。
3. 保持异常场景可回退，不破坏现有功能闭环。

## 讨论（范围与边界）

本轮只处理“角色切换顺滑性”主链路，不扩展到：

1. 主题/布局配置变更引发的全量刷新策略。
2. 大规模结构重构（例如完整虚拟化或模板 diff 引擎）。
3. 与角色切换无关的系统配置与数据工作室问题。

## 研究（现状与影响）

### 现状

在 [src/通用状态栏框架脚本/renderer/status-bar.ts](src/通用状态栏框架脚本/renderer/status-bar.ts) 的 tab 点击事件中，角色切换直接调用全量渲染。

该路径会执行：

1. 移除旧状态栏容器。
2. 重新构建并插入新容器。
3. 重新绑定事件。

### 风险

1. DOM 整体替换导致视觉闪动和样式重算峰值。
2. 切换过程与其他渲染事件竞争时，体感会出现“刷新态”。
3. 没有切换专用日志时，难以做稳定验收。

## 规划（任务清单）

- [x] 实现角色切换就地更新（in-place）
- [x] 保留全量渲染 fallback 兜底
- [x] 增加 switch-start/commit/end 日志
- [x] 完成构建与运行时验证
- [x] 同步 TESTING / STATE / ROADMAP 文档

## 执行（实现记录）

修改文件：

- [src/通用状态栏框架脚本/renderer/status-bar.ts](src/通用状态栏框架脚本/renderer/status-bar.ts)

关键实现：

1. 新增 in-place 切换函数 `renderActiveCharacterInPlace($scope)`：
   - 复用当前状态生成下一帧 HTML；
   - 仅替换 `.omg-sb__tabs` 与 `.omg-sb__content`；
   - 保留外层状态栏根节点；
   - 替换后在同一容器上重绑事件。

2. 新增切换编排函数 `switchCharacter($scope, nextCharId)`：
   - 记录 `switch-start`；
   - 优先尝试 in-place 提交并记录 `switch-commit(mode=in-place)`；
   - 若失败则 fallback 到 `renderStatusBar()` 并记录 `mode=full-render-fallback`；
   - 最终记录 `switch-end`。

3. tab 点击事件改为调用 `switchCharacter(...)`，替代“直接全量渲染”。

## 验证（构建 + 运行时）

### 构建验证

执行 `pnpm build:dev`，webpack 多入口均 `compiled successfully`。

### 运行时验证

在目标页面执行角色切换探针，得到结果：

1. 切换前基线：`tabCount=2`、`domNodes=157`。
2. 点击切换后：`sameRootNode=true`（状态栏根节点未替换）。
3. 激活角色成功变更：`activeCharId=char_yuki`。
4. 控制台日志出现：
   - `switch-start`
   - `switch-commit`
   - `switch-end`

结论：本阶段目标达成，角色切换已从“整栏重建”收敛为“优先局部更新”。

### 运行时复测（追加子任务）

按“连续切换 + 指标留证”执行 8 次角色切换复测，结果如下：

1. 基线稳定：`tabCount=2`、`domNodes=157`、状态栏根节点数量 `rootCount=1`。
2. 连续切换 8 次中，每次均为 `sameRootNode=true`，且 `domNodesDelta=0`。
3. 字段留证（控制台日志）完整：
   - `switch-start`: 8 次
   - `switch-commit`: 8 次
   - `switch-end`: 8 次
   - `tabCount`: 2（切换前后一致）
   - `domNodes`: 157（切换前后一致）

补充观测（卡顿信号排查）：

1. 追加采样了一轮帧耗时与 Long Task。
2. 采样值：`frameAvg=29.64ms`、`frameMax=29.64ms`、`longTaskCount=200`。
3. 由于当前酒馆页面同时有多扩展并发脚本活动，该 Long Task 统计为页面总量，不能直接等价为“仅由角色切换导致”。

## 已知限制

1. in-place 仍是“内容块替换”粒度，不是条目级 diff；极端复杂布局下仍可能有轻微重排感。
2. 若容器结构异常导致 in-place 失败，会自动 fallback 到全量渲染（功能优先，不中断交互）。
3. 当前帧耗时与 Long Task 采样是“整页噪声环境”结果，缺少仅针对角色切换函数的隔离观测（例如独立 trace 或最小插件集环境）。

## 下一步建议

1. 在 phase-8.11 增加“角色切换连续压测”与帧耗时采样。
2. 继续细化为条目级最小差异更新，进一步降低样式重算抖动。
