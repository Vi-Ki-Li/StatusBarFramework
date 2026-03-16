/**
 * 渲染器模块出口
 */
export { destroyRenderer, initRenderer, renderStatusBar } from './status-bar';
export { BUILTIN_STYLE_UNITS, findStyleUnit, getDefaultStyleUnitId } from './style-units';
export type { StyleUnit } from './style-units';
export { renderTemplate } from './template-engine';
