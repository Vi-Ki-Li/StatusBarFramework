/**
 * 管理器模块间导航
 *
 * 通过 Vue provide/inject 实现模块间深度链接。
 */

/** 导航目标 */
export interface NavigationTarget {
  tab: 'data-center' | 'data-studio' | 'style-workshop' | 'layout-composer' | 'system-config';
  /** 可选的上下文参数（如要编辑的样式 ID） */
  context?: Record<string, string>;
}

/** provide/inject 键 */
export const NAV_KEY = Symbol('omg-navigation') as InjectionKey<{
  navigateTo: (target: NavigationTarget) => void;
  navContext: Ref<Record<string, string>>;
}>;
