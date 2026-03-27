# Design Workflow

## Design intent

- 1 秒可定位关键值，3 秒可读完核心分组。
- 先读值，再读组，最后读风格。
- 样式服务信息，不为装饰牺牲可读性。

## Four-layer model

1. Definitions: world context, character identity, resources, state toggles.
2. Layouts: first line context, second line identity + resources, third line temporary status.
3. Styles: text units, numeric units, boolean units, summary units.
4. Themes: overview + compact variants, each with independent mapping.

## Quality gates

### Color consistency

- Max 3 primary colors + 1 accent + neutral scale.
- Same semantic state keeps same color meaning.

### Shape and hierarchy

- Radius levels limited to 2-3 grades.
- Typography scale should be stable:
- Label 11-13px
- Body 13-16px
- Emphasis 15-20px

### Group and container

- Group by semantic unit with explicit container boundaries.
- Intra-group spacing < inter-group spacing.

### Material depth

- Use 1-2 shadow levels only.
- Keep gradients subtle and readable.

### Interaction feedback

- Hover, active, selected must be visually distinct.
- Save/apply actions should have instant feedback.

## Failure patterns to avoid

- Writing `styleOverrides` before layout structure is stable.
- Renaming entry IDs after theme mapping.
- Reusing overview mappings in compact theme without remapping visual priorities.
