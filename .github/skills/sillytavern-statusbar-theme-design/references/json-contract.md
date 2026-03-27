# JSON Contract

Use these as strict shape baselines for importable payloads.

## Definitions

Top-level keys:

- `version`
- `categories[]`
- `entries[]`

Required fields:

- category: `id`, `name`, `scope`, `order`, `icon?`
- entry: `id`, `key`, `name`, `categoryId`, `icon`, `dataType`, `validation`, `uiType`, `interactionType`, `description`, `updateSample`, `order`

## Styles

Top-level keys:

- `version`
- `units[]`
- `globalTheme?`

Required fields for each `unit`:

- `id`, `name`, `template`, `css`, `description`, `builtin`, `createdAt`, `updatedAt`

## Layouts

Top-level keys:

- `version`
- `layouts[]`

Each layout requires:

- `id`, `name`, `root`, `createdAt`, `updatedAt`

Node rules:

- `type`: `container` or `item`
- container mode: `flex-row`, `flex-col`, `grid`, `absolute`, `custom`
- item must have `definitionId`

## Themes

Top-level keys:

- `version`
- `themes[]`

Each theme requires:

- `id`, `name`, `description`, `entryIds`, `styleOverrides`, `layoutId`, `createdAt`, `updatedAt`

## Narratives

Top-level keys:

- `version`
- `templates[]`

Each template requires:

- `id`, `name`, `sharedTemplate`, `characterTemplate`, `userTemplate`, `userModifiedTemplate`, `stylePrompt`, `createdAt`, `updatedAt`

## Full Export

Top-level keys:

- `_omg_export: true`
- `version`
- `timestamp`
- `definitions`
- `styles`
- `layouts`
- `themes`
- `narratives`

## Cross-reference constraints

- `theme.entryIds` must exist in `definitions.entries.id`.
- `theme.styleOverrides` keys must be in same theme `entryIds`.
- every `layout item.definitionId` must exist in `definitions.entries.id`.
- IDs inside each module must be unique.
