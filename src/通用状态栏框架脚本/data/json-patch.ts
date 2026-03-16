/**
 * JSON Patch (RFC 6902) 解析器
 *
 * 独立实现，不依赖 MVU。
 * 支持 add / remove / replace / move / copy / test 操作。
 * 使用 lodash 进行路径操作。
 */
import { PatchDocumentSchema } from './schemas';
import type { PatchOperation } from './types';

/** JSON Patch 路径转 lodash 路径 (e.g., "/a/b/0/c" → "a.b[0].c") */
export function patchPathToLodashPath(patchPath: string): string {
  if (!patchPath || patchPath === '/') return '';
  // 移除开头的 /，按 / 分割
  const segments = patchPath
    .slice(1)
    .split('/')
    .map(s => {
      // RFC 6902 转义: ~1 → /, ~0 → ~
      return s.replace(/~1/g, '/').replace(/~0/g, '~');
    });
  return segments
    .map((s, i) => {
      // 纯数字作为数组索引
      if (/^\d+$/.test(s)) return `[${s}]`;
      // 包含点或特殊字符的需要用方括号
      if (/[.\[\]]/.test(s)) return `["${s}"]`;
      return i === 0 ? s : `.${s}`;
    })
    .join('');
}

/** 解析并验证 JSON Patch 文档 */
export function parsePatchDocument(input: unknown): PatchOperation[] | null {
  const result = PatchDocumentSchema.safeParse(input);
  if (!result.success) {
    console.warn('[JSON Patch] 验证失败:', result.error.issues);
    return null;
  }
  return result.data as PatchOperation[];
}

/** 从 AI 消息中提取 JSON Patch 数组 */
export function extractPatchFromMessage(message: string): PatchOperation[] | null {
  // 尝试多种格式匹配
  const patterns = [
    // ```json [...] ``` 代码块
    /```(?:json)?\s*(\[[\s\S]*?\])\s*```/,
    // 直接的 JSON 数组
    /(\[[\s\S]*?\])/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        const ops = parsePatchDocument(parsed);
        if (ops && ops.length > 0) return ops;
      } catch {
        // 继续尝试下一个 pattern
      }
    }
  }

  return null;
}

/**
 * 应用 JSON Patch 操作到目标对象
 *
 * @param target 目标对象（会被原地修改）
 * @param operations JSON Patch 操作数组
 * @returns 应用结果 { success, applied, errors }
 */
export function applyPatch(
  target: Record<string, any>,
  operations: PatchOperation[],
): { success: boolean; applied: number; errors: string[] } {
  const errors: string[] = [];
  let applied = 0;

  for (const op of operations) {
    try {
      applyOperation(target, op);
      applied++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`op "${op.op}" at "${(op as any).path}": ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

/** 应用单个操作 */
function applyOperation(target: Record<string, any>, op: PatchOperation): void {
  switch (op.op) {
    case 'add':
    case 'replace': {
      const path = patchPathToLodashPath(op.path);
      if (!path) {
        // 根路径替换 — 清空并合并
        Object.keys(target).forEach(k => delete target[k]);
        Object.assign(target, op.value);
      } else {
        // 确保父路径存在
        ensureParentPath(target, op.path);
        _.set(target, path, op.value);
      }
      break;
    }

    case 'remove': {
      const path = patchPathToLodashPath(op.path);
      if (!path) throw new Error('不能移除根路径');
      if (!_.has(target, path)) {
        // remove 允许静默忽略不存在的路径
        return;
      }
      _.unset(target, path);
      // 如果删除的是数组元素，需要清理 undefined 空洞
      cleanupArrayHoles(target, op.path);
      break;
    }

    case 'move': {
      const fromPath = patchPathToLodashPath(op.from);
      const toPath = patchPathToLodashPath(op.path);
      const value = _.get(target, fromPath);
      if (value === undefined) throw new Error(`源路径 "${op.from}" 不存在`);
      _.unset(target, fromPath);
      cleanupArrayHoles(target, op.from);
      ensureParentPath(target, op.path);
      _.set(target, toPath, value);
      break;
    }

    case 'copy': {
      const fromPath = patchPathToLodashPath(op.from);
      const toPath = patchPathToLodashPath(op.path);
      const value = _.cloneDeep(_.get(target, fromPath));
      if (value === undefined) throw new Error(`源路径 "${op.from}" 不存在`);
      ensureParentPath(target, op.path);
      _.set(target, toPath, value);
      break;
    }

    case 'test': {
      const path = patchPathToLodashPath(op.path);
      const actual = _.get(target, path);
      if (!_.isEqual(actual, op.value)) {
        throw new Error(`测试失败: "${op.path}" 期望 ${JSON.stringify(op.value)}, 实际 ${JSON.stringify(actual)}`);
      }
      break;
    }
  }
}

/** 确保父路径存在，按需创建中间对象 */
function ensureParentPath(target: Record<string, any>, patchPath: string): void {
  const segments = patchPath.slice(1).split('/');
  if (segments.length <= 1) return;

  const parentSegments = segments.slice(0, -1);
  const parentPath = '/' + parentSegments.join('/');
  const lodashParent = patchPathToLodashPath(parentPath);

  if (lodashParent && !_.has(target, lodashParent)) {
    // 判断下一级是否应为数组
    const nextSegment = segments[segments.length - 1];
    const isArrayIndex = /^\d+$/.test(nextSegment);
    _.set(target, lodashParent, isArrayIndex ? [] : {});
  }
}

/** 清理数组中的 undefined 空洞（unset 数组元素后会留下 empty） */
function cleanupArrayHoles(target: Record<string, any>, patchPath: string): void {
  const segments = patchPath.slice(1).split('/');
  if (segments.length < 2) return;

  const parentSegments = segments.slice(0, -1);
  const parentPath = '/' + parentSegments.join('/');
  const lodashParent = patchPathToLodashPath(parentPath);
  const parent = _.get(target, lodashParent);

  if (Array.isArray(parent)) {
    const cleaned = parent.filter(item => item !== undefined);
    _.set(target, lodashParent, cleaned);
  }
}
