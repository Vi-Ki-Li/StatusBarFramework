/**
 * IndexedDB 存储封装
 * 提供类型安全的 CRUD 操作
 */
import { DB_NAME, DB_VERSION, STORES } from './constants';

let dbInstance: IDBDatabase | null = null;

/** 打开/获取数据库连接 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('[IndexedDB] 打开数据库失败:', request.error);
      reject(request.error);
    };
  });
}

/** 获取指定 store 的事务 */
async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

/** 包装 IDBRequest 为 Promise */
function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StorageItem {
  id: string;
  [key: string]: any;
}

/** 获取单个记录 */
export async function getItem<T extends StorageItem>(storeName: string, id: string): Promise<T | undefined> {
  const store = await getStore(storeName);
  return promisify<T | undefined>(store.get(id));
}

/** 获取 store 中所有记录 */
export async function getAllItems<T extends StorageItem>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return promisify<T[]>(store.getAll());
}

/** 写入或更新单个记录 */
export async function putItem<T extends StorageItem>(storeName: string, item: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await promisify(store.put(item));
}

/** 删除单个记录 */
export async function deleteItem(storeName: string, id: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await promisify(store.delete(id));
}

/** 清空 store */
export async function clearStore(storeName: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await promisify(store.clear());
}

/** 批量写入记录 */
export async function putItems<T extends StorageItem>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const item of items) {
    store.put(item);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 导出整个 store 为 JSON */
export async function exportStore<T extends StorageItem>(storeName: string): Promise<T[]> {
  return getAllItems<T>(storeName);
}

/** 导入 JSON 到 store（覆盖模式） */
export async function importStore<T extends StorageItem>(storeName: string, items: T[], merge = false): Promise<void> {
  if (!merge) {
    await clearStore(storeName);
  }
  await putItems(storeName, items);
}

/** 关闭数据库连接 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
