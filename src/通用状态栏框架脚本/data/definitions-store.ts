/**
 * 数据工作室 — IndexedDB 存储操作
 *
 * 对分类和条目定义的 CRUD 封装。
 */
import { STORES } from '../core/constants';
import { clearStore, deleteItem, getAllItems, putItem, putItems } from '../core/storage';
import type { CategoryDef, DefinitionEntry } from './definitions';

// ─── 分类操作 ───

const CATEGORY_PREFIX = 'cat_';

function isCategoryId(id: string): boolean {
  return id.startsWith(CATEGORY_PREFIX);
}

/** 获取所有分类 */
export async function getAllCategories(): Promise<CategoryDef[]> {
  const all = await getAllItems<CategoryDef | DefinitionEntry>(STORES.DEFINITIONS);
  return (all.filter(item => isCategoryId(item.id)) as CategoryDef[]).sort((a, b) => a.order - b.order);
}

/** 保存分类 */
export async function saveCategory(cat: CategoryDef): Promise<void> {
  await putItem(STORES.DEFINITIONS, cat);
}

/** 删除分类及其下所有条目 */
export async function deleteCategoryAndEntries(catId: string): Promise<void> {
  const entries = await getEntriesByCategory(catId);
  for (const entry of entries) {
    await deleteItem(STORES.DEFINITIONS, entry.id);
  }
  await deleteItem(STORES.DEFINITIONS, catId);
}

// ─── 条目操作 ───

/** 获取所有条目定义 */
export async function getAllEntries(): Promise<DefinitionEntry[]> {
  const all = await getAllItems<CategoryDef | DefinitionEntry>(STORES.DEFINITIONS);
  return (all.filter(item => !isCategoryId(item.id)) as DefinitionEntry[]).sort((a, b) => a.order - b.order);
}

/** 根据分类获取条目 */
export async function getEntriesByCategory(categoryId: string): Promise<DefinitionEntry[]> {
  const all = await getAllEntries();
  return all.filter(e => e.categoryId === categoryId);
}

/** 保存条目 */
export async function saveEntry(entry: DefinitionEntry): Promise<void> {
  await putItem(STORES.DEFINITIONS, entry);
}

/** 删除条目 */
export async function deleteEntry(entryId: string): Promise<void> {
  await deleteItem(STORES.DEFINITIONS, entryId);
}

// ─── 导入/导出 ───

export interface DefinitionsExport {
  version: 1;
  categories: CategoryDef[];
  entries: DefinitionEntry[];
}

/** 导出所有定义 */
export async function exportDefinitions(): Promise<DefinitionsExport> {
  const all = await getAllItems<any>(STORES.DEFINITIONS);
  const categories = all.filter((item: any) => isCategoryId(item.id)) as CategoryDef[];
  const entries = all.filter((item: any) => !isCategoryId(item.id)) as DefinitionEntry[];
  return { version: 1, categories, entries };
}

/** 导入定义（覆盖模式） */
export async function importDefinitions(data: DefinitionsExport): Promise<void> {
  await clearStore(STORES.DEFINITIONS);
  const allItems = [...data.categories, ...data.entries];
  await putItems(STORES.DEFINITIONS, allItems);
}
