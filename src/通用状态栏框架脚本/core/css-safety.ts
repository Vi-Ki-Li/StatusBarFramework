/**
 * CSS 安全检查
 *
 * 检测用户编写的 CSS 中可能破坏页面的危险规则。
 */

export interface CssSafetyIssue {
  severity: 'error' | 'warning';
  message: string;
}

const RULES: { pattern: RegExp; message: string; severity: 'error' | 'warning' }[] = [
  {
    pattern: /\*\s*\{[^}]*(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0)/is,
    message: '通配符 (*) 隐藏元素 — 会影响整个页面',
    severity: 'error',
  },
  {
    pattern: /(?:^|[}\s])(body|html|#chat)\s*\{[^}]*(display\s*:\s*none|visibility\s*:\s*hidden)/ims,
    message: '检测到隐藏 body/html/#chat — 页面将不可见',
    severity: 'error',
  },
  {
    pattern: /(?:^|[}\s])(body|html)\s*\{/im,
    message: '使用了 body/html 选择器，可能影响酒馆布局',
    severity: 'warning',
  },
  {
    pattern: /position\s*:\s*fixed/i,
    message: 'position: fixed 在状态栏样式中可能产生意外效果',
    severity: 'warning',
  },
  {
    pattern: /z-index\s*:\s*\d{5,}/i,
    message: '极高 z-index 可能遮挡酒馆 UI 元素',
    severity: 'warning',
  },
  {
    pattern: /!important/,
    message: '!important 可能导致样式覆盖问题',
    severity: 'warning',
  },
];

/** 检查 CSS 安全性，返回发现的问题列表 */
export function checkCssSafety(css: string): CssSafetyIssue[] {
  return RULES.filter(r => r.pattern.test(css)).map(r => ({ severity: r.severity, message: r.message }));
}

/** 是否包含严重问题 */
export function hasCriticalIssues(issues: CssSafetyIssue[]): boolean {
  return issues.some(i => i.severity === 'error');
}
