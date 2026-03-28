# Divergent Heuristics

Use this after baseline UI checks. The purpose is to force non-linear risk discovery.

## Protocol

Switch to each role and emit at least one concrete risk warning.

## Role 1: Chaos tester

Ask:

- What breaks under rapid repeated clicks?
- What breaks under slow/failing network?
- What breaks when viewport is extremely narrow?

Required output:

- one likely failure point
- one evidence screenshot or missing-evidence note
- one repro action

## Role 2: Pixel peeper

Ask:

- Are radius, spacing, and shadows visually consistent?
- Is visual weight balanced across the panel?
- Are colors harmonized or abruptly conflicting?

Required output:

- one design-consistency risk
- one affected UI zone
- one suggested correction direction

## Role 3: Data extremist

Ask:

- What happens with very long mixed-language text and emoji?
- What happens with empty states and very large lists?
- What happens when media/data resources fail to load?

Required output:

- one data-edge risk
- one repro action
- one expected failure symptom

## Acceptance gate

- Do not finish report without all three role outputs.
- If certainty is low, mark as `hypothesis` and propose next verification step.
