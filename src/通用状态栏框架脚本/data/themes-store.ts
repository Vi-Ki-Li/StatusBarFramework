/**
 * 主题组合 — IndexedDB 存储操作
 *
 * 主题组合将定义、样式、布局组合在一起，
 * 可绑定到聊天或一次性应用。
 */
import { STORES } from '../core/constants';
import type { StorageItem } from '../core/storage';
import { clearStore, deleteItem, getAllItems, putItem, putItems } from '../core/storage';

// ─── 类型 ───

/** 主题组合配置 */
export interface ThemeCombo extends StorageItem {
  id: string;
  name: string;
  description: string;
  /** 包含的条目定义 ID 列表 */
  entryIds: string[];
  /** 样式覆盖映射: entryId → styleId */
  styleOverrides: Record<string, string>;
  /** 使用的布局 ID */
  layoutId: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── 工厂函数 ───

export function createThemeCombo(name: string): ThemeCombo {
  const now = Date.now();
  return {
    id: `theme_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: '',
    entryIds: [],
    styleOverrides: {},
    layoutId: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── IndexedDB 操作 ───

export async function getAllThemes(): Promise<ThemeCombo[]> {
  return (await getAllItems<ThemeCombo>(STORES.THEMES)).sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveTheme(theme: ThemeCombo): Promise<void> {
  theme.updatedAt = Date.now();
  await putItem(STORES.THEMES, theme);
}

export async function deleteTheme(id: string): Promise<void> {
  await deleteItem(STORES.THEMES, id);
}

// ─── 导入/导出 ───

export interface ThemesExport {
  version: 1;
  themes: ThemeCombo[];
}

export async function exportThemes(): Promise<ThemesExport> {
  return { version: 1, themes: await getAllThemes() };
}

export async function importThemes(data: ThemesExport, merge = false): Promise<void> {
  if (!merge) await clearStore(STORES.THEMES);
  await putItems(STORES.THEMES, data.themes);
}
