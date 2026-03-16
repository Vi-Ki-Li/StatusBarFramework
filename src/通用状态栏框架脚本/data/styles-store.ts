/**
 * 样式工坊 — IndexedDB 存储操作
 *
 * 对自定义样式单元和全局主题的 CRUD 封装。
 */
import { STORES } from '../core/constants';
import { clearStore, deleteItem, getAllItems, getItem, putItem, putItems } from '../core/storage';
import type { StyleUnit } from '../renderer/style-units';

// ─── 类型 ───

/** 存储的样式单元（带元数据） */
export interface StoredStyleUnit extends StyleUnit {
  description: string;
  createdAt: number;
  updatedAt: number;
}

/** 全局主题配置 */
export interface GlobalTheme {
  id: string;
  name: string;
  css: string;
  htmlTemplate: string;
  updatedAt: number;
}

const GLOBAL_THEME_ID = '_global_theme_';

// ─── 样式单元操作 ───

/** 获取所有自定义样式单元 */
export async function getAllStyleUnits(): Promise<StoredStyleUnit[]> {
  const all = await getAllItems<StoredStyleUnit>(STORES.STYLES);
  return all.filter(item => item.id !== GLOBAL_THEME_ID).sort((a, b) => a.createdAt - b.createdAt);
}

/** 保存样式单元 */
export async function saveStyleUnit(unit: StoredStyleUnit): Promise<void> {
  unit.updatedAt = Date.now();
  await putItem(STORES.STYLES, unit);
}

/** 删除样式单元 */
export async function deleteStyleUnit(id: string): Promise<void> {
  await deleteItem(STORES.STYLES, id);
}

// ─── 全局主题操作 ───

/** 获取全局主题 */
export async function getGlobalTheme(): Promise<GlobalTheme | undefined> {
  return getItem<GlobalTheme>(STORES.STYLES, GLOBAL_THEME_ID);
}

/** 保存全局主题 */
export async function saveGlobalTheme(css: string, htmlTemplate: string = ''): Promise<void> {
  await putItem(STORES.STYLES, {
    id: GLOBAL_THEME_ID,
    name: '全局主题',
    css,
    htmlTemplate,
    updatedAt: Date.now(),
  } as GlobalTheme);
}

// ─── 导入/导出 ───

export interface StylesExport {
  version: 1;
  units: StoredStyleUnit[];
  globalTheme?: { css: string; htmlTemplate: string };
}

/** 导出所有样式数据 */
export async function exportStyles(): Promise<StylesExport> {
  const units = await getAllStyleUnits();
  const theme = await getGlobalTheme();
  return {
    version: 1,
    units,
    globalTheme: theme ? { css: theme.css, htmlTemplate: theme.htmlTemplate } : undefined,
  };
}

/** 导入样式数据 */
export async function importStyles(data: StylesExport, merge = false): Promise<void> {
  if (!merge) {
    await clearStore(STORES.STYLES);
  }
  await putItems(STORES.STYLES, data.units);
  if (data.globalTheme) {
    await saveGlobalTheme(data.globalTheme.css, data.globalTheme.htmlTemplate);
  }
}

// ─── 工厂函数 ───

/** 创建新的自定义样式单元 */
export function createNewStyleUnit(partial: Partial<StoredStyleUnit> & { name: string }): StoredStyleUnit {
  const now = Date.now();
  return {
    id: `su_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    template: [
      '<div class="omg-su-custom">',
      '  <i class="{{icon}} omg-su-custom__icon"></i>',
      '  <span class="omg-su-custom__label">{{name}}</span>',
      '  <span class="omg-su-custom__value">{{value}}</span>',
      '</div>',
    ].join('\n'),
    css: [
      '.omg-su-custom {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 6px 10px;',
      '}',
      '',
      '.omg-su-custom__icon {',
      '  color: var(--omg-accent);',
      '}',
      '',
      '.omg-su-custom__value {',
      '  margin-left: auto;',
      '  font-weight: 600;',
      '}',
    ].join('\n'),
    description: '',
    builtin: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
