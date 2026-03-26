/**
 * 布局编排器 — 数据模型 + IndexedDB 存储
 *
 * 布局以树状结构存储，每个节点可以是容器（container）或条目（item）。
 */
import { STORES } from '../core/constants';
import type { StorageItem } from '../core/storage';
import { clearStore, deleteItem, getAllItems, putItem, putItems } from '../core/storage';

// ─── 类型 ───

export type LayoutMode = 'flex-row' | 'flex-col' | 'grid' | 'absolute' | 'custom';

/** 布局节点 */
export interface LayoutNode {
  id: string;
  type: 'container' | 'item';
  label?: string;
  /** 是否在运行时显示容器标题 */
  showLabel?: boolean;
  /** 是否允许在运行时折叠容器 */
  collapsible?: boolean;
  /** 绑定的数据工作室分类 ID（容器） */
  bindCategoryId?: string;
  /** 是否按绑定分类动态同步条目（容器） */
  autoSyncFromCategory?: boolean;
  /** 动态绑定时的排序策略 */
  categorySortStrategy?: 'category' | 'layout';
  /** 是否让直接子条目自动等分宽度（flex-row 容器） */
  autoEqualizeItems?: boolean;
  /** 容器布局模式 */
  layoutMode?: LayoutMode;
  /** 子节点 */
  children?: LayoutNode[];
  /** 间距 */
  gap?: string;
  /** 内边距 */
  padding?: string;
  /** Grid 列数 */
  gridCols?: number;
  /** Flex 换行 */
  flexWrap?: boolean;
  /** 主轴对齐 */
  justifyContent?: string;
  /** 交叉轴对齐 */
  alignItems?: string;
  /** 绑定的定义条目 ID */
  definitionId?: string;
  /** 样式覆盖 ID */
  styleOverride?: string;
  /** 宽度 */
  width?: string;
  /** 高度 */
  height?: string;
  /** 自定义 CSS */
  customCss?: string;
}

/** 布局配置（IndexedDB 存储） */
export interface LayoutConfig extends StorageItem {
  id: string;
  name: string;
  root: LayoutNode;
  createdAt: number;
  updatedAt: number;
}

// ─── 工厂函数 ───

function genNodeId(): string {
  return `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** 创建容器节点 */
export function createContainerNode(mode: LayoutMode = 'flex-col', label?: string): LayoutNode {
  return {
    id: genNodeId(),
    type: 'container',
    layoutMode: mode,
    label: label ?? (mode === 'flex-row' ? '横向区块' : mode === 'grid' ? '网格区块' : '纵向区块'),
    children: [],
    gap: '8px',
    padding: '0',
  };
}

/** 创建条目节点 */
export function createItemNode(definitionId: string, label?: string): LayoutNode {
  return {
    id: genNodeId(),
    type: 'item',
    definitionId,
    label,
  };
}

/** 创建默认布局配置 */
export function createDefaultLayout(name: string = '默认布局'): LayoutConfig {
  const now = Date.now();
  return {
    id: `layout_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    root: createContainerNode('flex-col', '根容器'),
    createdAt: now,
    updatedAt: now,
  };
}

// ─── 树操作 ───

/** 递归查找节点 */
export function findNode(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** 查找父节点 */
export function findParent(root: LayoutNode, id: string): LayoutNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

/** 从树中移除节点 */
export function removeNode(root: LayoutNode, id: string): boolean {
  const parent = findParent(root, id);
  if (!parent || !parent.children) return false;
  const idx = parent.children.findIndex(c => c.id === id);
  if (idx === -1) return false;
  parent.children.splice(idx, 1);
  return true;
}

/** 在兄弟中移动节点 */
export function moveNode(root: LayoutNode, id: string, direction: 'up' | 'down'): boolean {
  const parent = findParent(root, id);
  if (!parent || !parent.children) return false;
  const idx = parent.children.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= parent.children.length) return false;
  [parent.children[idx], parent.children[newIdx]] = [parent.children[newIdx], parent.children[idx]];
  return true;
}

// ─── IndexedDB 操作 ───

/** 获取所有布局 */
export async function getAllLayouts(): Promise<LayoutConfig[]> {
  return (await getAllItems<LayoutConfig>(STORES.LAYOUTS)).sort((a, b) => a.createdAt - b.createdAt);
}

/** 保存布局 */
export async function saveLayout(layout: LayoutConfig): Promise<void> {
  layout.updatedAt = Date.now();
  await putItem(STORES.LAYOUTS, layout);
}

/** 删除布局 */
export async function deleteLayout(id: string): Promise<void> {
  await deleteItem(STORES.LAYOUTS, id);
}

// ─── 导入/导出 ───

export interface LayoutsExport {
  version: 1;
  layouts: LayoutConfig[];
}

export async function exportLayouts(): Promise<LayoutsExport> {
  return { version: 1, layouts: await getAllLayouts() };
}

export async function importLayouts(data: LayoutsExport, merge = false): Promise<void> {
  if (!merge) await clearStore(STORES.LAYOUTS);
  await putItems(STORES.LAYOUTS, data.layouts);
}
