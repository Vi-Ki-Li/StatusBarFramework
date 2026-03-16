/**
 * 角色 ID 系统
 *
 * 确保数据不会因角色改名而丢失。
 * - 角色数据以 char_id 为键
 * - 维护 char_id ↔ 显示名 的映射表
 * - 用户角色固定 ID 为 char_user
 */
import type { CharId, CharacterInfo, FrameworkState } from './types';
import { CHAR_USER_ID } from './types';

/** 生成新的角色 ID */
export function generateCharId(name: string): CharId {
  // 用时间戳 + 名称哈希确保唯一性
  const hash = simpleHash(name);
  const ts = Date.now().toString(36);
  return `char_${ts}_${hash}`;
}

/** 简单字符串哈希 */
function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/** 根据角色名查找已有的 char_id，未找到则返回 undefined */
export function findCharIdByName(state: FrameworkState, name: string): CharId | undefined {
  for (const [id, info] of Object.entries(state._characters)) {
    if (info.name === name) return id as CharId;
  }
  return undefined;
}

/** 获取或创建角色 ID — 如果角色名已存在则返回已有 ID，否则创建新角色 */
export function getOrCreateCharId(
  state: FrameworkState,
  name: string,
  isPresent = true,
): { charId: CharId; created: boolean } {
  // 用户角色特殊处理
  if (name === '{{user}}' || name === 'user') {
    if (!state._characters[CHAR_USER_ID]) {
      state._characters[CHAR_USER_ID] = {
        char_id: CHAR_USER_ID,
        name,
        isPresent: true,
      };
      state.characters[CHAR_USER_ID] = {};
    }
    return { charId: CHAR_USER_ID, created: false };
  }

  const existing = findCharIdByName(state, name);
  if (existing) {
    return { charId: existing, created: false };
  }

  const charId = generateCharId(name);
  state._characters[charId] = {
    char_id: charId,
    name,
    isPresent,
  };
  state.characters[charId] = {};
  return { charId, created: true };
}

/** 更新角色名称（改名时保留数据） */
export function renameCharacter(state: FrameworkState, charId: CharId, newName: string): boolean {
  const info = state._characters[charId];
  if (!info) return false;
  info.name = newName;
  return true;
}

/** 删除角色及其所有数据 */
export function deleteCharacter(state: FrameworkState, charId: CharId): boolean {
  if (charId === CHAR_USER_ID) return false; // 不允许删除用户角色
  if (!state._characters[charId]) return false;

  delete state._characters[charId];
  delete state.characters[charId];

  // 清理该角色的 _entry_meta
  const prefix = `characters.${charId}.`;
  for (const key of Object.keys(state._entry_meta)) {
    if (key.startsWith(prefix)) {
      delete state._entry_meta[key];
    }
  }

  return true;
}

/** 设置角色在场状态 */
export function setCharacterPresence(state: FrameworkState, charId: CharId, isPresent: boolean): boolean {
  const info = state._characters[charId];
  if (!info) return false;
  info.isPresent = isPresent;
  return true;
}

/** 获取所有在场角色 */
export function getPresentCharacters(state: FrameworkState): CharacterInfo[] {
  return Object.values(state._characters).filter(c => c.isPresent);
}

/** 获取所有角色 */
export function getAllCharacters(state: FrameworkState): CharacterInfo[] {
  return Object.values(state._characters);
}
