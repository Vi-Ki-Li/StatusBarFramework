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
import { destroyManager, openManager } from './manager/shell';
import { destroyRenderer, initRenderer } from './renderer';

// 导入样式（注入到脚本 iframe 的 head 中，之后通过 teleportStyle 复制到目标）
import './styles/tokens.css';
import './styles/base.css';
import './styles/manager.css';
import './styles/statusbar.css';

let cleanupSafeMode: (() => void) | null = null;
let destroyTavernStyle: (() => void) | null = null;

/** 全局清理函数，热重载时由新实例调用 */
function cleanup(): void {
  console.info(`[${SCRIPT_TITLE}] 执行清理...`);
  destroyRenderer();
  destroyManager();
  $(`[data-omg-ext-btn]`).remove();
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

  // 4. 在 #extensionsMenu 添加管理器入口按钮
  const $extMenu = $('#extensionsMenu');
  if ($extMenu.length) {
    $('<a>')
      .attr('data-omg-ext-btn', 'true')
      .addClass('list-group-item')
      .css('cursor', 'pointer')
      .html('<i class="fa-solid fa-table-columns"></i> 状态栏管理器')
      .on('click', (e) => {
        e.preventDefault();
        openManager();
      })
      .appendTo($extMenu);
    console.info(`[${SCRIPT_TITLE}] extensionsMenu 按钮已添加`);
  } else {
    console.warn(`[${SCRIPT_TITLE}] 未找到 #extensionsMenu, 跳过按钮注册`);
  }

  // 5. 注册脚本按钮
  replaceScriptButtons([{ name: '打开管理器', visible: true }]);
  eventOn(getButtonEvent('打开管理器'), () => {
    openManager();
  });

  // 6. 初始化状态栏渲染器
  initRenderer();

  // 7. 脚本卸载时清理
  $(window).on('pagehide', () => {
    cleanup();
  });

  toastr.success(`${SCRIPT_TITLE} 已加载`, undefined, { timeOut: 2000 });
});
