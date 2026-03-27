# Module Visibility Fallback

Use this only when manager entry click succeeds but module tabs are not visible.

## Step 1: Trigger both entries once

- click `状态栏管理器`
- click `打开管理器`

Do not loop repeated clicks.

## Step 2: Detect module labels in both locales

Expected labels:

- 中文: `数据中心`, `数据工作室`, `样式工坊`, `布局编排器`, `系统配置`
- 英文: `Data Center`, `Data Studio`, `Style Workshop`, `Layout Composer`, `System Config`

## Step 3: Hard blocker condition

If no label is found after Step 1-2:

- mark blocker `module-visibility`
- classify as `场景/样式`
- stop deeper module probing

## Output requirement

Must include:

1. before/after screenshot for both entry click attempts
2. one desktop + one mobile screenshot
3. one minimal next action only
