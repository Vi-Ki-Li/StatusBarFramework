/**
 * 状态栏渲染器
 *
 * 从聊天变量读取数据，匹配定义条目，应用样式单元，
 * 生成 HTML 并注入到聊天消息 DOM 中。
 */
import { SCRIPT_TITLE } from '../core/constants';
import type { CategoryDef, DefinitionEntry } from '../data/definitions';
import * as defStore from '../data/definitions-store';
import type { LayoutConfig, LayoutNode } from '../data/layouts-store';
import * as layoutStore from '../data/layouts-store';
import { getAllStyleUnits, getGlobalTheme, type StoredStyleUnit } from '../data/styles-store';
import { getAllThemes, type ThemeCombo } from '../data/themes-store';
import type { CharId, CharacterInfo, FrameworkState } from '../data/types';
import { CHAR_USER_ID, isNil } from '../data/types';
import { loadConfig, loadState } from '../data/variables';
import { BUILTIN_STYLE_UNITS, findStyleUnit, getDefaultStyleUnitId, type StyleUnit } from './style-units';
import { renderTemplate } from './template-engine';

const CONTAINER_ATTR = 'data-omg-statusbar';

let activeCharId: CharId | null = null;
let cachedCategories: CategoryDef[] = [];
let cachedEntries: DefinitionEntry[] = [];
let cachedLayouts: LayoutConfig[] = [];
let cachedThemes: ThemeCombo[] = [];
let cachedCustomUnits: StoredStyleUnit[] = [];
const injectedCssIds = new Set<string>();
let $dynamicStyle: JQuery | null = null;
let $globalThemeStyle: JQuery | null = null;

// ─── 定义数据加载 ───

async function loadDefinitions(): Promise<void> {
  try {
    cachedCategories = await defStore.getAllCategories();
    cachedEntries = await defStore.getAllEntries();
    cachedLayouts = await layoutStore.getAllLayouts();
    cachedThemes = await getAllThemes();
    cachedCustomUnits = await getAllStyleUnits();

    const globalTheme = await getGlobalTheme();
    if (globalTheme?.css) {
      if (!$globalThemeStyle) {
        $globalThemeStyle = $('<style data-omg-global-theme>').appendTo('head');
      }
      $globalThemeStyle.text(globalTheme.css);
    } else {
      $globalThemeStyle?.remove();
      $globalThemeStyle = null;
    }
  } catch (e) {
    console.warn(`[${SCRIPT_TITLE}] 加载定义失败:`, e);
  }
}

// ─── 动态 CSS 注入 ───

function ensureDynamicCSS(unit: StyleUnit): void {
  if (!unit.css || injectedCssIds.has(unit.id)) return;
  if (!$dynamicStyle) {
    $dynamicStyle = $('<style data-omg-su-css>').appendTo('head');
  }
  $dynamicStyle.append(`\n/* ${unit.id} */\n${unit.css}\n`);
  injectedCssIds.add(unit.id);
}

// ─── 单条目渲染 ───

function renderEntry(def: DefinitionEntry, value: any, unit: StyleUnit): string {
  const data: Record<string, any> = {
    name: def.name,
    icon: def.icon,
    value: isNil(value) ? '' : value,
    key: def.key,
  };

  if (typeof value === 'number') {
    const max = def.validation.max ?? 100;
    const min = def.validation.min ?? 0;
    data._percent = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  }

  if (typeof value === 'boolean') {
    data._boolClass = value ? 'on' : 'off';
    data._boolText = value ? '是' : '否';
  }

  ensureDynamicCSS(unit);
  return renderTemplate(unit.template, data);
}

// ─── 角色选择栏 ───

function buildTabs(chars: Record<CharId, CharacterInfo>, active: CharId | null): string {
  const present = Object.values(chars).filter(c => c.isPresent);
  if (present.length <= 1) return '';

  const tabs = present
    .map(ch => {
      const cls = ch.char_id === active ? ' omg-sb__tab--active' : '';
      const label = ch.char_id === CHAR_USER_ID ? ch.name || '用户' : ch.name;
      return `<button class="omg-sb__tab${cls}" data-omg-char-id="${ch.char_id}">${label}</button>`;
    })
    .join('');

  return `<div class="omg-sb__tabs">${tabs}</div>`;
}

interface RenderContext {
  layout: LayoutConfig | null;
  styleOverrides: Record<string, string>;
}

function resolveRenderContext(): RenderContext {
  const config = loadConfig();
  const theme = cachedThemes.find(t => t.id === config.activeThemeId) ?? null;
  const layout = theme?.layoutId ? (cachedLayouts.find(l => l.id === theme.layoutId) ?? null) : null;
  return {
    layout,
    styleOverrides: theme?.styleOverrides ?? {},
  };
}

function getNodeStyle(node: LayoutNode): string {
  const parts: string[] = [];

  if (node.type === 'container') {
    const mode = node.layoutMode ?? 'flex-col';
    if (mode === 'flex-row' || mode === 'flex-col') {
      parts.push('display:flex');
      parts.push(`flex-direction:${mode === 'flex-row' ? 'row' : 'column'}`);
      if (node.flexWrap) parts.push('flex-wrap:wrap');
    } else if (mode === 'grid') {
      parts.push('display:grid');
      parts.push(`grid-template-columns:repeat(${node.gridCols ?? 2}, minmax(0, 1fr))`);
    } else if (mode === 'absolute') {
      parts.push('position:relative');
      parts.push('min-height:40px');
    }
    if (node.gap) parts.push(`gap:${node.gap}`);
    if (node.padding) parts.push(`padding:${node.padding}`);
    if (node.justifyContent) parts.push(`justify-content:${node.justifyContent}`);
    if (node.alignItems) parts.push(`align-items:${node.alignItems}`);
  }

  if (node.width) parts.push(`width:${node.width}`);
  if (node.height) parts.push(`height:${node.height}`);
  if (node.customCss) parts.push(node.customCss.trim());

  return parts.filter(Boolean).join(';');
}

function renderLayoutNode(node: LayoutNode, renderedEntries: Map<string, string>, usedDefs: Set<string>): string {
  if (node.type === 'item') {
    if (!node.definitionId) return '';
    const html = renderedEntries.get(node.definitionId);
    if (!html) return '';
    usedDefs.add(node.definitionId);
    const style = getNodeStyle(node);
    return `<div class="omg-sb__layout-item"${style ? ` style="${style.replaceAll('"', '&quot;')}"` : ''}>${html}</div>`;
  }

  const childrenHTML = (node.children ?? [])
    .map(child => renderLayoutNode(child, renderedEntries, usedDefs))
    .filter(Boolean)
    .join('');

  if (!childrenHTML) return '';

  const mode = node.layoutMode ?? 'flex-col';
  const style = getNodeStyle(node);
  return `<div class="omg-sb__layout-node omg-sb__layout-node--${mode}"${style ? ` style="${style.replaceAll('"', '&quot;')}"` : ''}>${childrenHTML}</div>`;
}

// ─── 构建完整 HTML ───

function buildHTML(state: FrameworkState): string {
  const chars = state._characters;
  const present = Object.values(chars).filter(c => c.isPresent);

  if (!activeCharId || !chars[activeCharId]?.isPresent) {
    activeCharId = present.find(c => c.char_id !== CHAR_USER_ID)?.char_id ?? present[0]?.char_id ?? null;
  }

  const charData = activeCharId ? (state.characters[activeCharId] ?? {}) : {};
  const sharedData = state.shared;
  const renderContext = resolveRenderContext();

  // 按分类分组
  const groups = new Map<string, { cat: CategoryDef; items: { def: DefinitionEntry; value: any }[] }>();
  for (const cat of cachedCategories) {
    groups.set(cat.id, { cat, items: [] });
  }

  const renderedByDefId = new Map<string, string>();

  for (const def of cachedEntries) {
    const cat = cachedCategories.find(c => c.id === def.categoryId);
    if (!cat) continue;
    const src = cat.scope === 'shared' ? sharedData : charData;
    const val = _.get(src, def.key);
    if (val !== undefined) {
      groups.get(cat.id)?.items.push({ def, value: val });

      const overrideId = renderContext.styleOverrides[def.id];
      const unitId = overrideId || (def.uiType !== 'default' ? def.uiType : getDefaultStyleUnitId(def.dataType));
      const unit = findStyleUnit(unitId, cachedCustomUnits) ?? BUILTIN_STYLE_UNITS[0];
      renderedByDefId.set(def.id, renderEntry(def, val, unit));
    }
  }

  // 未定义条目 → "其他"
  const definedKeys = new Set(cachedEntries.map(e => e.key));
  const otherItems: { key: string; value: any }[] = [];

  function collectOther(obj: Record<string, any>, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('_')) continue;
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        collectOther(v, full);
      } else if (!definedKeys.has(full)) {
        otherItems.push({ key: full, value: v });
      }
    }
  }

  collectOther(sharedData);
  if (activeCharId) collectOther(charData);

  // 渲染各分类
  let sectionsHTML = '';

  if (renderContext.layout) {
    const usedDefs = new Set<string>();
    const layoutHTML = renderLayoutNode(renderContext.layout.root, renderedByDefId, usedDefs);
    if (layoutHTML) {
      sectionsHTML += `
        <div class="omg-sb__section omg-sb__section--layout" data-omg-section="layout">
          <div class="omg-sb__section-header" data-omg-toggle>
            <i class="fa-solid fa-grip omg-sb__section-icon"></i>
            <span class="omg-sb__section-title">布局：${renderContext.layout.name}</span>
            <i class="fa-solid fa-chevron-down omg-sb__section-chevron"></i>
          </div>
          <div class="omg-sb__section-body omg-sb__layout-root">${layoutHTML}</div>
        </div>`;
    }

    let unplacedHTML = '';
    for (const [defId, html] of renderedByDefId.entries()) {
      if (!usedDefs.has(defId)) {
        unplacedHTML += html;
      }
    }

    if (unplacedHTML) {
      sectionsHTML += `
        <div class="omg-sb__section omg-sb__section--unplaced" data-omg-section="unplaced">
          <div class="omg-sb__section-header" data-omg-toggle>
            <i class="fa-solid fa-layer-group omg-sb__section-icon"></i>
            <span class="omg-sb__section-title">未布局条目</span>
            <i class="fa-solid fa-chevron-down omg-sb__section-chevron"></i>
          </div>
          <div class="omg-sb__section-body">${unplacedHTML}</div>
        </div>`;
    }
  } else {
    for (const [, { cat, items }] of groups) {
      if (items.length === 0) continue;

      let entriesHTML = '';
      for (const { def } of items) {
        entriesHTML += renderedByDefId.get(def.id) ?? '';
      }

      sectionsHTML += `
        <div class="omg-sb__section" data-omg-section="${cat.id}">
          <div class="omg-sb__section-header" data-omg-toggle>
            <i class="${cat.icon || 'fa-solid fa-folder'} omg-sb__section-icon"></i>
            <span class="omg-sb__section-title">${cat.name}</span>
            <i class="fa-solid fa-chevron-down omg-sb__section-chevron"></i>
          </div>
          <div class="omg-sb__section-body">${entriesHTML}</div>
        </div>`;
    }
  }

  // "其他" 分类
  if (otherItems.length > 0) {
    const fallbackUnit = BUILTIN_STYLE_UNITS[0];
    let otherHTML = '';
    for (const { key, value } of otherItems) {
      ensureDynamicCSS(fallbackUnit);
      otherHTML += renderTemplate(fallbackUnit.template, {
        name: key,
        icon: 'fa-solid fa-circle-question',
        value: isNil(value) ? '' : value,
        key,
      });
    }

    sectionsHTML += `
      <div class="omg-sb__section omg-sb__section--other" data-omg-section="other">
        <div class="omg-sb__section-header" data-omg-toggle>
          <i class="fa-solid fa-ellipsis omg-sb__section-icon"></i>
          <span class="omg-sb__section-title">其他</span>
          <i class="fa-solid fa-chevron-down omg-sb__section-chevron"></i>
        </div>
        <div class="omg-sb__section-body">${otherHTML}</div>
      </div>`;
  }

  if (!sectionsHTML) {
    return `<div class="omg-sb omg-statusbar" ${CONTAINER_ATTR}>
      <div class="omg-sb__empty">
        <i class="fa-solid fa-chart-bar omg-sb__empty-icon"></i>
        <span class="omg-sb__empty-text">暂无状态数据</span>
      </div>
    </div>`;
  }

  const tabsHTML = buildTabs(chars, activeCharId);

  return `<div class="omg-sb omg-statusbar" ${CONTAINER_ATTR}>
    ${tabsHTML}
    <div class="omg-sb__content">${sectionsHTML}</div>
  </div>`;
}

// ─── 事件绑定 ───

function bindEvents($el: JQuery): void {
  $el.on('click', '.omg-sb__tab', function () {
    const id = $(this).data('omg-char-id') as CharId;
    if (id && id !== activeCharId) {
      activeCharId = id;
      renderStatusBar();
    }
  });

  $el.on('click', '[data-omg-toggle]', function () {
    $(this).closest('.omg-sb__section').toggleClass('omg-sb__section--collapsed');
  });
}

// ─── 公共 API ───

/** 渲染/刷新状态栏 */
export async function renderStatusBar(): Promise<void> {
  await loadDefinitions();
  const state = loadState();

  const hasData = Object.keys(state._characters).length > 0 || Object.keys(state.shared).length > 0;

  // 移除旧的
  $(`[${CONTAINER_ATTR}]`).remove();

  if (!hasData && cachedCategories.length === 0) return;

  const html = buildHTML(state);
  const $container = $(html);

  // 注入到最后一条 AI 消息后
  const $lastMes = $('#chat .mes.last_mes');
  if ($lastMes.length) {
    const $mesText = $lastMes.find('.mes_block .mes_text');
    if ($mesText.length) {
      $mesText.after($container);
    } else {
      $lastMes.append($container);
    }
  } else {
    $('#chat').append($container);
  }

  bindEvents($container);
}

/** 初始化渲染器（监听消息事件） */
export async function initRenderer(): Promise<void> {
  await loadDefinitions();
  await renderStatusBar();

  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async () => {
    await loadDefinitions();
    await renderStatusBar();
  });

  eventOn(tavern_events.USER_MESSAGE_RENDERED, async () => {
    await renderStatusBar();
  });

  eventOn(tavern_events.CHAT_CHANGED, async () => {
    activeCharId = null;
    await loadDefinitions();
    await renderStatusBar();
  });

  eventOn(tavern_events.MESSAGE_SWIPED, async () => {
    await renderStatusBar();
  });

  console.info(`[${SCRIPT_TITLE}] 状态栏渲染器已初始化`);
}

/** 销毁渲染器 */
export function destroyRenderer(): void {
  $(`[${CONTAINER_ATTR}]`).remove();
  $dynamicStyle?.remove();
  $dynamicStyle = null;
  injectedCssIds.clear();
  cachedCategories = [];
  cachedEntries = [];
  cachedCustomUnits = [];
  activeCharId = null;
  $globalThemeStyle?.remove();
  $globalThemeStyle = null;
}
