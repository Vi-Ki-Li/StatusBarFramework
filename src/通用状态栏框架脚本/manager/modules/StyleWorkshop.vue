<template>
  <div class="omg-sw">
    <!-- 顶栏 -->
    <div class="omg-sw__toolbar">
      <h2 class="omg-sw__title">
        <i class="fa-solid fa-palette" />
        样式工坊
        <OmgHelpTip title="样式工坊">
          创建和管理"样式单元"——状态栏条目的外观模板。使用 HTML + CSS 编写，支持
          {{ placeholder }} 占位符。内置默认样式供参考或复制。全局主题允许定制框架级外观。
        </OmgHelpTip>
      </h2>
      <div class="omg-sw__actions">
        <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="createUnit"> 新建样式 </OmgButton>
        <OmgButton icon="fa-solid fa-file-import" size="sm" @click="handleImport"> 导入 </OmgButton>
        <OmgButton icon="fa-solid fa-file-export" size="sm" @click="handleExport"> 导出 </OmgButton>
      </div>
    </div>

    <div class="omg-sw__content">
      <!-- 左侧：样式单元列表 -->
      <aside class="omg-sw__sidebar" :class="{ 'omg-sw__sidebar--collapsed': sidebarCollapsed }">
        <div class="omg-sw__sidebar-header">
          <span class="omg-sw__sidebar-header-label">样式导航</span>
          <button
            class="omg-sw__sidebar-toggle"
            type="button"
            :title="sidebarCollapsed ? '展开侧栏' : '收缩侧栏'"
            :aria-expanded="!sidebarCollapsed"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <i :class="sidebarCollapsed ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'" />
          </button>
        </div>
        <div class="omg-sw__sidebar-divider" />
        <!-- 全局主题 -->
        <button
          class="omg-sw__sidebar-item omg-sw__sidebar-item--theme"
          :class="{ 'omg-sw__sidebar-item--active': mode === 'global' }"
          @click="selectGlobalTheme"
        >
          <i class="fa-solid fa-wand-magic-sparkles omg-sw__sidebar-icon" />
          <span>全局主题</span>
        </button>

        <div class="omg-sw__sidebar-divider" />

        <!-- 内置样式 -->
        <div class="omg-sw__sidebar-section">
          <div class="omg-sw__sidebar-section-title">
            <i class="fa-solid fa-lock" />
            内置样式
          </div>
          <button
            v-for="unit in builtinUnits"
            :key="unit.id"
            class="omg-sw__sidebar-item"
            :class="{ 'omg-sw__sidebar-item--active': mode === 'unit' && selectedUnitId === unit.id }"
            draggable="true"
            @dragstart="onStyleDragStart(unit.id, true)"
            @click="selectUnit(unit.id, true)"
          >
            <i class="fa-solid fa-cube omg-sw__sidebar-icon" />
            <span>{{ unit.name }}</span>
            <span class="omg-sw__sidebar-badge">只读</span>
          </button>
        </div>

        <!-- 自定义样式 -->
        <div class="omg-sw__sidebar-section">
          <div class="omg-sw__sidebar-section-title">
            <i class="fa-solid fa-pen-ruler" />
            自定义样式
          </div>
          <button
            v-for="unit in customUnits"
            :key="unit.id"
            class="omg-sw__sidebar-item"
            :class="{ 'omg-sw__sidebar-item--active': mode === 'unit' && selectedUnitId === unit.id }"
            draggable="true"
            @dragstart="onStyleDragStart(unit.id, false)"
            @click="selectUnit(unit.id, false)"
          >
            <i class="fa-solid fa-cube omg-sw__sidebar-icon" />
            <span>{{ unit.name }}</span>
          </button>
          <div v-if="customUnits.length === 0" class="omg-sw__sidebar-empty">
            <span>还没有自定义样式</span>
          </div>
        </div>
      </aside>

      <!-- 右侧 -->
      <div class="omg-sw__main">
        <!-- 全局主题编辑器 -->
        <template v-if="mode === 'global'">
          <div class="omg-sw__editor-header">
            <h3 class="omg-sw__editor-title">
              <i class="fa-solid fa-wand-magic-sparkles" />
              全局主题
            </h3>
            <span class="omg-sw__editor-hint">自定义状态栏容器和管理器的全局样式</span>
          </div>

          <div class="omg-sw__editor-tabs">
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': globalTab === 'css' }"
              @click="globalTab = 'css'"
            >
              <i class="fa-solid fa-code" />
              CSS
            </button>
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': globalTab === 'html' }"
              @click="globalTab = 'html'"
            >
              <i class="fa-solid fa-file-code" />
              HTML 模板
            </button>
          </div>

          <div class="omg-sw__code-area">
            <textarea
              v-if="globalTab === 'css'"
              v-model="globalCss"
              class="omg-sw__code-editor"
              spellcheck="false"
              placeholder="/* 在此编写全局主题 CSS */&#10;/* 例如: */&#10;[data-omg-statusbar] {&#10;  background: linear-gradient(135deg, #1a1a2e, #16213e);&#10;}"
            />
            <textarea
              v-else
              v-model="globalHtml"
              class="omg-sw__code-editor"
              spellcheck="false"
              placeholder="<!-- 全局 HTML 模板（高级功能） -->"
            />
          </div>

          <!-- 安全检查 -->
          <div v-if="globalSafetyIssues.length > 0" class="omg-sw__safety">
            <div class="omg-sw__safety-title">
              <i class="fa-solid fa-shield-halved" />
              安全检查
            </div>
            <div
              v-for="(issue, i) in globalSafetyIssues"
              :key="i"
              class="omg-sw__safety-item"
              :class="`omg-sw__safety-item--${issue.severity}`"
            >
              <i
                :class="issue.severity === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-triangle-exclamation'"
              />
              {{ issue.message }}
            </div>
          </div>

          <div class="omg-sw__editor-actions">
            <OmgButton variant="primary" icon="fa-solid fa-check" @click="saveGlobalThemeHandler">
              保存全局主题
            </OmgButton>
          </div>
        </template>

        <!-- 样式单元编辑器 -->
        <template v-else-if="mode === 'unit' && currentUnit">
          <div class="omg-sw__editor-header">
            <h3 class="omg-sw__editor-title">
              <i class="fa-solid fa-cube" />
              {{ isBuiltin ? '查看内置样式' : '编辑样式单元' }}
            </h3>
            <div v-if="isBuiltin" class="omg-sw__editor-readonly">
              <i class="fa-solid fa-lock" />
              只读 — 可复制为自定义样式
            </div>
          </div>

          <!-- 元信息 -->
          <div class="omg-sw__meta-row">
            <OmgInput v-model="editName" label="名称" placeholder="样式名称" :disabled="isBuiltin" />
            <OmgInput v-model="editDescription" label="描述" placeholder="可选描述" :disabled="isBuiltin" />
          </div>

          <!-- 代码编辑标签页 -->
          <div class="omg-sw__editor-tabs">
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': editorTab === 'html' }"
              @click="editorTab = 'html'"
            >
              <i class="fa-solid fa-code" />
              HTML 模板
            </button>
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': editorTab === 'css' }"
              @click="editorTab = 'css'"
            >
              <i class="fa-brands fa-css3-alt" />
              CSS
            </button>
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': editorTab === 'reference' }"
              @click="editorTab = 'reference'"
            >
              <i class="fa-solid fa-book" />
              占位符参考
            </button>
            <button
              class="omg-sw__tab"
              :class="{ 'omg-sw__tab--active': editorTab === 'visual' }"
              @click="editorTab = 'visual'"
            >
              <i class="fa-solid fa-sliders" />
              可视化配置
            </button>
          </div>

          <!-- 代码区域 -->
          <div class="omg-sw__code-area">
            <textarea
              v-if="editorTab === 'html'"
              v-model="editTemplate"
              class="omg-sw__code-editor"
              spellcheck="false"
              :readonly="isBuiltin"
              placeholder="<div class='omg-su-custom'>&#10;  <i class='{{icon}}'></i>&#10;  <span>{{name}}: {{value}}</span>&#10;</div>"
            />
            <textarea
              v-else-if="editorTab === 'css'"
              v-model="editCss"
              class="omg-sw__code-editor"
              spellcheck="false"
              :readonly="isBuiltin"
              placeholder=".omg-su-custom {&#10;  display: flex;&#10;  align-items: center;&#10;  gap: 8px;&#10;}"
            />
            <div v-else-if="editorTab === 'reference'" class="omg-sw__reference">
              <div class="omg-sw__ref-section">
                <h4 class="omg-sw__ref-title">标准占位符</h4>
                <div class="omg-sw__ref-grid">
                  <div v-for="p in standardPlaceholders" :key="p.key" class="omg-sw__ref-item">
                    <code class="omg-sw__ref-code" v-text="wrapPlaceholder(p.key)" />
                    <span class="omg-sw__ref-desc">{{ p.desc }}</span>
                  </div>
                </div>
              </div>
              <div class="omg-sw__ref-section">
                <h4 class="omg-sw__ref-title">计算占位符</h4>
                <div class="omg-sw__ref-grid">
                  <div v-for="p in computedPlaceholders" :key="p.key" class="omg-sw__ref-item">
                    <code class="omg-sw__ref-code" v-text="wrapPlaceholder(p.key)" />
                    <span class="omg-sw__ref-desc">{{ p.desc }}</span>
                  </div>
                </div>
              </div>
              <div class="omg-sw__ref-section">
                <h4 class="omg-sw__ref-title">辅助函数</h4>
                <div class="omg-sw__ref-grid">
                  <div class="omg-sw__ref-item">
                    <code class="omg-sw__ref-code" v-text="wrapPlaceholder('progressbar:cur:max')" />
                    <span class="omg-sw__ref-desc">生成进度条 HTML（cur/max 为数据路径）</span>
                  </div>
                </div>
              </div>
              <div v-if="definitionKeys.length > 0" class="omg-sw__ref-section">
                <h4 class="omg-sw__ref-title">数据工作室条目 KEY</h4>
                <div class="omg-sw__ref-grid">
                  <div v-for="k in definitionKeys" :key="k" class="omg-sw__ref-item">
                    <code class="omg-sw__ref-code" v-text="wrapPlaceholder(k)" />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="omg-sw__visual">
              <div class="omg-sw__visual-header">
                <div class="omg-sw__visual-title">
                  <i class="fa-solid fa-bullseye" />
                  已选选择器：<code>{{ selectedSelector || '(未选择)' }}</code>
                </div>
                <span class="omg-sw__visual-hint">点击下方预览元素可自动选中对应类名</span>
              </div>

              <div class="omg-sw__visual-grid">
                <div class="omg-input">
                  <label class="omg-input__label">字体大小</label>
                  <input
                    v-model="visualEditor.fontSize"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="14px"
                    @change="applyVisualEditor"
                  />
                </div>
                <div class="omg-input">
                  <label class="omg-input__label">文字颜色</label>
                  <input
                    v-model="visualEditor.color"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="#ffffff"
                    @change="applyVisualEditor"
                  />
                </div>
                <div class="omg-input">
                  <label class="omg-input__label">背景色</label>
                  <input
                    v-model="visualEditor.background"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="rgba(255,255,255,.08)"
                    @change="applyVisualEditor"
                  />
                </div>
                <div class="omg-input">
                  <label class="omg-input__label">边框圆角</label>
                  <input
                    v-model="visualEditor.borderRadius"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="8px"
                    @change="applyVisualEditor"
                  />
                </div>
                <div class="omg-input">
                  <label class="omg-input__label">内边距</label>
                  <input
                    v-model="visualEditor.padding"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="6px 10px"
                    @change="applyVisualEditor"
                  />
                </div>
                <div class="omg-input">
                  <label class="omg-input__label">间距（gap）</label>
                  <input
                    v-model="visualEditor.gap"
                    class="omg-sw__visual-input"
                    type="text"
                    placeholder="8px"
                    @change="applyVisualEditor"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 实时预览 -->
          <div class="omg-sw__preview">
            <div class="omg-sw__preview-header">
              <h4 class="omg-sw__preview-title">
                <i class="fa-solid fa-eye" />
                实时预览
              </h4>
              <OmgSelect v-model="previewDataType" :options="previewDataOptions" size="sm" style="width: 120px" />
            </div>
            <div class="omg-sw__preview-container">
              <div
                ref="previewAreaRef"
                class="omg-sw__preview-area"
                @click="handlePreviewClick"
                @dragover.prevent
                @drop.prevent="handlePreviewDrop"
                v-html="previewHtml"
              />
            </div>
            <div class="omg-sw__preview-drop-hint">可将左侧样式拖到此处，应用到数据条目的默认渲染样式</div>
          </div>

          <!-- CSS 安全检查 -->
          <div v-if="unitSafetyIssues.length > 0" class="omg-sw__safety">
            <div class="omg-sw__safety-title">
              <i class="fa-solid fa-shield-halved" />
              安全检查
            </div>
            <div
              v-for="(issue, i) in unitSafetyIssues"
              :key="i"
              class="omg-sw__safety-item"
              :class="`omg-sw__safety-item--${issue.severity}`"
            >
              <i
                :class="issue.severity === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-triangle-exclamation'"
              />
              {{ issue.message }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="omg-sw__editor-actions">
            <OmgButton v-if="isBuiltin" variant="primary" icon="fa-solid fa-copy" @click="copyAsCustom">
              复制为自定义
            </OmgButton>
            <template v-else>
              <OmgButton variant="primary" icon="fa-solid fa-check" @click="saveUnitHandler"> 保存 </OmgButton>
              <OmgButton variant="danger" icon="fa-solid fa-trash-can" @click="deleteUnitHandler"> 删除 </OmgButton>
            </template>
          </div>
        </template>

        <!-- 空状态 -->
        <OmgEmpty v-else text="请从左侧选择一个样式单元" icon="fa-solid fa-palette">
          <OmgButton size="sm" variant="primary" @click="createUnit"> 创建样式单元 </OmgButton>
        </OmgEmpty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import OmgButton from '../../components/base/OmgButton.vue';
import OmgEmpty from '../../components/base/OmgEmpty.vue';
import OmgHelpTip from '../../components/base/OmgHelpTip.vue';
import OmgInput from '../../components/base/OmgInput.vue';
import OmgSelect from '../../components/base/OmgSelect.vue';
import { checkCssSafety } from '../../core/css-safety';
import type { DefinitionEntry } from '../../data/definitions';
import { getAllEntries, saveEntry } from '../../data/definitions-store';
import type { StoredStyleUnit } from '../../data/styles-store';
import * as stylesStore from '../../data/styles-store';
import { BUILTIN_STYLE_UNITS } from '../../renderer/style-units';
import { renderTemplate } from '../../renderer/template-engine';

// ─── 状态 ───

type Mode = 'none' | 'unit' | 'global';

const mode = ref<Mode>('none');
const selectedUnitId = ref<string | null>(null);
const isBuiltin = ref(false);
const customUnits = ref<StoredStyleUnit[]>([]);
const builtinUnits = BUILTIN_STYLE_UNITS;
const sidebarCollapsed = ref(false);

// 编辑状态
const editName = ref('');
const editDescription = ref('');
const editTemplate = ref('');
const editCss = ref('');
const editorTab = ref<'html' | 'css' | 'reference' | 'visual'>('html');

// 全局主题
const globalCss = ref('');
const globalHtml = ref('');
const globalTab = ref<'css' | 'html'>('css');

// 预览
const previewDataType = ref('text');
const previewDataOptions = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
];

// 定义条目 keys
const definitionKeys = ref<string[]>([]);
const definitionEntries = ref<DefinitionEntry[]>([]);
const selectedSelector = ref('');
const previewAreaRef = ref<HTMLElement | null>(null);
const dragStyleUnit = ref<{ id: string; builtin: boolean } | null>(null);
const visualEditor = reactive({
  fontSize: '',
  color: '',
  background: '',
  borderRadius: '',
  padding: '',
  gap: '',
});

// ─── 计算属性 ───

const currentUnit = computed(() => {
  if (!selectedUnitId.value) return null;
  if (isBuiltin.value) {
    return builtinUnits.find(u => u.id === selectedUnitId.value) ?? null;
  }
  return customUnits.value.find(u => u.id === selectedUnitId.value) ?? null;
});

const sampleData = computed(() => {
  const base: Record<string, any> = {
    name: '生命值',
    icon: 'fa-solid fa-heart',
  };
  switch (previewDataType.value) {
    case 'number':
      base.value = 75;
      base._percent = 75;
      break;
    case 'boolean':
      base.value = true;
      base._boolClass = 'on';
      base._boolText = '是';
      break;
    default:
      base.value = '示例文本';
  }
  return base;
});

const previewHtml = computed(() => {
  try {
    const styleTag = editCss.value ? `<style>${editCss.value}</style>` : '';
    const rendered = renderTemplate(editTemplate.value, sampleData.value);
    return styleTag + rendered;
  } catch {
    return '<span style="color:var(--omg-danger)">模板渲染出错</span>';
  }
});

const unitSafetyIssues = computed(() => checkCssSafety(editCss.value));
const globalSafetyIssues = computed(() => checkCssSafety(globalCss.value));

// ─── 占位符参考数据 ───

const standardPlaceholders = [
  { key: 'name', desc: '条目显示名称' },
  { key: 'icon', desc: '图标 CSS 类名（如 fa-solid fa-heart）' },
  { key: 'value', desc: '当前数据值' },
];

const computedPlaceholders = [
  { key: '_percent', desc: '百分比值（0-100），用于进度条样式' },
  { key: '_boolClass', desc: '布尔类名："on" 或 "off"' },
  { key: '_boolText', desc: '布尔文本："是" 或 "否"' },
];

// ─── 方法 ───

function wrapPlaceholder(key: string): string {
  return `{{${key}}}`;
}

function onStyleDragStart(unitId: string, builtin: boolean) {
  dragStyleUnit.value = { id: unitId, builtin };
}

function parseCssRuleBlock(cssText: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = reg.exec(cssText);
  if (!match) return {};
  const block = match[1];
  const props: Record<string, string> = {};
  for (const row of block.split(';')) {
    const part = row.trim();
    if (!part.includes(':')) continue;
    const [k, ...rest] = part.split(':');
    props[k.trim()] = rest.join(':').trim();
  }
  return props;
}

function setCssProperty(cssText: string, selector: string, key: string, value: string): string {
  const trimmedValue = value.trim();
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = reg.exec(cssText);

  if (!match) {
    if (!trimmedValue) return cssText;
    return `${cssText.trim()}\n\n${selector} {\n  ${key}: ${trimmedValue};\n}\n`.trim();
  }

  const full = match[0];
  const body = match[1];
  const lines = body
    .split(';')
    .map(line => line.trim())
    .filter(Boolean);

  const nextLines = lines.filter(line => !line.startsWith(`${key}:`));
  if (trimmedValue) {
    nextLines.push(`${key}: ${trimmedValue}`);
  }

  const nextBlock = `${selector} {\n  ${nextLines.join(';\n  ')}${nextLines.length > 0 ? ';' : ''}\n}`;
  return cssText.replace(full, nextBlock);
}

function syncVisualEditorFromCss() {
  if (!selectedSelector.value) return;
  const props = parseCssRuleBlock(editCss.value, selectedSelector.value);
  visualEditor.fontSize = props['font-size'] ?? '';
  visualEditor.color = props.color ?? '';
  visualEditor.background = props.background ?? '';
  visualEditor.borderRadius = props['border-radius'] ?? '';
  visualEditor.padding = props.padding ?? '';
  visualEditor.gap = props.gap ?? '';
}

function applyVisualEditor() {
  if (!selectedSelector.value || isBuiltin.value) return;
  let nextCss = editCss.value;
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'font-size', visualEditor.fontSize);
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'color', visualEditor.color);
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'background', visualEditor.background);
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'border-radius', visualEditor.borderRadius);
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'padding', visualEditor.padding);
  nextCss = setCssProperty(nextCss, selectedSelector.value, 'gap', visualEditor.gap);
  editCss.value = nextCss;
}

function handlePreviewClick(event: MouseEvent) {
  const root = previewAreaRef.value;
  const target = event.target as HTMLElement | null;
  if (!root || !target) return;
  const selectedEl = target.closest('[class]') as HTMLElement | null;
  if (!selectedEl || !root.contains(selectedEl)) return;

  const className = selectedEl.className.split(/\s+/).find(cls => cls.startsWith('omg-'));
  if (!className) return;

  selectedSelector.value = `.${className}`;
  syncVisualEditorFromCss();
  editorTab.value = 'visual';
}

async function handlePreviewDrop() {
  if (!dragStyleUnit.value) return;
  if (definitionEntries.value.length === 0) {
    toastr.warning('当前没有可应用的条目定义');
    return;
  }

  const target =
    definitionEntries.value.find(entry => entry.uiType === selectedUnitId.value) ?? definitionEntries.value[0];
  if (!target) return;

  target.uiType = dragStyleUnit.value.id;
  await saveEntry(target);
  toastr.success(`已将样式应用到条目「${target.name}」`);
  dragStyleUnit.value = null;
}

function selectUnit(id: string, builtin: boolean) {
  mode.value = 'unit';
  selectedUnitId.value = id;
  isBuiltin.value = builtin;
  editorTab.value = 'html';

  const unit = builtin ? builtinUnits.find(u => u.id === id) : customUnits.value.find(u => u.id === id);

  if (unit) {
    editName.value = unit.name;
    editDescription.value = (unit as StoredStyleUnit).description ?? '';
    editTemplate.value = unit.template;
    editCss.value = unit.css;
  }
}

async function selectGlobalTheme() {
  mode.value = 'global';
  selectedUnitId.value = null;
  isBuiltin.value = false;
  globalTab.value = 'css';

  const theme = await stylesStore.getGlobalTheme();
  globalCss.value = theme?.css ?? '';
  globalHtml.value = theme?.htmlTemplate ?? '';
}

function createUnit() {
  const unit = stylesStore.createNewStyleUnit({ name: '新样式' });
  customUnits.value.push(unit);
  selectUnit(unit.id, false);
}

async function saveUnitHandler() {
  if (!selectedUnitId.value || isBuiltin.value) return;
  if (!editName.value.trim()) {
    toastr.warning('名称不能为空');
    return;
  }

  const unit = customUnits.value.find(u => u.id === selectedUnitId.value);
  if (!unit) return;

  unit.name = editName.value.trim();
  unit.description = editDescription.value.trim();
  unit.template = editTemplate.value;
  unit.css = editCss.value;
  await stylesStore.saveStyleUnit(unit);
  toastr.success('样式已保存');
}

async function deleteUnitHandler() {
  if (!selectedUnitId.value || isBuiltin.value) return;
  if (!confirm('确定要删除这个样式单元吗？')) return;

  await stylesStore.deleteStyleUnit(selectedUnitId.value);
  customUnits.value = customUnits.value.filter(u => u.id !== selectedUnitId.value);
  mode.value = 'none';
  selectedUnitId.value = null;
  toastr.success('样式已删除');
}

function copyAsCustom() {
  if (!currentUnit.value) return;
  const unit = stylesStore.createNewStyleUnit({
    name: `${currentUnit.value.name} (副本)`,
    template: currentUnit.value.template,
    css: currentUnit.value.css,
  });
  customUnits.value.push(unit);
  selectUnit(unit.id, false);
  toastr.info('已复制为自定义样式，请修改后保存');
}

async function saveGlobalThemeHandler() {
  await stylesStore.saveGlobalTheme(globalCss.value, globalHtml.value);
  toastr.success('全局主题已保存');
}

async function handleExport() {
  const data = await stylesStore.exportStyles();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omg-styles-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastr.success('样式数据已导出');
}

async function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.units) {
        toastr.error('无效的样式文件格式');
        return;
      }
      if (!confirm('导入将覆盖现有样式数据，确定继续吗？')) return;
      await stylesStore.importStyles(data);
      await loadData();
      mode.value = 'none';
      selectedUnitId.value = null;
      toastr.success('样式数据已导入');
    } catch {
      toastr.error('导入失败：文件解析出错');
    }
  };
  input.click();
}

// ─── 初始化 ───

async function loadData() {
  customUnits.value = await stylesStore.getAllStyleUnits();
  const entries = await getAllEntries();
  definitionEntries.value = entries;
  definitionKeys.value = entries.map(e => e.key).filter(Boolean);
}

onMounted(() => loadData());
</script>

<style>
/* @doc: 样式工坊 | category: 管理器模块 | desc: 样式单元管理与编辑界面 */

.omg-sw {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--omg-space-lg);
}

.omg-sw__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-sw__title {
  font-size: var(--omg-font-lg);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-sw__title i {
  color: var(--omg-accent);
}

.omg-sw__actions {
  display: flex;
  gap: var(--omg-space-xs);
}

/* ── 内容区 ── */
.omg-sw__content {
  display: flex;
  gap: var(--omg-space-lg);
  flex: 1;
  min-height: 0;
}

/* ── 左侧栏 ── */
.omg-sw__sidebar {
  width: var(--omg-module-sidebar-width, 220px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  padding: var(--omg-space-xs);
  overflow-y: auto;
  gap: 2px;
  transition:
    width var(--omg-transition-normal),
    padding var(--omg-transition-normal);
}

.omg-sw__sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--omg-space-xs);
  padding: var(--omg-space-xs) var(--omg-space-sm);
}

.omg-sw__sidebar-header-label {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.omg-sw__sidebar-toggle {
  width: 24px;
  height: 24px;
  border: 1px solid var(--omg-border);
  background: var(--omg-bg-primary);
  color: var(--omg-text-tertiary);
  border-radius: var(--omg-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--omg-transition-fast);
}

.omg-sw__sidebar-toggle:hover {
  color: var(--omg-accent);
  border-color: var(--omg-accent);
  background: var(--omg-accent-subtle);
}

.omg-sw__sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  width: 100%;
  padding: var(--omg-space-sm) var(--omg-space-md);
  border: none;
  background: none;
  color: var(--omg-text-secondary);
  cursor: pointer;
  border-radius: var(--omg-radius-md);
  font-size: var(--omg-font-sm);
  text-align: left;
  transition: all var(--omg-transition-fast);
}

.omg-sw__sidebar-item:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-sw__sidebar-item--active {
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
}

.omg-sw__sidebar-item--theme {
  border-bottom: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md) var(--omg-radius-md) 0 0;
}

.omg-sw__sidebar-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: var(--omg-font-xs);
}

.omg-sw__sidebar-badge {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  background: var(--omg-bg-primary);
  padding: 1px 5px;
  border-radius: var(--omg-radius-sm);
  margin-left: auto;
}

.omg-sw__sidebar-divider {
  height: 1px;
  background: var(--omg-border);
  margin: var(--omg-space-xs) var(--omg-module-divider-inset, 14px);
}

.omg-sw__sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.omg-sw__sidebar-section-title {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  font-weight: var(--omg-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--omg-space-sm) var(--omg-space-md) var(--omg-space-xs);
}

.omg-sw__sidebar-empty {
  padding: var(--omg-space-md);
  text-align: center;
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-sw__sidebar--collapsed {
  width: var(--omg-module-sidebar-collapsed-width, 56px);
  padding: var(--omg-space-xs) 4px;
}

.omg-sw__sidebar--collapsed .omg-sw__sidebar-header-label,
.omg-sw__sidebar--collapsed .omg-sw__sidebar-section-title,
.omg-sw__sidebar--collapsed .omg-sw__sidebar-badge,
.omg-sw__sidebar--collapsed .omg-sw__sidebar-empty,
.omg-sw__sidebar--collapsed .omg-sw__sidebar-item span {
  display: none;
}

.omg-sw__sidebar--collapsed .omg-sw__sidebar-item {
  justify-content: center;
  padding: var(--omg-space-sm) 0;
}

.omg-sw__sidebar--collapsed .omg-sw__sidebar-item--theme {
  border-radius: var(--omg-radius-md);
  border-bottom: none;
}

.omg-sw__sidebar--collapsed .omg-sw__sidebar-divider {
  margin: var(--omg-space-xs) 8px;
}

/* ── 右侧主区域 ── */
.omg-sw__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
  min-width: 0;
  overflow-y: auto;
}

.omg-sw__editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--omg-space-sm);
}

.omg-sw__editor-title {
  font-size: var(--omg-font-md);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-sw__editor-title i {
  color: var(--omg-accent);
}

.omg-sw__editor-hint {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-sw__editor-readonly {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  font-size: var(--omg-font-xs);
  color: var(--omg-warning);
  background: hsla(38, 92%, 55%, 0.1);
  padding: 3px 10px;
  border-radius: var(--omg-radius-full);
}

.omg-sw__meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--omg-space-md);
}

/* ── 标签页 ── */
.omg-sw__editor-tabs {
  display: flex;
  gap: 2px;
  background: var(--omg-bg-secondary);
  padding: 3px;
  border-radius: var(--omg-radius-md);
}

.omg-sw__tab {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  padding: var(--omg-space-xs) var(--omg-space-md);
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  font-size: var(--omg-font-sm);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  transition: all var(--omg-transition-fast);
  flex: 1;
  justify-content: center;
}

.omg-sw__tab:hover {
  color: var(--omg-text-primary);
}

.omg-sw__tab--active {
  background: var(--omg-bg-primary);
  color: var(--omg-accent);
  box-shadow: var(--omg-shadow-sm);
}

/* ── 代码编辑器 ── */
.omg-sw__code-area {
  flex: 1;
  min-height: 180px;
  display: flex;
}

.omg-sw__code-editor {
  width: 100%;
  min-height: 180px;
  padding: var(--omg-space-md);
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  line-height: 1.6;
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
  resize: vertical;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
  transition: border-color var(--omg-transition-fast);
}

.omg-sw__code-editor:focus {
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 3px var(--omg-accent-subtle);
}

.omg-sw__code-editor[readonly] {
  opacity: 0.75;
  cursor: default;
}

/* ── 占位符参考 ── */
.omg-sw__reference {
  width: 100%;
  padding: var(--omg-space-md);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  overflow-y: auto;
  max-height: 300px;
}

.omg-sw__visual {
  width: 100%;
  padding: var(--omg-space-md);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

.omg-sw__visual-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--omg-space-xs);
}

.omg-sw__visual-title {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-primary);
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
}

.omg-sw__visual-title code {
  font-family: var(--omg-font-mono);
  color: var(--omg-accent);
}

.omg-sw__visual-hint {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-sw__visual-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--omg-space-sm);
}

.omg-sw__visual-input {
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--omg-radius-sm);
  border: 1px solid var(--omg-border);
  background: var(--omg-bg-primary);
  color: var(--omg-text-primary);
  font-size: var(--omg-font-xs);
}

.omg-sw__visual-input:focus {
  outline: none;
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 2px var(--omg-accent-subtle);
}

.omg-sw__ref-section {
  margin-bottom: var(--omg-space-lg);
}

.omg-sw__ref-section:last-child {
  margin-bottom: 0;
}

.omg-sw__ref-title {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0 0 var(--omg-space-sm);
}

.omg-sw__ref-grid {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-xs);
}

.omg-sw__ref-item {
  display: flex;
  align-items: center;
  gap: var(--omg-space-md);
  padding: var(--omg-space-xs) var(--omg-space-sm);
  border-radius: var(--omg-radius-sm);
}

.omg-sw__ref-item:hover {
  background: var(--omg-bg-tertiary);
}

.omg-sw__ref-code {
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  color: var(--omg-accent);
  background: var(--omg-bg-primary);
  padding: 2px 8px;
  border-radius: var(--omg-radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.omg-sw__ref-desc {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

/* ── 预览 ── */
.omg-sw__preview {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-sw__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-sw__preview-title {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
}

.omg-sw__preview-title i {
  color: var(--omg-accent);
}

.omg-sw__preview-container {
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  padding: var(--omg-space-lg);
  min-height: 60px;
}

.omg-sw__preview-area {
  color: var(--omg-text-primary);
  font-size: var(--omg-font-sm);
}

.omg-sw__preview-drop-hint {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

/* ── 安全检查 ── */
.omg-sw__safety {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-xs);
  padding: var(--omg-space-md);
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-md);
  border: 1px solid var(--omg-border);
}

.omg-sw__safety-title {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  margin-bottom: var(--omg-space-xs);
}

.omg-sw__safety-item {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  font-size: var(--omg-font-xs);
  padding: var(--omg-space-xs) var(--omg-space-sm);
  border-radius: var(--omg-radius-sm);
}

.omg-sw__safety-item--error {
  color: var(--omg-danger);
  background: hsla(0, 72%, 58%, 0.08);
}

.omg-sw__safety-item--warning {
  color: var(--omg-warning);
  background: hsla(38, 92%, 55%, 0.08);
}

/* ── 操作按钮 ── */
.omg-sw__editor-actions {
  display: flex;
  gap: var(--omg-space-sm);
  justify-content: flex-end;
  padding-top: var(--omg-space-sm);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .omg-sw__content {
    flex-direction: column;
  }

  .omg-sw__sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    max-height: 120px;
  }

  .omg-sw__sidebar--collapsed {
    width: 100%;
    padding: var(--omg-space-xs);
  }

  .omg-sw__sidebar--collapsed .omg-sw__sidebar-header-label,
  .omg-sw__sidebar--collapsed .omg-sw__sidebar-section-title,
  .omg-sw__sidebar--collapsed .omg-sw__sidebar-badge,
  .omg-sw__sidebar--collapsed .omg-sw__sidebar-empty,
  .omg-sw__sidebar--collapsed .omg-sw__sidebar-item span {
    display: revert;
  }

  .omg-sw__sidebar--collapsed .omg-sw__sidebar-item {
    justify-content: flex-start;
    padding: var(--omg-space-sm) var(--omg-space-md);
  }

  .omg-sw__sidebar-divider {
    display: none;
  }

  .omg-sw__sidebar-section {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .omg-sw__sidebar-section-title {
    width: 100%;
  }

  .omg-sw__meta-row {
    grid-template-columns: 1fr;
  }
}
</style>
