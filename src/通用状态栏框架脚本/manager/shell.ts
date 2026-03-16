/**
 * 管理器浮窗控制
 * 在独立 iframe 中渲染管理器 Vue 应用
 */
import { createScriptIdIframe, teleportStyle } from '@util/script';
import { MANAGER_Z_INDEX } from '../core/constants';
import App from './App.vue';

let managerApp: ReturnType<typeof createApp> | null = null;
let $managerIframe: JQuery<HTMLIFrameElement> | null = null;

/** 打开管理器浮窗 */
export function openManager(): void {
  if ($managerIframe) {
    // 已经打开，聚焦
    $managerIframe.show();
    return;
  }

  const app = createApp(App, {
    onClose: () => closeManager(),
  }).use(createPinia());

  const $iframe = createScriptIdIframe()
    .css({
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      border: 'none',
      'z-index': MANAGER_Z_INDEX,
    })
    .appendTo('body')
    .on('load', () => {
      const iframeDoc = $iframe[0].contentDocument!;

      // 加载 Google Fonts (Inter)
      const fontLink = iframeDoc.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      iframeDoc.head.appendChild(fontLink);

      // 复制脚本中的样式到 iframe
      teleportStyle(iframeDoc.head);

      // 挂载 Vue 应用
      app.mount(iframeDoc.body);
    });

  managerApp = app;
  $managerIframe = $iframe;
}

/** 关闭管理器浮窗 */
export function closeManager(): void {
  if (managerApp) {
    managerApp.unmount();
    managerApp = null;
  }
  if ($managerIframe) {
    $managerIframe.remove();
    $managerIframe = null;
  }
}

/** 销毁管理器（脚本卸载时调用） */
export function destroyManager(): void {
  closeManager();
}
