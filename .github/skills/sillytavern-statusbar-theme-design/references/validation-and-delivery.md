# Validation And Delivery

## Required checks (R001-R018)

1. `R001_definitions_top_level`
2. `R002_definitions_entry_required_fields`
3. `R003_styles_top_level`
4. `R004_styles_unit_required_fields`
5. `R005_layouts_top_level`
6. `R006_layout_node_valid_type`
7. `R007_layout_mode_valid`
8. `R008_themes_top_level`
9. `R009_theme_required_fields`
10. `R010_narratives_top_level`
11. `R011_narrative_template_required_fields`
12. `R012_crossref_theme_entry_exists`
13. `R013_crossref_theme_style_key_in_entryIds`
14. `R014_crossref_layout_item_definition_exists`
15. `R015_system_config_keys_valid` (optional input)
16. `R016_full_export_marker` (optional input)
17. `R017_full_export_submodules_shape` (optional input)
18. `R018_id_uniqueness`

## Command templates

Validate module set:

```bash
node util/validate-statusbar-json.mjs \
  --definitions <definitions.json> \
  --styles <styles.json> \
  --layouts <layouts.json> \
  --themes <themes.json> \
  --narratives <narratives.json>
```

Validate full export:

```bash
node util/validate-statusbar-json.mjs \
  --full-export <full-export.json> \
  --system-config <system-config.json>
```

Write report:

```bash
node util/validate-statusbar-json.mjs \
  --definitions <definitions.json> \
  --styles <styles.json> \
  --layouts <layouts.json> \
  --themes <themes.json> \
  --narratives <narratives.json> \
  --report <validation-report.json>
```

## Exit code policy

- `0`: all pass
- `2`: check failures
- `1`: parameter/read error

## Mandatory delivery block

When delivering JSON, always include:

1. files list
2. validation command used
3. pass/fail summary
4. unresolved risks (if any)

If blocked, include:

1. blocker details
2. completed scope
3. exact rerun command for user
4. expected evidence file path
