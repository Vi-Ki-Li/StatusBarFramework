/**
 * 数据工作室 — 条目定义模型
 *
 * 定义数据的显示方式和验证规则（DEC-007: 不定义数据结构）。
 * 存储在 IndexedDB 的 'definitions' store 中。
 */
import type { StorageItem } from '../core/storage';

/** 条目数据类型 */
export type DataType = 'text' | 'number' | 'boolean';

/** 分类属性：共享（全局数据）或角色（每角色独立） */
export type CategoryScope = 'shared' | 'character';

/** 分类定义 */
export interface CategoryDef extends StorageItem {
  id: string;
  /** 分类显示名 */
  name: string;
  /** 分类属性 */
  scope: CategoryScope;
  /** 排序序号 */
  order: number;
  /** 图标类名 */
  icon?: string;
}

/** 验证规则 */
export interface ValidationRule {
  /** 数字最小值 */
  min?: number;
  /** 数字最大值 */
  max?: number;
  /** 文本最大长度 */
  maxLength?: number;
  /** 文本正则验证 */
  pattern?: string;
}

/** 交互类型 */
export type InteractionType =
  | 'none' // 无交互
  | 'click' // 点击事件
  | 'toggle' // 开关切换
  | 'input' // 输入修改
  | 'custom'; // 自定义脚本

/** 条目定义 */
export interface DefinitionEntry extends StorageItem {
  id: string;
  /** JSON 路径标识（如 "生命值"、"装备.武器"） */
  key: string;
  /** 显示名称 */
  name: string;
  /** 所属分类 ID */
  categoryId: string;
  /** 图标类名 (Font Awesome) */
  icon: string;
  /** 数据类型 */
  dataType: DataType;
  /** 验证规则 */
  validation: ValidationRule;
  /** 关联的样式单元 ID（来自样式工坊） */
  uiType: string;
  /** 交互类型 */
  interactionType: InteractionType;
  /** AI 指导描述文本 */
  description: string;
  /** JSON Patch 示例（自动生成或手动编写） */
  updateSample: string;
  /** 排序序号 */
  order: number;
}

/** 创建默认分类 */
export function createDefaultCategory(
  partial: Partial<CategoryDef> & { name: string; scope: CategoryScope },
): CategoryDef {
  return {
    id: `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    order: 0,
    ...partial,
  };
}

/** 创建默认条目定义 */
export function createDefaultEntry(
  partial: Partial<DefinitionEntry> & { key: string; name: string; categoryId: string },
): DefinitionEntry {
  return {
    id: `def_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    icon: 'fa-solid fa-circle',
    dataType: 'text',
    validation: {},
    uiType: 'default',
    interactionType: 'none',
    description: '',
    updateSample: '',
    order: 0,
    ...partial,
  };
}

/**
 * 根据条目定义自动生成 JSON Patch 示例
 */
export function generateUpdateSample(entry: DefinitionEntry, scope: CategoryScope): string {
  const exampleValue = entry.dataType === 'number' ? 10 : entry.dataType === 'boolean' ? true : '示例文本';

  const basePath = scope === 'shared' ? `/shared/${entry.key}` : `/characters/char_xxx/${entry.key}`;

  const ops = [{ op: 'replace', path: basePath, value: exampleValue }];

  return JSON.stringify(ops, null, 2);
}

/**
 * 根据条目定义生成 Zod 验证代码字符串（用于显示）
 */
export function generateZodSnippet(entry: DefinitionEntry): string {
  let schema = '';
  switch (entry.dataType) {
    case 'number':
      schema = 'z.number()';
      if (entry.validation.min !== undefined) schema += `.min(${entry.validation.min})`;
      if (entry.validation.max !== undefined) schema += `.max(${entry.validation.max})`;
      break;
    case 'boolean':
      schema = 'z.boolean()';
      break;
    case 'text':
    default:
      schema = 'z.string()';
      if (entry.validation.maxLength !== undefined) schema += `.max(${entry.validation.maxLength})`;
      if (entry.validation.pattern) schema += `.regex(/${entry.validation.pattern}/)`;
      break;
  }
  return schema;
}
