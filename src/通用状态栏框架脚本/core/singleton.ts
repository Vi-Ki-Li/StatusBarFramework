/**
 * 单例所有权机制
 * 确保脚本热重载时只有一个活跃实例
 */
import { uuidv4 } from '@util/common';
import { SINGLETON_KEY } from './constants';

interface OwnerRecord {
  instanceId: string;
  cleanup: () => void;
}

function getBeacon(): OwnerRecord | undefined {
  return (top as any)?.[SINGLETON_KEY];
}

function setBeacon(record: OwnerRecord | undefined): void {
  if (top) {
    (top as any)[SINGLETON_KEY] = record;
  }
}

/**
 * 声明单例所有权。如果存在旧实例，先执行其 cleanup。
 * @returns instanceId 和 release 函数
 */
export function claimOwnership(cleanup: () => void): { instanceId: string; release: () => void } {
  const oldOwner = getBeacon();
  if (oldOwner) {
    console.info(`[${SINGLETON_KEY}] 检测到旧实例 ${oldOwner.instanceId}，执行清理...`);
    try {
      oldOwner.cleanup();
    } catch (e) {
      console.error(`[${SINGLETON_KEY}] 旧实例清理失败:`, e);
    }
  }

  const instanceId = uuidv4();
  const record: OwnerRecord = { instanceId, cleanup };
  setBeacon(record);
  console.info(`[${SINGLETON_KEY}] 新实例 ${instanceId} 已声明所有权`);

  return {
    instanceId,
    release: () => {
      const current = getBeacon();
      if (current?.instanceId === instanceId) {
        setBeacon(undefined);
        console.info(`[${SINGLETON_KEY}] 实例 ${instanceId} 已释放所有权`);
      }
    },
  };
}

/** 检查当前实例是否仍然是所有者 */
export function isCurrentOwner(instanceId: string): boolean {
  return getBeacon()?.instanceId === instanceId;
}
