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
const DEBUG_LAYOUT_TOGGLE = true;

let activeCharId: CharId | null = null;
let cachedCategories: CategoryDef[] = [];
let cachedEntries: DefinitionEntry[] = [];
let cachedLayouts: LayoutConfig[] = [];
let cachedThemes: ThemeCombo[] = [];
let cachedCustomUnits: StoredStyleUnit[] = [];
const injectedCssIds = new Set<string>();
let $dynamicStyle: JQuery | null = null;
let $globalThemeStyle: JQuery | null = null;
const lastEntrySnapshots = new Map<string, string>();
const layoutGroupCollapsedState = new Map<string, boolean>();
let renderGeneration = 0;
let switchSequence = 0;

function debugToggleLog(message: string, payload?: Record<string, unknown>): void {
  if (!DEBUG_LAYOUT_TOGGLE) return;
  if (payload) {
    console.log(`[${SCRIPT_TITLE}][toggle] ${message}`, payload);
    return;
  }
  console.log(`[${SCRIPT_TITLE}][toggle] ${message}`);
}

// ─── 定义数据加载 ───

async function loadDefinitions(): Promise<void> {
  try {
    // 清空动态样式缓存，确保同 ID 样式更新后能立即生效。
    injectedCssIds.clear();
    if ($dynamicStyle) {
      $dynamicStyle.text('');
    }

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
  const all = Object.values(chars);
  const present = all.filter(c => c.isPresent);
  const candidates = present.length > 1 ? present : all;
  if (candidates.length <= 1) return '';

  const tabs = candidates
    .map(ch => {
      const cls = ch.char_id === active ? ' omg-sb__tab--active' : '';
      const label = ch.char_id === CHAR_USER_ID ? ch.name || '用户' : ch.name;
      return `<button class="omg-sb__tab${cls}" data-omg-char-id="${ch.char_id}">${label}</button>`;
    })
    .join('');

  // Tabs are a runtime structure signal when >=2 characters are present.
  // Keep it visible by default even if a theme forgets to style it.
  return `<div class="omg-sb__tabs" style="display:flex">${tabs}</div>`;
}

function normalizeCharactersForTabs(state: FrameworkState): Record<CharId, CharacterInfo> {
  const chars: Record<CharId, CharacterInfo> = { ...state._characters };
  const charEntries = Object.entries(state.characters) as Array<[CharId, Record<string, any>]>;

  for (const [charId, payload] of charEntries) {
    if (!charId.startsWith('char_')) continue;
    if (chars[charId]) continue;
    const fallbackName = String(payload?.name ?? payload?.昵称 ?? payload?.显示名 ?? charId).trim() || charId;
    chars[charId] = {
      char_id: charId,
      name: fallbackName,
      isPresent: true,
    };
  }

  return chars;
}

interface RenderContext {
  layout: LayoutConfig | null;
  styleOverrides: Record<string, string>;
  entryIds: Set<string> | null;
  layoutScope: string;
}

function resolveTabCandidates(chars: Record<CharId, CharacterInfo>): CharacterInfo[] {
  const all = Object.values(chars);
  const present = all.filter(c => c.isPresent);
  return present.length > 1 ? present : all;
}

function resolveRenderContext(): RenderContext {
  const config = loadConfig();
  const theme = cachedThemes.find(t => t.id === config.activeThemeId) ?? null;
  const layout = theme?.layoutId ? (cachedLayouts.find(l => l.id === theme.layoutId) ?? null) : null;
  return {
    layout,
    styleOverrides: theme?.styleOverrides ?? {},
    entryIds: theme?.entryIds?.length ? new Set(theme.entryIds) : null,
    layoutScope: layout?.id ?? 'default',
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

function buildDynamicDefinitionOrder(node: LayoutNode, bindCategoryId: string): DefinitionEntry[] {
  const categoryEntries = cachedEntries.filter(def => def.categoryId === bindCategoryId);
  const strategy =
    (node as LayoutNode & { categorySortStrategy?: 'category' | 'layout' }).categorySortStrategy ?? 'category';
  if (strategy !== 'layout') {
    return categoryEntries;
  }

  const fromLayout = (node.children ?? [])
    .filter(child => child.type === 'item' && child.definitionId)
    .map(child => child.definitionId as string);
  const categoryMap = new Map(categoryEntries.map(entry => [entry.id, entry]));
  const ordered: DefinitionEntry[] = [];

  for (const defId of fromLayout) {
    const entry = categoryMap.get(defId);
    if (!entry) continue;
    ordered.push(entry);
    categoryMap.delete(defId);
  }

  for (const entry of categoryEntries) {
    if (categoryMap.has(entry.id)) {
      ordered.push(entry);
    }
  }

  return ordered;
}

function renderLayoutNode(
  node: LayoutNode,
  renderedEntries: Map<string, string>,
  usedDefs: Set<string>,
  layoutScope: string,
  parentAutoEqualizeItems = false,
): string {
  if (node.type === 'item') {
    if (!node.definitionId) return '';
    const html = renderedEntries.get(node.definitionId);
    if (!html) return '';
    usedDefs.add(node.definitionId);
    const styleParts: string[] = [];
    if (parentAutoEqualizeItems) {
      styleParts.push('flex:1 1 0', 'min-width:0');
    }
    const nodeStyle = getNodeStyle(node);
    if (nodeStyle) {
      styleParts.push(nodeStyle);
    }
    const style = styleParts.join(';');
    return `<div class="omg-sb__layout-item"${style ? ` style="${style.replaceAll('"', '&quot;')}"` : ''}>${html}</div>`;
  }

  const mode = node.layoutMode ?? 'flex-col';
  const autoEqualizeItems =
    mode === 'flex-row' && Boolean((node as LayoutNode & { autoEqualizeItems?: boolean }).autoEqualizeItems);

  const syncFromCategory = Boolean((node as LayoutNode & { autoSyncFromCategory?: boolean }).autoSyncFromCategory);
  const bindCategoryId = (node as LayoutNode & { bindCategoryId?: string }).bindCategoryId;
  const dynamicChildrenHTML =
    syncFromCategory && bindCategoryId
      ? buildDynamicDefinitionOrder(node, bindCategoryId)
          .map(def => {
            const html = renderedEntries.get(def.id);
            if (!html) return '';
            usedDefs.add(def.id);
            const dynamicStyle = autoEqualizeItems ? ' style="flex:1 1 0;min-width:0"' : '';
            return `<div class="omg-sb__layout-item"${dynamicStyle}>${html}</div>`;
          })
          .filter(Boolean)
          .join('')
      : '';

  const staticChildrenHTML = (node.children ?? [])
    .map(child => renderLayoutNode(child, renderedEntries, usedDefs, layoutScope, autoEqualizeItems))
    .filter(Boolean)
    .join('');

  const childrenHTML = dynamicChildrenHTML || staticChildrenHTML;

  if (!childrenHTML) return '';

  const style = getNodeStyle(node);
  const outerStyle = parentAutoEqualizeItems ? 'flex:1 1 0;min-width:0;' : '';
  const showLabel = Boolean((node as LayoutNode & { showLabel?: boolean }).showLabel);
  const collapsible = Boolean((node as LayoutNode & { collapsible?: boolean }).collapsible);
  const groupTitle = node.label?.trim() || '分组';
  const collapsedKey = `${layoutScope}:${node.id}`;
  const groupCollapsed = collapsible && layoutGroupCollapsedState.get(collapsedKey) === true;

  if (!showLabel && !collapsible) {
    const composedStyle = `${outerStyle}${style}`;
    return `<div class="omg-sb__layout-node omg-sb__layout-node--${mode}"${composedStyle ? ` style="${composedStyle.replaceAll('"', '&quot;')}"` : ''}>${childrenHTML}</div>`;
  }

  if (collapsible) {
    return `<details class="omg-sb__layout-node omg-sb__layout-group omg-sb__layout-group--collapsible${groupCollapsed ? ' omg-sb__layout-group--collapsed' : ''}" data-omg-layout-node-id="${node.id}" data-omg-layout-scope="${layoutScope}"${outerStyle ? ` style="${outerStyle}"` : ''}${groupCollapsed ? '' : ' open'}>
    <summary class="omg-sb__layout-group-header" data-omg-layout-toggle>
      <span class="omg-sb__layout-group-title">${groupTitle}</span>
      <i class="fa-solid fa-chevron-down omg-sb__layout-group-chevron"></i>
    </summary>
    <div class="omg-sb__layout-group-body omg-sb__layout-node omg-sb__layout-node--${mode}"${style ? ` style="${style.replaceAll('"', '&quot;')}"` : ''}>${childrenHTML}</div>
  </details>`;
  }

  return `<div class="omg-sb__layout-node omg-sb__layout-group" data-omg-layout-node-id="${node.id}" data-omg-layout-scope="${layoutScope}"${outerStyle ? ` style="${outerStyle}"` : ''}>
    <div class="omg-sb__layout-group-header">
      <span class="omg-sb__layout-group-title">${groupTitle}</span>
    </div>
    <div class="omg-sb__layout-group-body omg-sb__layout-node omg-sb__layout-node--${mode}"${style ? ` style="${style.replaceAll('"', '&quot;')}"` : ''}>${childrenHTML}</div>
  </div>`;
}

function computeEntrySnapshot(scope: 'shared' | 'character', defId: string, value: unknown): string {
  return `${scope}:${defId}:${JSON.stringify(value)}`;
}

function wrapRenderedEntry(html: string, changed: boolean): string {
  return `<div class="omg-sb__entry${changed ? ' omg-sb__entry--changed' : ''}">${html}</div>`;
}

// ─── 构建完整 HTML ───

function buildHTML(state: FrameworkState): string {
  const chars = normalizeCharactersForTabs(state);
  const tabCandidates = resolveTabCandidates(chars);

  if (!activeCharId || !tabCandidates.some(c => c.char_id === activeCharId)) {
    activeCharId = tabCandidates.find(c => c.char_id !== CHAR_USER_ID)?.char_id ?? tabCandidates[0]?.char_id ?? null;
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
    if (renderContext.entryIds && !renderContext.entryIds.has(def.id)) continue;

    const cat = cachedCategories.find(c => c.id === def.categoryId);
    if (!cat) continue;
    const src = cat.scope === 'shared' ? sharedData : charData;
    const val = _.get(src, def.key);
    if (val !== undefined) {
      groups.get(cat.id)?.items.push({ def, value: val });

      const overrideId = renderContext.styleOverrides[def.id];
      const unitId = overrideId || (def.uiType !== 'default' ? def.uiType : getDefaultStyleUnitId(def.dataType));
      const unit = findStyleUnit(unitId, cachedCustomUnits) ?? BUILTIN_STYLE_UNITS[0];
      const snapshotKey = `${cat.scope}:${activeCharId ?? 'none'}:${def.id}`;
      const nextSnapshot = computeEntrySnapshot(cat.scope, def.id, val);
      const prevSnapshot = lastEntrySnapshots.get(snapshotKey);
      const changed = prevSnapshot !== undefined && prevSnapshot !== nextSnapshot;
      lastEntrySnapshots.set(snapshotKey, nextSnapshot);
      renderedByDefId.set(def.id, wrapRenderedEntry(renderEntry(def, val, unit), changed));
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
    const layoutHTML = renderLayoutNode(
      renderContext.layout.root,
      renderedByDefId,
      usedDefs,
      renderContext.layoutScope,
    );
    if (layoutHTML) {
      sectionsHTML += `
        <details class="omg-sb__section omg-sb__section--layout" data-omg-section="layout" open>
          <summary class="omg-sb__section-header" data-omg-section-toggle>
            <i class="fa-solid fa-grip omg-sb__section-icon"></i>
            <span class="omg-sb__section-title">布局：${renderContext.layout.name}</span>
            <i class="fa-solid fa-chevron-down omg-sb__section-chevron"></i>
          </summary>
          <div class="omg-sb__section-body omg-sb__layout-root">${layoutHTML}</div>
        </details>`;
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

function renderActiveCharacterInPlace($scope: JQuery): boolean {
  if ($scope.length === 0) return false;

  const state = loadState();
  const html = buildHTML(state);
  const $nextRoot = $(html).first();
  const $nextContent = $nextRoot.find('.omg-sb__content').first();
  const $nextTabs = $nextRoot.find('.omg-sb__tabs').first();

  const $currentContent = $scope.find('.omg-sb__content').first();
  const $currentTabs = $scope.find('.omg-sb__tabs').first();

  if ($currentContent.length === 0 || $nextContent.length === 0) {
    return false;
  }

  if ($nextTabs.length > 0) {
    if ($currentTabs.length > 0) {
      $currentTabs.replaceWith($nextTabs);
    } else {
      $scope.prepend($nextTabs);
    }
  } else if ($currentTabs.length > 0) {
    $currentTabs.remove();
  }

  $currentContent.replaceWith($nextContent);
  bindEvents($scope);
  return true;
}

async function switchCharacter($scope: JQuery, nextCharId: CharId): Promise<void> {
  const prevCharId = activeCharId;
  const switchId = ++switchSequence;
  activeCharId = nextCharId;

  debugToggleLog('switch-start', {
    switchId,
    prevCharId,
    nextCharId,
  });

  let rerenderCount = 0;

  try {
    const committed = renderActiveCharacterInPlace($scope);
    if (committed) {
      rerenderCount += 1;
      debugToggleLog('switch-commit', {
        switchId,
        mode: 'in-place',
        rerenderCount,
      });
      debugToggleLog('switch-end', {
        switchId,
        rerenderCount,
      });
      return;
    }
  } catch (error) {
    console.warn(`[${SCRIPT_TITLE}] tab in-place switch failed, fallback to full render`, error);
  }

  await renderStatusBar();
  rerenderCount += 1;

  debugToggleLog('switch-commit', {
    switchId,
    mode: 'full-render-fallback',
    rerenderCount,
  });
  debugToggleLog('switch-end', {
    switchId,
    rerenderCount,
  });
}

// ─── 事件绑定 ───

function bindEvents($scope: JQuery): void {
  // 在容器内就地绑定，避免在 iframe 文档绑定到错误 document。
  $scope.off('.omg-sb');
  debugToggleLog('rebind scope handlers', {
    scopeNodeCount: $scope.length,
  });

  $scope.on('click.omg-sb', '.omg-sb__tab', function () {
    const id = $(this).data('omg-char-id') as CharId;
    if (id && id !== activeCharId) {
      void switchCharacter($scope, id);
    }
  });

  $scope.on('click.omg-sb', '[data-omg-toggle]', function () {
    const $section = $(this).closest('.omg-sb__section');
    const beforeCollapsed = $section.hasClass('omg-sb__section--collapsed');
    $section.toggleClass('omg-sb__section--collapsed');
    debugToggleLog('legacy section click toggled', {
      sectionKey: String($section.attr('data-omg-section') ?? ''),
      beforeCollapsed,
      afterCollapsed: $section.hasClass('omg-sb__section--collapsed'),
    });
  });

  $scope.on(
    'click.omg-sb',
    'details.omg-sb__section > summary.omg-sb__section-header, details.omg-sb__layout-group--collapsible > summary.omg-sb__layout-group-header',
    function (event) {
      const summary = event.currentTarget as HTMLElement;
      const details = summary.parentElement as HTMLDetailsElement | null;
      if (!details || details.dataset.omgAnimating === '1') return;

      const body = details.querySelector<HTMLElement>('.omg-sb__section-body, .omg-sb__layout-group-body');
      if (!body) return;

      // 接管 open/close，保证展开和收起都走同一套动画链路。
      event.preventDefault();
      details.dataset.omgAnimating = '1';
      const wasOpen = details.open;

      // 兜底写入动画基线，避免主题覆盖或 reduced-motion 导致无动画。
      body.style.overflow = 'hidden';
      let animation: Animation | null = null;

      const emitTransitionLike = () => {
        try {
          body.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'max-height' }));
          body.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity' }));
        } catch {
          // 兼容性兜底：TransitionEvent 构造失败时直接忽略。
        }
      };

      const finish = () => {
        if (details.dataset.omgAnimating !== '1') return;
        delete details.dataset.omgAnimating;
        animation?.cancel();
        animation = null;
        if (wasOpen) {
          details.open = false;
        }
        body.style.maxHeight = '';
        body.style.height = '';
        body.style.opacity = '';
        body.style.overflow = '';
        emitTransitionLike();
      };

      const startHeight = Math.max(body.scrollHeight, body.getBoundingClientRect().height, 1);
      if (wasOpen) {
        body.style.height = `${Math.ceil(startHeight)}px`;
        body.style.opacity = '1';

        if (typeof body.animate === 'function') {
          animation = body.animate(
            [
              { height: `${Math.ceil(startHeight)}px`, opacity: 1 },
              { height: '0px', opacity: 0 },
            ],
            { duration: 280, easing: 'ease', fill: 'forwards' },
          );
          animation.onfinish = finish;
        } else {
          body.style.height = '0px';
          body.style.opacity = '0';
          window.setTimeout(finish, 300);
          return;
        }
      } else {
        details.open = true;
        body.style.height = '0px';
        body.style.opacity = '0';
        const expandHeight = Math.max(body.scrollHeight, 1);

        if (typeof body.animate === 'function') {
          animation = body.animate(
            [
              { height: '0px', opacity: 0 },
              { height: `${Math.ceil(expandHeight)}px`, opacity: 1 },
            ],
            { duration: 280, easing: 'ease', fill: 'forwards' },
          );
          animation.onfinish = finish;
        } else {
          body.style.height = `${Math.ceil(expandHeight)}px`;
          body.style.opacity = '1';
          window.setTimeout(finish, 300);
          return;
        }
      }

      window.setTimeout(finish, 420);
    },
  );

  // toggle 事件不冒泡，补一层作用域内直接监听，确保日志和状态持久都能触发。
  $scope.find('details.omg-sb__section, details.omg-sb__layout-group--collapsible').each((_, el) => {
    const $el = $(el);
    $el.off('toggle.omg-sb-local').on('toggle.omg-sb-local', function () {
      const isLayoutGroup = $el.hasClass('omg-sb__layout-group--collapsible');
      const isOpen = ($el.get(0) as HTMLDetailsElement | undefined)?.open ?? false;

      if (isLayoutGroup) {
        const nodeId = String($el.attr('data-omg-layout-node-id') ?? '');
        const scope = String($el.attr('data-omg-layout-scope') ?? 'default');
        const stateKey = `${scope}:${nodeId}`;
        const collapsed = !isOpen;
        $el.toggleClass('omg-sb__layout-group--collapsed', collapsed);
        if (nodeId) {
          layoutGroupCollapsedState.set(stateKey, collapsed);
        }
        debugToggleLog('layout group toggled (local)', {
          nodeId,
          scope,
          stateKey,
          collapsed,
          open: isOpen,
        });
        return;
      }

      debugToggleLog('details section toggled (local)', {
        sectionKey: String($el.attr('data-omg-section') ?? ''),
        open: isOpen,
      });
    });
  });
}

// ─── 公共 API ───

/** 渲染/刷新状态栏 */
export async function renderStatusBar(): Promise<void> {
  const generation = ++renderGeneration;
  await loadDefinitions();
  if (generation !== renderGeneration) return;
  const state = loadState();

  const hasData =
    Object.keys(state._characters).length > 0 ||
    Object.keys(state.characters).length > 0 ||
    Object.keys(state.shared).length > 0;

  // 移除旧的
  $(`[${CONTAINER_ATTR}]`).remove();

  if (!hasData && cachedCategories.length === 0) return;

  const html = buildHTML(state);
  if (generation !== renderGeneration) return;
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

  debugToggleLog('status bar injected', {
    sectionCount: $container.find('.omg-sb__section').length,
    layoutGroupHeaderCount: $container.find('[data-omg-layout-toggle]').length,
    tabCount: $container.find('.omg-sb__tab').length,
  });

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
    lastEntrySnapshots.clear();
    layoutGroupCollapsedState.clear();
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
  lastEntrySnapshots.clear();
  layoutGroupCollapsedState.clear();
  $(document).off('.omg-sb');
  $globalThemeStyle?.remove();
  $globalThemeStyle = null;
}
