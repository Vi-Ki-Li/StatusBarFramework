/**
 * TavernHelper Remastered Core Types
 * v7.0 Refactor: entry_type (Single/List) + data_type validation
 *
 * 这是状态栏框架的核心数据类型定义
 */
import type { LayoutNode } from './layout';

// ==================== 基础类型 ====================

/** 基础数据类型 - 用于 parts 的值验证 */
export type DataType = 'string' | 'number' | 'boolean';

/** 条目类型 - 根据总纲要求改名 */
export type EntryType = 'Single' | 'List';

/** 分类作用域 */
export type CategoryScope = 'shared' | 'character';

// ==================== 1. 分类定义 ====================

export interface CategoryDefinition {
  key: string; // "CP", "CV"
  name: string; // "角色档案"
  icon: string; // Lucide icon name
  order: number; // 排序权重
  scope: CategoryScope; // 'shared' = 共享数据, 'character' = 角色数据
}

// ==================== 2. 条目定义 ====================

/** 条目结构的单个部分 */
export interface ItemDefinitionPart {
  key: string; // 唯一键，如 "current", "max"
  label: string; // UI 显示标签，如 "当前值", "最大值"
  data_type: DataType; // 基础类型
  validation?: {
    min?: number; // 数字最小值
    max?: number; // 数字最大值
    pattern?: string; // 正则验证（字符串）
  };
}

/** 条目定义 - 描述一个数据条目的结构 */
export interface ItemDefinition {
  key: string; // 唯一键，如 "HP", "背包"
  name: string; // 显示名，如 "生命值"
  icon?: string; // Lucide 图标名
  category: string; // 所属分类 key
  entry_type: EntryType; // Single = 单体, List = 列表
  parts: ItemDefinitionPart[]; // 结构定义
  separator: string; // 主分隔符（List 时分隔各项）
  secondary_separator?: string; // 次分隔符（List 多 parts 时分隔属性）
  ui_type?: string; // 默认渲染样式 ID
  interaction_type?: 'none' | 'fill_input' | 'send_chat' | 'custom_script';
  format?: string; // 自动生成的格式字符串，供 AI 识别
  description?: string; // 给 AI 的描述说明
}

// ==================== 3. 状态栏数据条目 ====================

/** 运行时的数据条目 */
export interface StatusBarItem {
  key: string;
  /** Single: Record<string, any>, List: Array<Record<string, any>> */
  value: Record<string, unknown> | Array<Record<string, unknown>>;
  source_id: number; // 来源消息楼层 ID
  user_modified: boolean; // 用户是否手动修改过
  category: string;
  _uuid: string; // 用于拖拽等操作的唯一标识
}

// ==================== 4. 角色数据 ====================

export interface CharacterData {
  [category: string]: StatusBarItem[];
}

export interface CharacterMap {
  [id: string]: string; // char_id -> character_name
}

export interface CharacterMeta {
  isPresent: boolean;
}

// ==================== 5. SST 主数据结构 ====================

export interface StatusBarData {
  /** 分类注册表 */
  categories: Record<string, CategoryDefinition>;

  /** 条目定义注册表 */
  item_definitions: Record<string, ItemDefinition>;

  /** 角色 ID 到名称的映射 */
  id_map: CharacterMap;

  /** 角色元数据 */
  character_meta: Record<string, CharacterMeta>;

  /** 共享数据 */
  shared: Record<string, StatusBarItem[]>;

  /** 角色数据 */
  characters: Record<string, CharacterData>;

  /** 布局数据 */
  layout?: LayoutNode[];

  /** 元数据 */
  _meta: {
    message_count: number;
    last_updated: string;
    version: number;
    activePresetIds?: string[];
  };
}

// 7. 解析器返回的临时结构
export interface ParsedUpdate {
  shared: { [category: string]: StatusBarItem[] };
  characters: {
    [charName: string]: {
      [category: string]: StatusBarItem[];
    };
  };
  // v6.3: 元数据更新指令
  meta?: {
    [charName: string]: {
      isPresent?: boolean;
    };
  };
}

// 8. 世界书条目
export interface LorebookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  enabled: boolean;
  position: number;
  constant?: boolean;
  selective?: boolean;
  probability?: number;
}

// 9. 合并结果
export interface MergeResult {
  data: StatusBarData;
  warnings: string[];
  logs: string[];
}

// 10. 快照事件
export interface SnapshotEvent {
  source: 'user' | 'ai';
  character: string | null;
  category: string;
  key: string;
  change_type: string;
  data_type: 'numeric' | 'text' | 'array';
  previous: any;
  current: any;
  details?: any;
}

// 11. 快照元数据
export interface SnapshotMeta {
  timestamp: string;
  message_count: number;
  description_summary?: string;
}

// 12. 配置预设 (v8.0 Refactor)
export interface Preset {
  id: string; // Unique ID for the preset
  name: string;
  timestamp: number;
  itemKeys: string[]; // Array of ItemDefinition keys included in this preset
  styleOverrides: {
    [itemKey: string]: string; // Key: ItemDefinition.key, Value: StyleDefinition.id
  };
  layout?: LayoutNode[]; // v9.8: Layout Snapshot
  narrativeConfigId?: string; // v10.2: 绑定的叙事风格ID
}

export interface AppOptions {
  darkMode: boolean;
  defaultExpanded: boolean;
  worldSnapshotEnabled: boolean;
}

// 13. 样式定义 (Style Definition) - v7.0 Refactor
export interface StyleDefinition {
  id: string; // Unique ID, e.g., UUID
  name: string; // "红色血条"
  dataType: 'numeric' | 'array' | 'list-of-objects' | 'text' | 'theme';
  css: string;
  html?: string; // Optional custom HTML structure, only for component types
  mockDataKey?: string; // Key from item_definitions to use for previewing
  guiConfig?: {
    [selector: string]: Record<string, string | number>; // CSS 属性键值对
  };
}
