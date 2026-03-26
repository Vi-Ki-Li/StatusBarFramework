# 夹具分层约定（Workspace/Publish）

## 目标

在保持可复现、可追溯的前提下，区分“本地工作区数据”和“可发布夹具”。

## 目录约定

- 工作区层（本地）: `docs/.local-data/`
- 发布层（可入库）: `docs/test-data/public-fixtures/`

默认规则：

1. 工作区层用于本地调试与复现，不进入发布提交。
2. 发布层仅保留结构化、可共享、可复跑的夹具。
3. 复测和报告统一使用 `fixtureId`，保证跨会话可追溯。

## 公共轨最小契约

每个发布夹具目录建议包含：

1. `manifest.json`
2. `traceability.json`
3. 脱敏模块 JSON（definitions/styles/layouts/themes/narratives/full-export）

## traceability 字段约定

- `fixtureId`: 夹具唯一 ID，建议 `fx-<domain>-<yyyymmdd>-<nn>`。
- `sourceClass`: 固定枚举：`synthetic` | `sanitized`。
- `sourceDigest`: 来源摘要，不写本地绝对路径，不写个人信息。
- `coverage`: 覆盖的模块与场景（例如 tabs、折叠动画、角色切换）。
- `knownRisks`: 记录该夹具的边界与已知限制。
- `evidenceRefs`: 指向会话证据位置（仅写 session-state 索引，不入库截图）。

## 预提交守卫

当前仓库提供：

- `pnpm guard:fixtures`
- `.githooks/pre-commit`

启用一次即可：

```bash
pnpm hooks:enable
```

## 落地流程（建议）

1. 在工作区层准备本地复现夹具并调试。
2. 提炼最小发布复现：仅保留字段结构、边界值、交互触发条件。
3. 生成发布层 `manifest.json` 与 `traceability.json`。
4. 执行 `pnpm guard:fixtures` 确认提交面安全。
5. 在 phase 文档中记录 `fixtureId` 与验证结论。
