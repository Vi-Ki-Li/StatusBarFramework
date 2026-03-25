/**
 * 通用状态栏框架 - 主入口
 *
 * 酒馆助手脚本项目：在后台运行，通过 jQuery 操纵酒馆页面。
 * 管理器以独立 iframe 浮窗形式呈现。
 */
import { teleportStyle } from '@util/script';
import { SCRIPT_TITLE } from './core/constants';
import { registerSafeMode } from './core/safe-mode';
import { claimOwnership } from './core/singleton';
import { closeDB } from './core/storage';
import { ensurePatchHideRegex, initPatchRuntime } from './data/patch-runtime';
import { destroyManager, openManager } from './manager/shell';
import { destroyRenderer, initRenderer, renderStatusBar } from './renderer';

// 导入样式（注入到脚本 iframe 的 head 中，之后通过 teleportStyle 复制到目标）
import './styles/base.css';
import './styles/manager.css';
import './styles/statusbar.css';
import './styles/tokens.css';

let cleanupSafeMode: (() => void) | null = null;
let destroyTavernStyle: (() => void) | null = null;
let cleanupPatchRuntime: (() => void) | null = null;
let extMenuObserver: MutationObserver | null = null;
let extMenuRetryTimer: number | null = null;

const EXT_MENU_SELECTORS = [
  '#extensionsMenu',
  '#extensions_settings #extensionsMenu',
  '#extensions_settings .list-group',
];
const EXT_MENU_RETRY_INTERVAL_MS = 500;
const EXT_MENU_MAX_RETRY = 24;

function stopExtensionsMenuWatchers(): void {
  if (extMenuObserver) {
    extMenuObserver.disconnect();
    extMenuObserver = null;
  }
  if (extMenuRetryTimer !== null) {
    window.clearTimeout(extMenuRetryTimer);
    extMenuRetryTimer = null;
  }
}

function createExtensionsMenuButton($targetMenu: JQuery): void {
  if ($('[data-omg-ext-btn]').length > 0) {
    return;
  }
  $('<a>')
    .attr('data-omg-ext-btn', 'true')
    .addClass('list-group-item')
    .css('cursor', 'pointer')
    .html('<i class="fa-solid fa-table-columns"></i> 状态栏管理器')
    .on('click', e => {
      e.preventDefault();
      openManager();
    })
    .appendTo($targetMenu);
}

function tryAttachExtensionsMenuButton(): boolean {
  for (const selector of EXT_MENU_SELECTORS) {
    const $menu = $(selector).first();
    if ($menu.length === 0) {
      continue;
    }
    createExtensionsMenuButton($menu);
    return true;
  }
  return false;
}

function registerExtensionsMenuButtonWithRetry(): void {
  let retries = 0;
  const attemptAttach = (): void => {
    if (tryAttachExtensionsMenuButton()) {
      console.info(`[${SCRIPT_TITLE}] extensionsMenu 按钮已添加`);
      stopExtensionsMenuWatchers();
      return;
    }
    retries += 1;
    if (retries >= EXT_MENU_MAX_RETRY) {
      console.warn(`[${SCRIPT_TITLE}] 未找到扩展菜单容器，使用脚本按钮作为入口`);
      stopExtensionsMenuWatchers();
      return;
    }
    extMenuRetryTimer = window.setTimeout(attemptAttach, EXT_MENU_RETRY_INTERVAL_MS);
  };

  stopExtensionsMenuWatchers();
  extMenuObserver = new MutationObserver(() => {
    if (tryAttachExtensionsMenuButton()) {
      console.info(`[${SCRIPT_TITLE}] extensionsMenu 按钮已添加（延迟挂载）`);
      stopExtensionsMenuWatchers();
    }
  });
  extMenuObserver.observe(document.body, { childList: true, subtree: true });
  attemptAttach();
}

/** 全局清理函数，热重载时由新实例调用 */
function cleanup(): void {
  console.info(`[${SCRIPT_TITLE}] 执行清理...`);
  destroyRenderer();
  destroyManager();
  cleanupPatchRuntime?.();
  $(`[data-omg-ext-btn]`).remove();
  stopExtensionsMenuWatchers();
  destroyTavernStyle?.();
  cleanupSafeMode?.();
  closeDB();
  console.info(`[${SCRIPT_TITLE}] 清理完成`);
}

$(() => {
  // 1. 声明单例所有权
  const { instanceId } = claimOwnership(cleanup);
  console.info(`[${SCRIPT_TITLE}] 初始化，实例: ${instanceId}`);

  // 2. 注册安全模式
  cleanupSafeMode = registerSafeMode();

  // 3. 将状态栏 CSS 复制到酒馆页面
  const { destroy } = teleportStyle();
  destroyTavernStyle = destroy;

  // 4. 在扩展菜单添加管理器入口按钮（兼容异步渲染）
  registerExtensionsMenuButtonWithRetry();

  // 5. 注册脚本按钮
  replaceScriptButtons([
    { name: '打开管理器', visible: true },
    { name: '刷新状态栏', visible: true },
  ]);
  eventOn(getButtonEvent('打开管理器'), () => {
    openManager();
  });
  eventOn(getButtonEvent('刷新状态栏'), () => {
    void renderStatusBar();
    toastr.success('状态栏已刷新', undefined, { timeOut: 900 });
  });

  // 6. 初始化状态栏渲染器
  initRenderer();

  // 7. 初始化补丁运行时（解析 AI 输出 + 应用状态 + 隐藏补丁输出）
  cleanupPatchRuntime = initPatchRuntime();
  void ensurePatchHideRegex().catch(e => {
    console.warn(`[${SCRIPT_TITLE}] 自动配置隐藏正则失败:`, e);
  });

  // 8. 脚本卸载时清理
  $(window).on('pagehide', () => {
    cleanup();
  });

  toastr.success(`${SCRIPT_TITLE} 已加载`, undefined, { timeOut: 2000 });
});
