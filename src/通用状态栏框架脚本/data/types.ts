/**
 * 核心数据类型定义
 *
 * 定义整个框架使用的数据模型：角色数据、共享数据、元数据等。
 * JSON 数据的实际结构由用户自由定义，框架不强制约束，
 * 仅在此定义容器和元数据格式。
 */

/** 角色 ID 格式：char_{标识} */
export type CharId = `char_${string}`;

/** 用户角色固定 ID */
export const CHAR_USER_ID: CharId = 'char_user';

/** 单个数据条目的元信息 */
export interface EntryMeta {
  /** 数据来源的消息楼层 ID */
  source_id: number;
  /** 是否由用户手动修改 */
  user_modified: boolean;
}

/** 角色信息 */
export interface CharacterInfo {
  /** 唯一角色 ID */
  char_id: CharId;
  /** 角色显示名（可能随时变化） */
  name: string;
  /** 角色是否"在场" */
  isPresent: boolean;
}

/**
 * 框架状态数据（SST）— 存储在聊天变量中
 *
 * 整体结构:
 * {
 *   _meta: { ... },
 *   _characters: { char_xxx: { char_id, name, isPresent }, ... },
 *   shared: { ... },            // 共享数据（如世界状态）
 *   characters: {               // 角色数据
 *     char_xxx: { ... },
 *   },
 *   _entry_meta: {              // 每个路径的元信息
 *     "shared.时间": { source_id, user_modified },
 *     "characters.char_xxx.好感度": { source_id, user_modified },
 *   }
 * }
 */
export interface FrameworkState {
  _meta: StateMeta;
  _characters: Record<CharId, CharacterInfo>;
  shared: Record<string, any>;
  characters: Record<CharId, Record<string, any>>;
  _entry_meta: Record<string, EntryMeta>;
}

/** 状态元数据 */
export interface StateMeta {
  /** 上次更新时的总消息数，用于检测时间线收缩 */
  message_count: number;
  /** 框架版本号 */
  version: number;
}

/** 创建空的初始状态 */
export function createEmptyState(): FrameworkState {
  return {
    _meta: {
      message_count: 0,
      version: 1,
    },
    _characters: {},
    shared: {},
    characters: {},
    _entry_meta: {},
  };
}

/**
 * 楼层快照 — 存储在消息楼层变量中
 *
 * 每个消息楼层记录该楼层处的数据状态快照,
 * 用于叙事生成、差异对比等。
 */
export interface FloorSnapshot {
  /** 快照时间戳 */
  timestamp: number;
  /** 该楼层的共享数据快照 */
  shared: Record<string, any>;
  /** 该楼层的角色数据快照 */
  characters: Record<CharId, Record<string, any>>;
  /** 相对于上一楼层的变化摘要 */
  changes?: PatchOperation[];
}

/** nil 值标记，表示数据被临时隐藏 */
export const NIL_VALUE = '__omg_nil__' as const;

/** 检查值是否为 nil */
export function isNil(value: unknown): value is typeof NIL_VALUE {
  return value === NIL_VALUE;
}

// ─── JSON Patch (RFC 6902) ───

/** JSON Patch 操作 */
export type PatchOperation = PatchAdd | PatchRemove | PatchReplace | PatchMove | PatchCopy | PatchTest;

export interface PatchAdd {
  op: 'add';
  path: string;
  value: any;
}

export interface PatchRemove {
  op: 'remove';
  path: string;
}

export interface PatchReplace {
  op: 'replace';
  path: string;
  value: any;
}

export interface PatchMove {
  op: 'move';
  from: string;
  path: string;
}

export interface PatchCopy {
  op: 'copy';
  from: string;
  path: string;
}

export interface PatchTest {
  op: 'test';
  path: string;
  value: any;
}
