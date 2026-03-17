/**
 * 叙事快照 — IndexedDB 存储操作
 *
 * 管理叙事生成模板，用于检测数据变化并生成叙事文本。
 */
import { STORES } from '../core/constants';
import type { StorageItem } from '../core/storage';
import { clearStore, deleteItem, getAllItems, putItem, putItems } from '../core/storage';

// ─── 类型 ───

/** 叙事生成模板 */
export interface NarrativeTemplate extends StorageItem {
  id: string;
  name: string;
  /** 共享数据变化模板 */
  sharedTemplate: string;
  /** 角色数据变化模板 */
  characterTemplate: string;
  /** 用户角色数据变化模板 */
  userTemplate: string;
  /** user_modified 数据变化模板 */
  userModifiedTemplate: string;
  /** AI 叙事风格总指导 */
  stylePrompt: string;
  createdAt: number;
  updatedAt: number;
}

// ─── 工厂函数 ───

export function createNarrativeTemplate(name: string): NarrativeTemplate {
  const now = Date.now();
  return {
    id: `narr_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    sharedTemplate: '【世界变化】{{key}}: {{old_value}} → {{new_value}}',
    characterTemplate: '【{{char_name}}】{{key}}: {{old_value}} → {{new_value}}',
    userTemplate: '【{{user_name}}】{{key}}: {{old_value}} → {{new_value}}',
    userModifiedTemplate:
      '【用户修改】{{char_name}} 的 {{key}} 被用户手动更改为 {{new_value}}（此为用户意图，并非错误）',
    stylePrompt: '',
    createdAt: now,
    updatedAt: now,
  };
}

// ─── IndexedDB 操作 ───

export async function getAllNarratives(): Promise<NarrativeTemplate[]> {
  return (await getAllItems<NarrativeTemplate>(STORES.NARRATIVES)).sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveNarrative(tpl: NarrativeTemplate): Promise<void> {
  tpl.updatedAt = Date.now();
  await putItem(STORES.NARRATIVES, tpl);
}

export async function deleteNarrative(id: string): Promise<void> {
  await deleteItem(STORES.NARRATIVES, id);
}

// ─── 导入/导出 ───

export interface NarrativesExport {
  version: 1;
  templates: NarrativeTemplate[];
}

export async function exportNarratives(): Promise<NarrativesExport> {
  return { version: 1, templates: await getAllNarratives() };
}

export async function importNarratives(data: NarrativesExport, merge = false): Promise<void> {
  if (!merge) await clearStore(STORES.NARRATIVES);
  await putItems(STORES.NARRATIVES, data.templates);
}
