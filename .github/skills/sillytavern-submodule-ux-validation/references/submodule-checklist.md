# Submodule Checklist

Use this checklist for each submodule in desktop and mobile.

## A. Before action

- Target chat aligned
- Target theme combo aligned
- Target layout aligned
- Baseline stats recorded (`tabCount`, `groupCount`, `domNodes`)
- Fixture imported (primary: `docs/.local-data/dso-terminal-imports`)

## B. Click path

1. Open submodule (before/after)
2. Complete minimum task
3. Verify success feedback
4. Execute failure path and capture prompt quality
5. Re-enter submodule to confirm persistence

## C. Script path

1. Import or script-assisted operation to reach same result
2. Verify resulting UI state matches click path expectation
3. Capture before/after screenshot

Note: script path cannot replace click path conclusion.

## D. Stability and persistence

- Back to list and re-enter
- Check saved state persistence
- If relevant, refresh and recheck

## E. Visual baseline checks

- No overlap/clipping on critical controls
- Scroll works where content exceeds container
- No obvious alignment fracture or text overflow breakage
- No raw placeholder text (`undefined`, `null`, `[object Object]`)

## F. Output gate

- At least one `after` screenshot per action
- Problem severity assigned for each finding
- If blocked, include one minimal next action only
- Each action has one-line analysis (do not batch at the end)
