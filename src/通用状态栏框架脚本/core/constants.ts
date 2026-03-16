/** 框架常量与配置 */

/** CSS 类名前缀，防止与酒馆样式冲突 */
export const CSS_PREFIX = 'omg';

/** IndexedDB 数据库名 */
export const DB_NAME = 'omg-status-bar-framework';
export const DB_VERSION = 1;

/** IndexedDB Store 名称 */
export const STORES = {
  DEFINITIONS: 'definitions',
  STYLES: 'styles',
  LAYOUTS: 'layouts',
  THEMES: 'themes',
  NARRATIVES: 'narratives',
  CONFIG: 'config',
} as const;

/** top 窗口上的全局信标 key */
export const SINGLETON_KEY = '__omg_status_bar_owner__';

/** 安全模式快捷键 */
export const SAFE_MODE_KEYS = { ctrlKey: true, altKey: true, shiftKey: true, key: 'R' };

/** 管理器浮窗 z-index */
export const MANAGER_Z_INDEX = 10000;

/** 脚本标识 */
export const SCRIPT_TITLE = '通用状态栏框架';
