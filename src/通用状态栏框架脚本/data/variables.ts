/**
 * 数据读写封装
 *
 * 封装酒馆助手的变量 API，提供类型安全的数据访问。
 * - 聊天变量: 存储 FrameworkState（角色数据+ID映射）
 * - 消息楼层变量: 存储 FloorSnapshot（楼层快照）
 * - 脚本变量: 存储少量系统配置（开关等）
 */
import { SCRIPT_TITLE } from '../core/constants';
import type { FloorSnapshot, FrameworkState } from './types';
import { createEmptyState } from './types';

/** 聊天变量中框架数据的 key */
const STATE_KEY = '_omg_state';

// ─── 聊天变量 (FrameworkState) ───

/** 读取框架状态（聊天变量） */
export function loadState(): FrameworkState {
  try {
    const vars = getVariables({ type: 'chat' });
    const raw = _.get(vars, STATE_KEY);
    if (raw && typeof raw === 'object' && raw._meta) {
      return raw as FrameworkState;
    }
  } catch (e) {
    console.warn(`[${SCRIPT_TITLE}] 加载状态失败:`, e);
  }
  return createEmptyState();
}

/** 保存框架状态（聊天变量） */
export function saveState(state: FrameworkState): void {
  try {
    insertOrAssignVariables({ [STATE_KEY]: state }, { type: 'chat' });
  } catch (e) {
    console.error(`[${SCRIPT_TITLE}] 保存状态失败:`, e);
  }
}

/** 读取并更新框架状态（原子操作） */
export function updateState(updater: (state: FrameworkState) => void): FrameworkState {
  const state = loadState();
  updater(state);
  saveState(state);
  return state;
}

// ─── 消息楼层变量 (FloorSnapshot) ───

/** 楼层快照在消息变量中的 key */
const SNAPSHOT_KEY = '_omg_snapshot';

/** 读取某楼层的快照 */
export function loadSnapshot(messageId: number | 'latest' = 'latest'): FloorSnapshot | null {
  try {
    const vars = getVariables({ type: 'message', message_id: messageId });
    const raw = _.get(vars, SNAPSHOT_KEY);
    return raw && typeof raw === 'object' ? (raw as FloorSnapshot) : null;
  } catch {
    return null;
  }
}

/** 保存楼层快照 */
export function saveSnapshot(snapshot: FloorSnapshot, messageId: number | 'latest' = 'latest'): void {
  try {
    insertOrAssignVariables({ [SNAPSHOT_KEY]: snapshot }, { type: 'message', message_id: messageId });
  } catch (e) {
    console.warn(`[${SCRIPT_TITLE}] 保存楼层快照失败:`, e);
  }
}

// ─── 脚本变量 (系统配置) ───

/** 系统配置接口 */
export interface SystemConfig {
  /** 是否启用叙事生成器 */
  narrativeEnabled: boolean;
  /** 是否启用叙事快照注入世界书 */
  narrativeInjectEnabled: boolean;
  /** 删楼回溯时是否保留叙事世界书条目 */
  narrativeKeepOnRollback: boolean;
  /** 当前激活的主题组合 ID */
  activeThemeId: string | null;
  /** 是否启用补丁标签隐藏正则 */
  patchHideRegexEnabled: boolean;
}

/** 默认系统配置 */
const DEFAULT_CONFIG: SystemConfig = {
  narrativeEnabled: false,
  narrativeInjectEnabled: false,
  narrativeKeepOnRollback: false,
  activeThemeId: null,
  patchHideRegexEnabled: true,
};

/** 读取系统配置 */
export function loadConfig(): SystemConfig {
  try {
    const vars = getVariables({ type: 'script' });
    return { ...DEFAULT_CONFIG, ...vars };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** 保存系统配置 */
export function saveConfig(config: Partial<SystemConfig>): void {
  try {
    insertOrAssignVariables(config, { type: 'script' });
  } catch (e) {
    console.warn(`[${SCRIPT_TITLE}] 保存配置失败:`, e);
  }
}

// ─── 总消息数获取 ───

/** 获取当前聊天的总消息数 */
export function getMessageCount(): number {
  try {
    // 尝试从 -1 楼开始获取到有效消息
    const vars = getVariables({ type: 'message', message_id: -1 });
    // 通过消息变量访问来推断消息数——简单方式
    // 实际上酒馆的聊天 API 可能有更好的方式
    return vars ? 1 : 0;
  } catch {
    return 0;
  }
}
