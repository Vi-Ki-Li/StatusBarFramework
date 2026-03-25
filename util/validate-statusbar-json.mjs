#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const BUILTIN_STYLE_IDS = new Set(['builtin-text', 'builtin-progress', 'builtin-boolean', 'builtin-badge']);

const LAYOUT_MODES = new Set(['flex-row', 'flex-col', 'grid', 'absolute', 'custom']);
const NODE_TYPES = new Set(['container', 'item']);
const DATA_TYPES = new Set(['text', 'number', 'boolean']);
const INTERACTION_TYPES = new Set(['none', 'click', 'toggle', 'input', 'custom']);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function printUsage() {
  const lines = [
    'Usage:',
    '  node util/validate-statusbar-json.mjs --definitions defs.json --styles styles.json --layouts layouts.json --themes themes.json --narratives narr.json',
    '  node util/validate-statusbar-json.mjs --full-export full-export.json [--system-config system-config.json]',
    '',
    'Options:',
    '  --definitions <path>     Definitions JSON file',
    '  --styles <path>          Styles JSON file',
    '  --layouts <path>         Layouts JSON file',
    '  --themes <path>          Themes JSON file',
    '  --narratives <path>      Narratives JSON file',
    '  --full-export <path>     Full export JSON file (_omg_export)',
    '  --system-config <path>   System config JSON file',
    '  --report <path>          Output report JSON path',
    '  --help                   Show this help',
  ];
  console.log(lines.join('\n'));
}

function readJson(filePath) {
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, 'utf8');
  return JSON.parse(raw);
}

function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasFields(obj, fields) {
  if (!isObject(obj)) return false;
  return fields.every(f => Object.prototype.hasOwnProperty.call(obj, f));
}

function createChecker() {
  const checks = [];

  function add(ruleId, passed, evidence) {
    checks.push({ ruleId, passed: Boolean(passed), evidence });
  }

  function summary() {
    const total = checks.length;
    const failed = checks.filter(c => !c.passed).length;
    const passed = total - failed;
    return { total, passed, failed };
  }

  return { add, checks, summary };
}

function traverseLayoutNodes(root, visit) {
  if (!isObject(root)) return;
  visit(root);
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      traverseLayoutNodes(child, visit);
    }
  }
}

function validateModules(input) {
  const checker = createChecker();

  const definitions = input.definitions;
  const styles = input.styles;
  const layouts = input.layouts;
  const themes = input.themes;
  const narratives = input.narratives;
  const fullExport = input.fullExport;
  const systemConfig = input.systemConfig;

  const definitionsEntries = Array.isArray(definitions?.entries) ? definitions.entries : [];
  const stylesUnits = Array.isArray(styles?.units) ? styles.units : [];
  const layoutsList = Array.isArray(layouts?.layouts) ? layouts.layouts : [];
  const themesList = Array.isArray(themes?.themes) ? themes.themes : [];
  const narrativeTemplates = Array.isArray(narratives?.templates) ? narratives.templates : [];

  const entryIds = new Set(definitionsEntries.map(e => e?.id).filter(Boolean));
  const styleIds = new Set([...BUILTIN_STYLE_IDS, ...stylesUnits.map(u => u?.id).filter(Boolean)]);

  checker.add(
    'R001_definitions_top_level',
    Number.isInteger(definitions?.version) &&
      Array.isArray(definitions?.categories) &&
      Array.isArray(definitions?.entries),
    'definitions.version 存在且 categories/entries 为数组',
  );

  const defEntryFields = [
    'id',
    'key',
    'name',
    'categoryId',
    'icon',
    'dataType',
    'validation',
    'uiType',
    'interactionType',
    'order',
  ];

  const badDefEntries = definitionsEntries.filter(
    e =>
      !hasFields(e, defEntryFields) ||
      !DATA_TYPES.has(e.dataType) ||
      !INTERACTION_TYPES.has(e.interactionType) ||
      !isObject(e.validation),
  );
  checker.add(
    'R002_definitions_entry_required_fields',
    badDefEntries.length === 0,
    badDefEntries.length === 0
      ? `definitions.entries 共 ${definitionsEntries.length} 条，字段与枚举合法`
      : `存在 ${badDefEntries.length} 条 entry 字段缺失或枚举非法`,
  );

  checker.add(
    'R003_styles_top_level',
    Number.isInteger(styles?.version) && Array.isArray(styles?.units),
    'styles.version 存在且 units 为数组',
  );

  const styleUnitFields = ['id', 'name', 'template', 'css', 'description', 'builtin', 'createdAt', 'updatedAt'];
  const badStyleUnits = stylesUnits.filter(u => !hasFields(u, styleUnitFields));
  checker.add(
    'R004_styles_unit_required_fields',
    badStyleUnits.length === 0,
    badStyleUnits.length === 0
      ? `styles.units 共 ${stylesUnits.length} 条，字段完整`
      : `存在 ${badStyleUnits.length} 条 unit 字段缺失`,
  );

  checker.add(
    'R005_layouts_top_level',
    Number.isInteger(layouts?.version) && Array.isArray(layouts?.layouts),
    'layouts.version 存在且 layouts 为数组',
  );

  const badNodeTypes = [];
  const badLayoutModes = [];
  const allLayoutItemDefinitionIds = [];
  for (const layout of layoutsList) {
    traverseLayoutNodes(layout?.root, node => {
      if (!NODE_TYPES.has(node.type)) {
        badNodeTypes.push(node.id || '(unknown-node)');
      }
      if (node.type === 'container' && node.layoutMode !== undefined && !LAYOUT_MODES.has(node.layoutMode)) {
        badLayoutModes.push(node.id || '(unknown-node)');
      }
      if (node.type === 'item' && node.definitionId) {
        allLayoutItemDefinitionIds.push(node.definitionId);
      }
    });
  }

  checker.add(
    'R006_layout_node_valid_type',
    badNodeTypes.length === 0,
    badNodeTypes.length === 0
      ? 'layout nodes 的 type 全部合法(container/item)'
      : `存在非法 node.type 节点: ${badNodeTypes.join(', ')}`,
  );

  checker.add(
    'R007_layout_mode_valid',
    badLayoutModes.length === 0,
    badLayoutModes.length === 0
      ? 'container.layoutMode 全部合法'
      : `存在非法 layoutMode 节点: ${badLayoutModes.join(', ')}`,
  );

  checker.add(
    'R008_themes_top_level',
    Number.isInteger(themes?.version) && Array.isArray(themes?.themes),
    'themes.version 存在且 themes 为数组',
  );

  const themeFields = ['id', 'name', 'description', 'entryIds', 'styleOverrides', 'layoutId', 'createdAt', 'updatedAt'];
  const badThemes = themesList.filter(
    t =>
      !hasFields(t, themeFields) ||
      !Array.isArray(t.entryIds) ||
      !isObject(t.styleOverrides) ||
      !(typeof t.layoutId === 'string' || t.layoutId === null),
  );
  checker.add(
    'R009_theme_required_fields',
    badThemes.length === 0,
    badThemes.length === 0
      ? `themes 共 ${themesList.length} 条，字段完整`
      : `存在 ${badThemes.length} 条 theme 字段缺失或类型非法`,
  );

  checker.add(
    'R010_narratives_top_level',
    Number.isInteger(narratives?.version) && Array.isArray(narratives?.templates),
    'narratives.version 存在且 templates 为数组',
  );

  const narrFields = [
    'id',
    'name',
    'sharedTemplate',
    'characterTemplate',
    'userTemplate',
    'userModifiedTemplate',
    'stylePrompt',
    'createdAt',
    'updatedAt',
  ];
  const badNarrs = narrativeTemplates.filter(t => !hasFields(t, narrFields));
  checker.add(
    'R011_narrative_template_required_fields',
    badNarrs.length === 0,
    badNarrs.length === 0
      ? `narratives.templates 共 ${narrativeTemplates.length} 条，字段完整`
      : `存在 ${badNarrs.length} 条 narrative template 字段缺失`,
  );

  const missingThemeEntryRefs = [];
  for (const theme of themesList) {
    for (const entryId of theme.entryIds || []) {
      if (!entryIds.has(entryId)) {
        missingThemeEntryRefs.push(`${theme.id}:${entryId}`);
      }
    }
  }
  checker.add(
    'R012_crossref_theme_entry_exists',
    missingThemeEntryRefs.length === 0,
    missingThemeEntryRefs.length === 0
      ? 'themes.entryIds 全部可在 definitions.entries.id 中找到'
      : `存在丢失的 theme->entry 引用: ${missingThemeEntryRefs.join(', ')}`,
  );

  const badThemeStyleRefs = [];
  for (const theme of themesList) {
    const entrySet = new Set(theme.entryIds || []);
    for (const [entryId, styleId] of Object.entries(theme.styleOverrides || {})) {
      if (!entrySet.has(entryId)) {
        badThemeStyleRefs.push(`${theme.id}:styleOverrides key ${entryId} 不在 entryIds 中`);
      }
      if (!styleIds.has(styleId)) {
        badThemeStyleRefs.push(`${theme.id}:styleOverrides value ${styleId} 不存在`);
      }
    }
  }
  checker.add(
    'R013_crossref_theme_style_key_in_entryIds',
    badThemeStyleRefs.length === 0,
    badThemeStyleRefs.length === 0 ? 'themes.styleOverrides 的 key 与 value 均有效' : badThemeStyleRefs.join('; '),
  );

  const missingLayoutEntryRefs = allLayoutItemDefinitionIds.filter(id => !entryIds.has(id));
  checker.add(
    'R014_crossref_layout_item_definition_exists',
    missingLayoutEntryRefs.length === 0,
    missingLayoutEntryRefs.length === 0
      ? 'layout.item.definitionId 全部存在于 definitions.entries.id'
      : `存在丢失的 layout->entry 引用: ${missingLayoutEntryRefs.join(', ')}`,
  );

  if (systemConfig !== undefined) {
    const known = new Set([
      'narrativeEnabled',
      'narrativeInjectEnabled',
      'narrativeKeepOnRollback',
      'activeThemeId',
      'patchHideRegexEnabled',
    ]);
    const badType = [];
    if ('narrativeEnabled' in systemConfig && typeof systemConfig.narrativeEnabled !== 'boolean')
      badType.push('narrativeEnabled');
    if ('narrativeInjectEnabled' in systemConfig && typeof systemConfig.narrativeInjectEnabled !== 'boolean')
      badType.push('narrativeInjectEnabled');
    if ('narrativeKeepOnRollback' in systemConfig && typeof systemConfig.narrativeKeepOnRollback !== 'boolean')
      badType.push('narrativeKeepOnRollback');
    if ('patchHideRegexEnabled' in systemConfig && typeof systemConfig.patchHideRegexEnabled !== 'boolean')
      badType.push('patchHideRegexEnabled');
    if (
      'activeThemeId' in systemConfig &&
      !(typeof systemConfig.activeThemeId === 'string' || systemConfig.activeThemeId === null)
    ) {
      badType.push('activeThemeId');
    }
    const unknownKeys = Object.keys(systemConfig).filter(k => !known.has(k));
    checker.add(
      'R015_system_config_keys_valid',
      badType.length === 0,
      badType.length === 0
        ? unknownKeys.length > 0
          ? `已校验核心字段类型，存在兼容扩展字段: ${unknownKeys.join(', ')}`
          : 'system config 核心字段类型合法'
        : `system config 字段类型非法: ${badType.join(', ')}`,
    );
  } else {
    checker.add('R015_system_config_keys_valid', true, '未提供 systemConfigJson，按可选规则跳过');
  }

  if (fullExport !== undefined) {
    const markerOk =
      fullExport?._omg_export === true &&
      Number.isInteger(fullExport?.version) &&
      Number.isFinite(fullExport?.timestamp);
    checker.add(
      'R016_full_export_marker',
      markerOk,
      markerOk
        ? 'full export 标记与 version/timestamp 合法'
        : 'full export 缺少 _omg_export=true 或 version/timestamp 非法',
    );

    const subChecks = [];
    if ('definitions' in fullExport) {
      subChecks.push(Number.isInteger(fullExport.definitions?.version));
      subChecks.push(Array.isArray(fullExport.definitions?.categories));
      subChecks.push(Array.isArray(fullExport.definitions?.entries));
    }
    if ('styles' in fullExport) {
      subChecks.push(Number.isInteger(fullExport.styles?.version));
      subChecks.push(Array.isArray(fullExport.styles?.units));
    }
    if ('layouts' in fullExport) {
      subChecks.push(Number.isInteger(fullExport.layouts?.version));
      subChecks.push(Array.isArray(fullExport.layouts?.layouts));
    }
    if ('themes' in fullExport) {
      subChecks.push(Number.isInteger(fullExport.themes?.version));
      subChecks.push(Array.isArray(fullExport.themes?.themes));
    }
    if ('narratives' in fullExport) {
      subChecks.push(Number.isInteger(fullExport.narratives?.version));
      subChecks.push(Array.isArray(fullExport.narratives?.templates));
    }

    const shapeOk = subChecks.length > 0 ? subChecks.every(Boolean) : false;
    checker.add(
      'R017_full_export_submodules_shape',
      shapeOk,
      shapeOk ? 'full export 子模块结构合法' : 'full export 子模块结构不完整或类型错误',
    );
  } else {
    checker.add('R016_full_export_marker', true, '未提供 fullExportJson，按可选规则跳过');
    checker.add('R017_full_export_submodules_shape', true, '未提供 fullExportJson，按可选规则跳过');
  }

  function hasDup(values) {
    const seen = new Set();
    for (const v of values) {
      if (seen.has(v)) return true;
      seen.add(v);
    }
    return false;
  }

  const dupInfo = [];
  if (hasDup(definitionsEntries.map(e => e?.id))) dupInfo.push('definitions.entries.id');
  if (hasDup(stylesUnits.map(u => u?.id))) dupInfo.push('styles.units.id');
  if (hasDup(layoutsList.map(l => l?.id))) dupInfo.push('layouts.layouts.id');
  if (hasDup(themesList.map(t => t?.id))) dupInfo.push('themes.themes.id');
  if (hasDup(narrativeTemplates.map(t => t?.id))) dupInfo.push('narratives.templates.id');

  checker.add(
    'R018_id_uniqueness',
    dupInfo.length === 0,
    dupInfo.length === 0 ? '各模块 ID 唯一性通过' : `发现重复 ID 字段集合: ${dupInfo.join(', ')}`,
  );

  return {
    summary: checker.summary(),
    checks: checker.checks,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const input = {};

  try {
    if (args['full-export']) input.fullExport = readJson(args['full-export']);
    if (args.definitions) input.definitions = readJson(args.definitions);
    if (args.styles) input.styles = readJson(args.styles);
    if (args.layouts) input.layouts = readJson(args.layouts);
    if (args.themes) input.themes = readJson(args.themes);
    if (args.narratives) input.narratives = readJson(args.narratives);
    if (args['system-config']) input.systemConfig = readJson(args['system-config']);
  } catch (err) {
    console.error(`[validate-statusbar-json] JSON 读取失败: ${err.message}`);
    process.exit(1);
  }

  if (!input.fullExport && !(input.definitions && input.styles && input.layouts && input.themes && input.narratives)) {
    console.error(
      '[validate-statusbar-json] 需要提供 full export，或同时提供 definitions/styles/layouts/themes/narratives 五个模块文件',
    );
    printUsage();
    process.exit(1);
  }

  if (input.fullExport) {
    input.definitions = input.definitions || input.fullExport.definitions;
    input.styles = input.styles || input.fullExport.styles;
    input.layouts = input.layouts || input.fullExport.layouts;
    input.themes = input.themes || input.fullExport.themes;
    input.narratives = input.narratives || input.fullExport.narratives;
  }

  const report = validateModules(input);

  const output = JSON.stringify(report, null, 2);
  if (args.report) {
    fs.writeFileSync(path.resolve(args.report), output, 'utf8');
  }
  console.log(output);

  process.exit(report.summary.failed > 0 ? 2 : 0);
}

main();
