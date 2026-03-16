/**
 * 样式单元
 *
 * 定义样式单元接口和内置默认样式单元。
 * 每个样式单元包含 HTML 模板和局部 CSS。
 */

/** 样式单元定义 */
export interface StyleUnit {
  id: string;
  name: string;
  /** HTML 模板，使用 {{placeholder}} 语法 */
  template: string;
  /** 局部 CSS */
  css: string;
  /** 是否内置只读 */
  builtin?: boolean;
}

/** 内置样式单元 */
export const BUILTIN_STYLE_UNITS: StyleUnit[] = [
  {
    id: 'builtin-text',
    name: '文本',
    builtin: true,
    template: [
      '<div class="omg-su-text">',
      '  <i class="{{icon}} omg-su-text__icon"></i>',
      '  <span class="omg-su-text__label">{{name}}</span>',
      '  <span class="omg-su-text__value">{{value}}</span>',
      '</div>',
    ].join(''),
    css: '',
  },
  {
    id: 'builtin-progress',
    name: '进度条',
    builtin: true,
    template: [
      '<div class="omg-su-progress">',
      '  <div class="omg-su-progress__header">',
      '    <i class="{{icon}} omg-su-progress__icon"></i>',
      '    <span class="omg-su-progress__label">{{name}}</span>',
      '    <span class="omg-su-progress__value">{{value}}</span>',
      '  </div>',
      '  <div class="omg-su-progress__bar">',
      '    <div class="omg-su-progress__fill" style="width:{{_percent}}%"></div>',
      '  </div>',
      '</div>',
    ].join(''),
    css: '',
  },
  {
    id: 'builtin-boolean',
    name: '布尔值',
    builtin: true,
    template: [
      '<div class="omg-su-bool">',
      '  <i class="{{icon}} omg-su-bool__icon"></i>',
      '  <span class="omg-su-bool__label">{{name}}</span>',
      '  <span class="omg-su-bool__indicator omg-su-bool__indicator--{{_boolClass}}">{{_boolText}}</span>',
      '</div>',
    ].join(''),
    css: '',
  },
  {
    id: 'builtin-badge',
    name: '徽章',
    builtin: true,
    template: [
      '<div class="omg-su-badge">',
      '  <i class="{{icon}} omg-su-badge__icon"></i>',
      '  <span class="omg-su-badge__value">{{value}}</span>',
      '  <span class="omg-su-badge__label">{{name}}</span>',
      '</div>',
    ].join(''),
    css: '',
  },
];

/** 查找样式单元 */
export function findStyleUnit(id: string, customUnits: StyleUnit[] = []): StyleUnit | undefined {
  return customUnits.find(u => u.id === id) || BUILTIN_STYLE_UNITS.find(u => u.id === id);
}

/** 根据数据类型返回默认样式单元 ID */
export function getDefaultStyleUnitId(dataType: string): string {
  switch (dataType) {
    case 'number':
      return 'builtin-progress';
    case 'boolean':
      return 'builtin-boolean';
    default:
      return 'builtin-text';
  }
}
