/**
 * 世界书注入
 *
 * 将数据工作室中的条目定义（description + update_sample）
 * 组合后写入世界书，让 AI 了解数据结构和更新方式。
 */
import { SCRIPT_TITLE } from '../core/constants';
import type { CategoryDef, DefinitionEntry } from './definitions';
import * as store from './definitions-store';

/** 世界书名称 */
export const WB_NAME = 'OMG_StatusBar_Definitions';

/** 条目名称前缀 */
export const ENTRY_PREFIX = 'OMG_Def_';

/**
 * 根据当前定义生成世界书条目内容
 */
function buildEntryContent(entry: DefinitionEntry, category: CategoryDef): string {
  const lines: string[] = [];

  lines.push(`[状态栏数据定义: ${entry.name}]`);
  lines.push(`路径: ${category.scope === 'shared' ? 'shared' : 'characters.<角色ID>'}/${entry.key}`);
  lines.push(`分类: ${category.name} (${category.scope === 'shared' ? '共享数据' : '角色数据'})`);
  lines.push(`数据类型: ${entry.dataType === 'number' ? '数字' : entry.dataType === 'boolean' ? '布尔' : '文本'}`);

  if (entry.validation.min !== undefined || entry.validation.max !== undefined) {
    const parts: string[] = [];
    if (entry.validation.min !== undefined) parts.push(`最小值=${entry.validation.min}`);
    if (entry.validation.max !== undefined) parts.push(`最大值=${entry.validation.max}`);
    lines.push(`验证规则: ${parts.join(', ')}`);
  }

  if (entry.description) {
    lines.push('');
    lines.push(`描述: ${entry.description}`);
  }

  if (entry.updateSample) {
    lines.push('');
    lines.push('JSON Patch 更新示例:');
    lines.push(entry.updateSample);
  }

  return lines.join('\n');
}

/**
 * 生成总览条目（系统指令）
 */
function buildOverviewContent(categories: CategoryDef[], entries: DefinitionEntry[]): string {
  const lines: string[] = [];

  lines.push('[状态栏框架 — 数据更新指令]');
  lines.push('');
  lines.push('你需要在回复末尾用 JSON Patch (RFC 6902) 格式更新状态数据。');
  lines.push('用 ```json 代码块包裹，数组格式，每个操作包含 op/path/value。');
  lines.push('');
  lines.push('数据结构概览:');
  lines.push('- /shared/... — 共享数据（世界状态、时间、地点等）');
  lines.push('- /characters/<角色ID>/... — 角色独立数据（生命值、好感度等）');
  lines.push('');

  if (categories.length > 0) {
    lines.push('已定义的数据分类:');
    for (const cat of categories) {
      const catEntries = entries.filter(e => e.categoryId === cat.id);
      if (catEntries.length === 0) continue;
      lines.push(
        `  ${cat.name} (${cat.scope === 'shared' ? '共享' : '角色'}): ${catEntries.map(e => e.key).join(', ')}`,
      );
    }
  }

  return lines.join('\n');
}

/**
 * 将所有定义注入世界书
 *
 * 创建或替换世界书 `OMG_StatusBar_Definitions`，
 * 包含一个总览条目 + 每个定义条目对应一个世界书条目。
 */
export async function injectToWorldbook(): Promise<{ created: boolean; entryCount: number }> {
  const categories = await store.getAllCategories();
  const entries = await store.getAllEntries();

  const wbEntries: PartialDeep<WorldbookEntry>[] = [];

  // 总览条目（常驻蓝灯）
  wbEntries.push({
    name: `${ENTRY_PREFIX}Overview`,
    enabled: true,
    content: buildOverviewContent(categories, entries),
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 4,
      order: 100,
    },
    probability: 100,
  });

  // 每个条目一个世界书条目（绿灯，关键字触发）
  for (const entry of entries) {
    const cat = categories.find(c => c.id === entry.categoryId);
    if (!cat) continue;

    // 用条目的 key 和 name 作为触发关键字
    const keys = [entry.key];
    if (entry.name !== entry.key) keys.push(entry.name);

    wbEntries.push({
      name: `${ENTRY_PREFIX}${entry.key}`,
      enabled: true,
      content: buildEntryContent(entry, cat),
      strategy: {
        type: 'selective',
        keys,
        keys_secondary: { logic: 'and_any', keys: [] },
        scan_depth: 'same_as_global',
      },
      position: {
        type: 'at_depth',
        role: 'system',
        depth: 4,
        order: 200,
      },
      probability: 100,
    });
  }

  const created = await createOrReplaceWorldbook(WB_NAME, wbEntries, { render: 'debounced' });

  console.info(`[${SCRIPT_TITLE}] 世界书${created ? '创建' : '更新'}: ${WB_NAME}, ${wbEntries.length} 条目`);

  return { created, entryCount: wbEntries.length };
}

/** 删除框架创建的世界书 */
export async function removeWorldbook(): Promise<boolean> {
  try {
    return await deleteWorldbook(WB_NAME);
  } catch {
    return false;
  }
}

/** 获取框架世界书（不存在则返回 null） */
export async function getFrameworkWorldbook(): Promise<WorldbookEntry[] | null> {
  try {
    return await getWorldbook(WB_NAME);
  } catch {
    return null;
  }
}

/** 获取框架管理的条目（以 OMG_Def_ 前缀识别） */
export async function getManagedEntries(): Promise<WorldbookEntry[]> {
  const wb = await getFrameworkWorldbook();
  if (!wb) return [];
  return wb.filter(entry => entry.name.startsWith(ENTRY_PREFIX));
}

/** 启用/禁用某个框架条目 */
export async function setManagedEntryEnabled(uid: number, enabled: boolean): Promise<void> {
  await updateWorldbookWith(WB_NAME, worldbook =>
    worldbook.map(entry => (entry.uid === uid ? { ...entry, enabled } : entry)),
  );
}

/** 一键启用/禁用全部框架条目 */
export async function setAllManagedEntriesEnabled(enabled: boolean): Promise<void> {
  await updateWorldbookWith(WB_NAME, worldbook =>
    worldbook.map(entry => (entry.name.startsWith(ENTRY_PREFIX) ? { ...entry, enabled } : entry)),
  );
}
