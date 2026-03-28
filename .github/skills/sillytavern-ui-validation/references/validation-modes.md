# Validation Modes

Use this file to select scope before running any UI validation.

## Mode matrix

Mode `smoke-all`:

- Goal: verify all main modules are reachable.
- Required evidence: module-level before/after screenshots.
- Not required: deep task completion.

Mode `module-deep`:

- Goal: verify one target module is truly usable.
- Required evidence: task-level before/after + save/apply + persistence recheck.
- Required tasks:
  - one success path
  - one failure path
  - one recovery/persistence check
  - two boundary stress probes (zoom/narrow viewport/rapid click/long text)

Mode `system-config-deep`:

- Goal: validate system-config submodules with real operations.
- Required evidence: each submodule has at least one real action and result.

Mode `visual-audit`:

- Goal: find visual regression and CSS defects.
- Required evidence: issue-focused screenshots + defect tags.
- Required output: three-role divergent risk warnings (chaos/design/data).

## Required input

- `mode`
- `depth` (`smoke`/`standard`/`deep`)
- `target` (required for `module-deep`)

## Gate 0 fixture rule

For `module-deep` / `system-config-deep` / `visual-audit`, import test data first:

1. Primary path: `docs/.local-data/dso-terminal-imports`
2. Fallback: repository fixture samples if primary path unavailable

If fixture import is not completed, do not mark deep validation as pass.

## Action logging cadence

After every action, append one record into result JSON `actionLogs`:

- `step`
- `action`
- `evidence`
- `result`
- `findingType`
- `note`

Do not batch all analysis at the end.

## Divergent thinking output gate

After baseline checks, append one risk line per perspective:

- `chaos-tester-risk`
- `design-director-risk`
- `data-extremist-risk`

If no reproducible issue found, still provide likely breakpoints plus one suggested repro action each.
