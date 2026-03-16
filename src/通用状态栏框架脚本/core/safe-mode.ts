/**
 * 安全模式
 * Ctrl+Alt+Shift+R 强制恢复默认外观
 */
import { CSS_PREFIX, SAFE_MODE_KEYS } from './constants';

let safeMode = false;

/** 注册安全模式快捷键监听 */
export function registerSafeMode(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (
      e.ctrlKey === SAFE_MODE_KEYS.ctrlKey &&
      e.altKey === SAFE_MODE_KEYS.altKey &&
      e.shiftKey === SAFE_MODE_KEYS.shiftKey &&
      e.key === SAFE_MODE_KEYS.key
    ) {
      e.preventDefault();
      toggleSafeMode();
    }
  };

  // 在 top 窗口监听，确保任何情况下都能触发
  top?.document.addEventListener('keydown', handler);

  return () => {
    top?.document.removeEventListener('keydown', handler);
  };
}

/** 切换安全模式 */
function toggleSafeMode(): void {
  safeMode = !safeMode;

  if (safeMode) {
    enterSafeMode();
  } else {
    exitSafeMode();
  }
}

/** 进入安全模式：移除所有自定义样式，恢复默认 */
function enterSafeMode(): void {
  // 禁用所有框架注入的样式
  const styleElements = top?.document.querySelectorAll(`[data-${CSS_PREFIX}-style]`);
  styleElements?.forEach(el => {
    (el as HTMLElement).dataset[`${CSS_PREFIX}Disabled`] = 'true';
    (el as HTMLStyleElement).disabled = true;
  });

  // 移除用户自定义全局样式
  const userStyles = top?.document.querySelectorAll(`[data-${CSS_PREFIX}-user-style]`);
  userStyles?.forEach(el => {
    (el as HTMLStyleElement).disabled = true;
  });

  toastr.warning('安全模式已启用。所有自定义样式已禁用。再次按 Ctrl+Alt+Shift+R 恢复。', '安全模式', { timeOut: 5000 });
  console.info(`[安全模式] 已启用`);
}

/** 退出安全模式：恢复所有样式 */
function exitSafeMode(): void {
  const disabledElements = top?.document.querySelectorAll(`[data-${CSS_PREFIX}-disabled]`);
  disabledElements?.forEach(el => {
    delete (el as HTMLElement).dataset[`${CSS_PREFIX}Disabled`];
    (el as HTMLStyleElement).disabled = false;
  });

  toastr.success('安全模式已关闭。自定义样式已恢复。', '安全模式');
  console.info(`[安全模式] 已关闭`);
}

export function isSafeMode(): boolean {
  return safeMode;
}
