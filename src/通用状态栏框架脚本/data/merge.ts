/**
 * 智能合并逻辑
 *
 * 将 JSON Patch 操作应用到框架状态上，同时管理 source_id / user_modified 等元信息。
 * - source_id 裁决: 仅当 Source.source_id >= Target.source_id 时允许更新
 * - user_modified 标记: 不阻止 AI 更新（DEC-003），仅做记录
 * - 优先级降级: 用户发送新消息时重置 user_modified
 */
import { SCRIPT_TITLE } from '../core/constants';
import { applyPatch } from './json-patch';
import type { FloorSnapshot, FrameworkState, PatchOperation } from './types';
import { isNil } from './types';

/** 合并选项 */
export interface MergeOptions {
  /** 来源消息楼层 ID */
  sourceId: number;
  /** 是否为用户手动修改 */
  isUserModification?: boolean;
}

/**
 * 将 JSON Patch 操作合并到框架状态
 *
 * @returns 合并结果 { applied, skipped, errors }
 */
export function mergePatches(
  state: FrameworkState,
  patches: PatchOperation[],
  options: MergeOptions,
): { applied: number; skipped: number; errors: string[] } {
  const { sourceId, isUserModification = false } = options;
  const errors: string[] = [];
  let applied = 0;
  let skipped = 0;

  for (const patch of patches) {
    const path = (patch as any).path as string;
    const metaKey = patchPathToMetaKey(path);

    // source_id 裁决
    const existingMeta = state._entry_meta[metaKey];
    if (existingMeta && !isUserModification && sourceId < existingMeta.source_id) {
      skipped++;
      console.debug(`[${SCRIPT_TITLE}] 跳过 "${path}": source_id ${sourceId} < ${existingMeta.source_id}`);
      continue;
    }

    // 确定操作目标 (shared 或 characters)
    const target = resolveTarget(state, path);
    if (!target) {
      errors.push(`无法确定操作目标: "${path}"`);
      continue;
    }

    // 应用操作
    const result = applyPatch(target.obj, [remapPatch(patch, target.relativePath)]);
    if (result.applied > 0) {
      applied++;
      // 更新元信息
      state._entry_meta[metaKey] = {
        source_id: sourceId,
        user_modified: isUserModification,
      };
    }
    if (result.errors.length > 0) {
      errors.push(...result.errors);
    }
  }

  return { applied, skipped, errors };
}

/** 将 JSON Patch path 转换为 _entry_meta 的 key */
function patchPathToMetaKey(patchPath: string): string {
  // /shared/时间 → shared.时间
  // /characters/char_xxx/好感度 → characters.char_xxx.好感度
  return patchPath
    .slice(1)
    .split('/')
    .map(s => s.replace(/~1/g, '/').replace(/~0/g, '~'))
    .join('.');
}

/** 确定操作目标对象和相对路径 */
function resolveTarget(
  state: FrameworkState,
  patchPath: string,
): { obj: Record<string, any>; relativePath: string } | null {
  const segments = patchPath.slice(1).split('/');
  if (segments.length < 1) return null;

  const root = segments[0];

  if (root === 'shared') {
    const relPath = '/' + segments.slice(1).join('/');
    return { obj: state.shared, relativePath: relPath || '/' };
  }

  if (root === 'characters') {
    if (segments.length < 2) return null;
    const charId = segments[1];
    if (!state.characters[charId as any]) {
      state.characters[charId as any] = {};
    }
    const relPath = '/' + segments.slice(2).join('/');
    return { obj: state.characters[charId as any], relativePath: relPath || '/' };
  }

  return null;
}

/** 重映射 patch 操作的 path 为相对路径 */
function remapPatch(patch: PatchOperation, relativePath: string): PatchOperation {
  const remapped = { ...patch, path: relativePath } as PatchOperation;
  if ('from' in patch && (patch as any).from) {
    // move / copy 的 from 也需要重映射
    (remapped as any).from = relativePath; // 简化处理
  }
  return remapped;
}

/**
 * 用户发送新消息时的优先级降级
 *
 * 重置所有 user_modified 为 false，更新 source_id 为当前消息 ID。
 */
export function degradePriority(state: FrameworkState, currentMessageId: number): void {
  for (const [, meta] of Object.entries(state._entry_meta)) {
    if (meta.user_modified) {
      meta.user_modified = false;
      meta.source_id = currentMessageId;
    }
  }
}

/**
 * 会话完整性检测
 *
 * 比较当前消息数与记录的 message_count。
 * 如果当前消息数 < 记录值，说明聊天记录被删除或修改。
 */
export function checkTimelineIntegrity(
  state: FrameworkState,
  currentMessageCount: number,
): { intact: boolean; expected: number; actual: number } {
  const expected = state._meta.message_count;
  const intact = currentMessageCount >= expected;

  if (!intact) {
    console.warn(`[${SCRIPT_TITLE}] 时间线收缩: 预期 ${expected} 条消息，当前 ${currentMessageCount} 条`);
  }

  return { intact, expected, actual: currentMessageCount };
}

/** 更新元数据中的消息数 */
export function updateMessageCount(state: FrameworkState, count: number): void {
  state._meta.message_count = count;
}

/**
 * 创建楼层快照
 *
 * 基于当前状态创建一份快照，用于存储到消息楼层变量。
 */
export function createSnapshot(state: FrameworkState, changes?: PatchOperation[]): FloorSnapshot {
  return {
    timestamp: Date.now(),
    shared: _.cloneDeep(state.shared),
    characters: _.cloneDeep(state.characters),
    changes,
  };
}

/**
 * 处理 nil 值
 *
 * 扫描状态数据，将 nil 值在渲染时隐藏，但在管理器中可见。
 */
export function filterNilValues(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isNil(value)) continue;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const filtered = filterNilValues(value);
      if (Object.keys(filtered).length > 0) {
        result[key] = filtered;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}
