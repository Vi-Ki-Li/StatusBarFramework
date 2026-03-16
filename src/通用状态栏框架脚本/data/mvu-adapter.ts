/**
 * MVU 兼容适配层
 *
 * 当检测到 MVU 变量框架存在时，自动挂接 MVU 事件，
 * 将 MVU 的数据变更同步到本框架的 FrameworkState。
 *
 * 设计原则 (DEC-002):
 * - 框架独立运行，不强依赖 MVU
 * - MVU 存在时提供无缝兼容
 * - 利用 MVU 的 VARIABLE_UPDATE_ENDED 事件监听数据变化
 */
import { SCRIPT_TITLE } from '../core/constants';
import { getOrCreateCharId } from './char-id';
import type { FrameworkState } from './types';
import { loadState, saveState } from './variables';

/** MVU 适配器状态 */
let mvuConnected = false;

/** 检测 MVU 是否可用 */
export function isMvuAvailable(): boolean {
  try {
    return typeof Mvu !== 'undefined' && Mvu !== null;
  } catch {
    return false;
  }
}

/**
 * 初始化 MVU 适配层
 *
 * 等待 MVU 初始化完成后，监听其事件。
 * 如果 MVU 不存在，静默跳过。
 */
export async function initMvuAdapter(): Promise<boolean> {
  if (mvuConnected) return true;

  if (!isMvuAvailable()) {
    console.info(`[${SCRIPT_TITLE}] MVU 未检测到，以独立模式运行`);
    return false;
  }

  try {
    await waitGlobalInitialized('Mvu');
    console.info(`[${SCRIPT_TITLE}] MVU 已连接，启用兼容模式`);

    // 监听 MVU 变量更新结束事件
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (newVars: Mvu.MvuData, oldVars: Mvu.MvuData) => {
      onMvuUpdate(newVars, oldVars);
    });

    mvuConnected = true;
    return true;
  } catch (e) {
    console.warn(`[${SCRIPT_TITLE}] MVU 适配初始化失败:`, e);
    return false;
  }
}

/** MVU 数据更新回调 */
function onMvuUpdate(newVars: Mvu.MvuData, oldVars: Mvu.MvuData): void {
  const newData = _.get(newVars, 'stat_data');
  const oldData = _.get(oldVars, 'stat_data');

  if (!newData || _.isEqual(newData, oldData)) return;

  try {
    const state = loadState();
    syncMvuDataToState(state, newData);
    saveState(state);
    console.debug(`[${SCRIPT_TITLE}] MVU 数据已同步到框架状态`);
  } catch (e) {
    console.error(`[${SCRIPT_TITLE}] MVU 同步失败:`, e);
  }
}

/**
 * 将 MVU 的 stat_data 同步到框架状态
 *
 * MVU 的 stat_data 通常结构为:
 * { 角色名: { 属性: 值, ... }, ... }
 *
 * 我们需要将角色名映射为 char_id。
 */
function syncMvuDataToState(state: FrameworkState, statData: Record<string, any>): void {
  for (const [key, value] of Object.entries(statData)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 看起来像角色数据（嵌套对象）
      const { charId } = getOrCreateCharId(state, key);
      // 合并数据（MVU 的最新值优先）
      state.characters[charId] = _.merge(state.characters[charId] || {}, value);
    } else {
      // 扁平值视为共享数据
      state.shared[key] = value;
    }
  }
}

/**
 * 将框架状态导出为 MVU 兼容的 stat_data 格式
 *
 * 反向转换：char_id → 角色名，合并 shared 数据
 */
export function exportToMvuFormat(state: FrameworkState): Record<string, any> {
  const result: Record<string, any> = { ...state.shared };

  for (const [charId, data] of Object.entries(state.characters)) {
    const info = state._characters[charId as any];
    if (info) {
      result[info.name] = data;
    }
  }

  return result;
}

/** 获取 MVU 连接状态 */
export function isMvuConnected(): boolean {
  return mvuConnected;
}
