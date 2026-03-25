# statusbar-fixtures-minimal

用于状态栏 JSON 校验器的最小可运行夹具。

## 目录

- good/: 应全部通过的最小样例
- bad/: 应触发失败规则的样例

## 快速命令

```bash
node util/validate-statusbar-json.mjs \
  --definitions docs/test-data/statusbar-fixtures-minimal/good/definitions.json \
  --styles docs/test-data/statusbar-fixtures-minimal/good/styles.json \
  --layouts docs/test-data/statusbar-fixtures-minimal/good/layouts.json \
  --themes docs/test-data/statusbar-fixtures-minimal/good/themes.json \
  --narratives docs/test-data/statusbar-fixtures-minimal/good/narratives.json
```

```bash
node util/validate-statusbar-json.mjs \
  --full-export docs/test-data/statusbar-fixtures-minimal/bad/full-export-missing-marker.json
```
