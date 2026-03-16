/**
 * 通用状态栏框架 - 主入口
 *
 * 酒馆助手脚本项目：在后台运行，通过 jQuery 操纵酒馆页面。
 * 管理器以独立 iframe 浮窗形式呈现。
 */
import { SCRIPT_TITLE } from './core/constants';
import { registerSafeMode } from './core/safe-mode';
import { claimOwnership } from './core/singleton';
import { closeDB } from './core/storage';
import { destroyManager, openManager } from './manager/shell';

// 导入样式（注入到脚本 iframe 的 head 中，之后通过 teleportStyle 复制到管理器 iframe）
import './styles/tokens.css';
import './styles/base.css';
import './styles/manager.css';

/** 全局清理函数，热重载时由新实例调用 */
function cleanup(): void {
  console.info(`[${SCRIPT_TITLE}] 执行清理...`);
  destroyManager();
  $(`[data-omg-ext-btn]`).remove();
  cleanupSafeMode?.();
  closeDB();
  console.info(`[${SCRIPT_TITLE}] 清理完成`);
}

let cleanupSafeMode: (() => void) | null = null;

$(() => {
  // 1. 声明单例所有权
  const { instanceId } = claimOwnership(cleanup);
  console.info(`[${SCRIPT_TITLE}] 初始化，实例: ${instanceId}`);

  // 2. 注册安全模式
  cleanupSafeMode = registerSafeMode();

  // 3. 在 #extensionsMenu 添加管理器入口按钮
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

  // 4. 注册脚本按钮
  replaceScriptButtons([{ name: '打开管理器', visible: true }]);
  eventOn(getButtonEvent('打开管理器'), () => {
    openManager();
  });

  // 5. 脚本卸载时清理
  $(window).on('pagehide', () => {
    cleanup();
  });

  toastr.success(`${SCRIPT_TITLE} 已加载`, undefined, { timeOut: 2000 });
});
