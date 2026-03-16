/**
 * 模板引擎
 *
 * 将 {{placeholder}} 替换为实际数据值。
 * 支持嵌套路径（如 {{a.b.c}}）和内置辅助占位符。
 */

/**
 * 渲染模板字符串
 *
 * 处理顺序：
 * 1. 内置辅助占位符 (如 {{progressbar:cur:max}})
 * 2. 简单路径替换 (如 {{name}}, {{stats.hp}})
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let html = resolveBuiltins(template, data);

  html = html.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
    const value = _.get(data, path.trim());
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? '是' : '否';
    return String(value);
  });

  return html;
}

/**
 * 内置辅助占位符处理
 *
 * {{progressbar:currentKey:maxKey}} → 进度条 HTML
 */
function resolveBuiltins(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{progressbar:([^:}]+):([^}]+)\}\}/g, (_match, curKey: string, maxKey: string) => {
    const cur = Number(_.get(data, curKey.trim()) ?? 0);
    const max = Number(_.get(data, maxKey.trim()) ?? 100);
    const pct = max > 0 ? Math.min(100, Math.max(0, (cur / max) * 100)) : 0;
    return `<div class="omg-sb__progress"><div class="omg-sb__progress-fill" style="width:${pct}%"></div></div>`;
  });
}
