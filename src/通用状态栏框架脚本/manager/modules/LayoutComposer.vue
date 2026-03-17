<template>
  <div class="omg-lc">
    <!-- 顶栏 -->
    <div class="omg-lc__toolbar">
      <h2 class="omg-lc__title">
        <i class="fa-solid fa-grip" />
        布局编排器
        <OmgHelpTip title="布局编排器">
          以树状结构设计状态栏布局。支持 Flexbox/Grid/Absolute/Custom 四种布局模式，可嵌套容器并绑定条目。所有布局保存为 JSON，支持多方案切换。
        </OmgHelpTip>
      </h2>
      <div class="omg-lc__actions">
        <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="createLayout"> 新建布局 </OmgButton>
        <OmgButton icon="fa-solid fa-file-import" size="sm" @click="handleImport"> 导入 </OmgButton>
        <OmgButton icon="fa-solid fa-file-export" size="sm" @click="handleExport"> 导出 </OmgButton>
      </div>
    </div>

    <div class="omg-lc__content">
      <!-- 左侧：布局列表 -->
      <aside class="omg-lc__sidebar">
        <div class="omg-lc__sidebar-section-title">
          <i class="fa-solid fa-layer-group" />
          布局方案
        </div>
        <button
          v-for="layout in layouts"
          :key="layout.id"
          class="omg-lc__sidebar-item"
          :class="{ 'omg-lc__sidebar-item--active': selectedLayoutId === layout.id }"
          @click="selectLayout(layout.id)"
        >
          <i class="fa-solid fa-table-cells omg-lc__sidebar-icon" />
          <span>{{ layout.name }}</span>
        </button>
        <div v-if="layouts.length === 0" class="omg-lc__sidebar-empty">
          <span>还没有布局方案</span>
        </div>
      </aside>

      <!-- 右侧 -->
      <div class="omg-lc__main" v-if="currentLayout">
        <!-- 布局名称 -->
        <div class="omg-lc__layout-header">
          <OmgInput v-model="currentLayout.name" label="布局名称" style="max-width: 300px" />
          <OmgButton icon="fa-solid fa-trash-can" size="sm" variant="danger" @click="deleteCurrentLayout">
            删除布局
          </OmgButton>
        </div>

        <!-- 编辑模式切换 -->
        <div class="omg-lc__mode-tabs">
          <button
            class="omg-lc__mode-tab"
            :class="{ 'omg-lc__mode-tab--active': editMode === 'visual' }"
            @click="editMode = 'visual'"
          >
            <i class="fa-solid fa-eye" />
            可视化编辑
          </button>
          <button
            class="omg-lc__mode-tab"
            :class="{ 'omg-lc__mode-tab--active': editMode === 'json' }"
            @click="syncToJson"
          >
            <i class="fa-solid fa-code" />
            JSON 编辑
          </button>
        </div>

        <!-- 可视化编辑模式 -->
        <template v-if="editMode === 'visual'">
          <div class="omg-lc__editor-split">
            <!-- 结构树 -->
            <div class="omg-lc__tree-panel">
              <div class="omg-lc__tree-header">
                <span class="omg-lc__tree-label">结构树</span>
              </div>
              <div class="omg-lc__tree-body">
                <LayoutTreeNode
                  :node="currentLayout.root"
                  :depth="0"
                  :selected-id="selectedNodeId"
                  @select="selectedNodeId = $event"
                />
              </div>
            </div>

            <!-- 属性面板 -->
            <div class="omg-lc__props-panel" v-if="selectedNode">
              <div class="omg-lc__props-header">
                <span class="omg-lc__props-label">属性</span>
                <span class="omg-lc__props-type">{{ selectedNode.type === 'container' ? '容器' : '条目' }}</span>
              </div>
              <div class="omg-lc__props-body">
                <OmgInput v-model="selectedNode.label" label="标签" placeholder="可选标签名" />

                <template v-if="selectedNode.type === 'container'">
                  <OmgSelect v-model="selectedNode.layoutMode" label="布局模式" :options="layoutModeOptions" />
                  <OmgInput v-model="selectedNode.gap" label="间距 (gap)" placeholder="8px" />
                  <OmgInput v-model="selectedNode.padding" label="内边距 (padding)" placeholder="0" />

                  <template v-if="selectedNode.layoutMode === 'grid'">
                    <OmgInput v-model.number="selectedNode.gridCols" label="列数" type="number" placeholder="2" />
                  </template>

                  <template v-if="selectedNode.layoutMode === 'flex-row' || selectedNode.layoutMode === 'flex-col'">
                    <OmgSelect v-model="selectedNode.justifyContent" label="主轴对齐" :options="justifyOptions" />
                    <OmgSelect v-model="selectedNode.alignItems" label="交叉轴对齐" :options="alignOptions" />
                  </template>

                  <!-- 添加子节点 -->
                  <div class="omg-lc__props-add">
                    <OmgButton icon="fa-solid fa-folder-plus" size="sm" variant="primary" @click="addContainer">
                      添加容器
                    </OmgButton>
                    <OmgSelect
                      v-model="addItemDefId"
                      label="添加条目"
                      :options="definitionOptions"
                      placeholder="选择条目..."
                    />
                    <OmgButton v-if="addItemDefId" icon="fa-solid fa-plus" size="sm" variant="primary" @click="addItem">
                      添加
                    </OmgButton>
                  </div>
                </template>

                <template v-if="selectedNode.type === 'item'">
                  <OmgSelect v-model="selectedNode.definitionId" label="绑定条目" :options="definitionOptions" />
                  <OmgInput v-model="selectedNode.styleOverride" label="样式覆盖 ID" placeholder="留空使用默认" />
                </template>

                <!-- 通用 -->
                <OmgInput v-model="selectedNode.width" label="宽度" placeholder="auto" />
                <OmgInput v-model="selectedNode.height" label="高度" placeholder="auto" />
                <div class="omg-input">
                  <label class="omg-input__label">自定义 CSS</label>
                  <textarea
                    v-model="selectedNode.customCss"
                    class="omg-lc__css-textarea"
                    rows="3"
                    spellcheck="false"
                    placeholder="额外的 CSS 样式..."
                  />
                </div>

                <!-- 节点操作 -->
                <div class="omg-lc__props-node-actions">
                  <OmgButton icon="fa-solid fa-arrow-up" size="sm" variant="ghost" icon-only @click="moveNodeUp" />
                  <OmgButton icon="fa-solid fa-arrow-down" size="sm" variant="ghost" icon-only @click="moveNodeDown" />
                  <OmgButton
                    v-if="selectedNodeId !== currentLayout.root.id"
                    icon="fa-solid fa-trash-can"
                    size="sm"
                    variant="danger"
                    icon-only
                    @click="removeSelectedNode"
                  />
                </div>
              </div>
            </div>
            <div v-else class="omg-lc__props-panel omg-lc__props-panel--empty">
              <OmgEmpty text="点击结构树中的节点以编辑属性" icon="fa-solid fa-mouse-pointer" />
            </div>
          </div>

          <!-- 预览 -->
          <div class="omg-lc__preview">
            <div class="omg-lc__preview-header">
              <h4 class="omg-lc__preview-title">
                <i class="fa-solid fa-eye" />
                布局预览
              </h4>
            </div>
            <div class="omg-lc__preview-container">
              <div class="omg-lc__preview-area" v-html="previewHtml" />
            </div>
          </div>
        </template>

        <!-- JSON 编辑模式 -->
        <template v-else>
          <textarea v-model="jsonText" class="omg-lc__json-editor" spellcheck="false" rows="20" />
          <div v-if="jsonError" class="omg-lc__json-error">
            <i class="fa-solid fa-circle-xmark" />
            {{ jsonError }}
          </div>
          <OmgButton variant="primary" icon="fa-solid fa-check" @click="applyJson"> 应用 JSON </OmgButton>
        </template>

        <!-- 保存按钮 -->
        <div class="omg-lc__save-bar">
          <OmgButton variant="primary" icon="fa-solid fa-floppy-disk" @click="saveCurrentLayout"> 保存布局 </OmgButton>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="omg-lc__main">
        <OmgEmpty text="请从左侧选择或创建一个布局方案" icon="fa-solid fa-grip">
          <OmgButton size="sm" variant="primary" @click="createLayout"> 创建布局 </OmgButton>
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
import type { DefinitionEntry } from '../../data/definitions';
import { getAllEntries } from '../../data/definitions-store';
import type { LayoutConfig, LayoutNode } from '../../data/layouts-store';
import * as layoutStore from '../../data/layouts-store';
import LayoutTreeNode from './LayoutTreeNode.vue';

// ─── 状态 ───

const layouts = ref<LayoutConfig[]>([]);
const selectedLayoutId = ref<string | null>(null);
const selectedNodeId = ref<string | null>(null);
const editMode = ref<'visual' | 'json'>('visual');
const jsonText = ref('');
const jsonError = ref('');
const addItemDefId = ref('');
const definitions = ref<DefinitionEntry[]>([]);

// ─── 计算属性 ───

const currentLayout = computed(() => layouts.value.find(l => l.id === selectedLayoutId.value) ?? null);

const selectedNode = computed(() => {
  if (!currentLayout.value || !selectedNodeId.value) return null;
  return layoutStore.findNode(currentLayout.value.root, selectedNodeId.value);
});

const definitionOptions = computed(() => definitions.value.map(d => ({ value: d.id, label: `${d.name} (${d.key})` })));

const layoutModeOptions = [
  { value: 'flex-row', label: '横向排列 (Flex Row)' },
  { value: 'flex-col', label: '纵向排列 (Flex Column)' },
  { value: 'grid', label: '网格 (Grid)' },
  { value: 'absolute', label: '绝对定位 (Absolute)' },
  { value: 'custom', label: '自定义 CSS (Custom)' },
];

const justifyOptions = [
  { value: 'flex-start', label: '起始' },
  { value: 'center', label: '居中' },
  { value: 'flex-end', label: '末尾' },
  { value: 'space-between', label: '两端对齐' },
  { value: 'space-around', label: '等距分布' },
  { value: 'space-evenly', label: '均匀分布' },
];

const alignOptions = [
  { value: 'stretch', label: '拉伸' },
  { value: 'flex-start', label: '起始' },
  { value: 'center', label: '居中' },
  { value: 'flex-end', label: '末尾' },
];

const previewHtml = computed(() => {
  if (!currentLayout.value) return '';
  return renderPreviewNode(currentLayout.value.root);
});

// ─── 方法 ───

function selectLayout(id: string) {
  selectedLayoutId.value = id;
  selectedNodeId.value = null;
  editMode.value = 'visual';
}

function createLayout() {
  const layout = layoutStore.createDefaultLayout();
  layouts.value.push(layout);
  selectLayout(layout.id);
}

async function deleteCurrentLayout() {
  if (!currentLayout.value) return;
  if (!confirm(`确定要删除布局「${currentLayout.value.name}」吗？`)) return;
  await layoutStore.deleteLayout(currentLayout.value.id);
  layouts.value = layouts.value.filter(l => l.id !== selectedLayoutId.value);
  selectedLayoutId.value = layouts.value[0]?.id ?? null;
  selectedNodeId.value = null;
}

async function saveCurrentLayout() {
  if (!currentLayout.value) return;
  await layoutStore.saveLayout(currentLayout.value);
  toastr.success('布局已保存');
}

function addContainer() {
  if (!selectedNode.value || selectedNode.value.type !== 'container') return;
  if (!selectedNode.value.children) selectedNode.value.children = [];
  selectedNode.value.children.push(layoutStore.createContainerNode('flex-row'));
}

function addItem() {
  if (!selectedNode.value || selectedNode.value.type !== 'container' || !addItemDefId.value) return;
  if (!selectedNode.value.children) selectedNode.value.children = [];
  const def = definitions.value.find(d => d.id === addItemDefId.value);
  selectedNode.value.children.push(layoutStore.createItemNode(addItemDefId.value, def?.name));
  addItemDefId.value = '';
}

function removeSelectedNode() {
  if (!currentLayout.value || !selectedNodeId.value) return;
  if (selectedNodeId.value === currentLayout.value.root.id) return;
  layoutStore.removeNode(currentLayout.value.root, selectedNodeId.value);
  selectedNodeId.value = null;
}

function moveNodeUp() {
  if (!currentLayout.value || !selectedNodeId.value) return;
  layoutStore.moveNode(currentLayout.value.root, selectedNodeId.value, 'up');
}

function moveNodeDown() {
  if (!currentLayout.value || !selectedNodeId.value) return;
  layoutStore.moveNode(currentLayout.value.root, selectedNodeId.value, 'down');
}

function syncToJson() {
  editMode.value = 'json';
  if (currentLayout.value) {
    jsonText.value = JSON.stringify(currentLayout.value.root, null, 2);
    jsonError.value = '';
  }
}

function applyJson() {
  if (!currentLayout.value) return;
  try {
    const parsed = JSON.parse(jsonText.value);
    if (!parsed || !parsed.type) {
      jsonError.value = '无效的布局结构：需要包含 type 字段';
      return;
    }
    currentLayout.value.root = parsed;
    jsonError.value = '';
    editMode.value = 'visual';
    toastr.success('JSON 已应用');
  } catch (e) {
    jsonError.value = `JSON 解析错误: ${(e as Error).message}`;
  }
}

function renderPreviewNode(node: LayoutNode): string {
  if (node.type === 'item') {
    const def = definitions.value.find(d => d.id === node.definitionId);
    const label = node.label || def?.name || '未绑定';
    const icon = def?.icon || 'fa-solid fa-circle';
    return `<div class="omg-lc__pv-item"><i class="${icon}"></i> ${label}</div>`;
  }

  const styles: string[] = [];
  if (node.layoutMode === 'flex-row') {
    styles.push('display:flex', 'flex-direction:row');
  } else if (node.layoutMode === 'flex-col') {
    styles.push('display:flex', 'flex-direction:column');
  } else if (node.layoutMode === 'grid') {
    styles.push('display:grid', `grid-template-columns:repeat(${node.gridCols ?? 2},1fr)`);
  } else if (node.layoutMode === 'absolute') {
    styles.push('position:relative');
  }
  if (node.gap) styles.push(`gap:${node.gap}`);
  if (node.padding) styles.push(`padding:${node.padding}`);
  if (node.justifyContent) styles.push(`justify-content:${node.justifyContent}`);
  if (node.alignItems) styles.push(`align-items:${node.alignItems}`);
  if (node.width) styles.push(`width:${node.width}`);
  if (node.height) styles.push(`height:${node.height}`);

  const childrenHtml = (node.children ?? []).map(c => renderPreviewNode(c)).join('');
  const label = node.label ? `<span class="omg-lc__pv-label">${node.label}</span>` : '';
  return `<div class="omg-lc__pv-container" style="${styles.join(';')}">${label}${childrenHtml}</div>`;
}

// 导入/导出
async function handleExport() {
  const data = await layoutStore.exportLayouts();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omg-layouts-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastr.success('布局数据已导出');
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
      if (!data.version || !data.layouts) {
        toastr.error('无效的布局文件格式');
        return;
      }
      if (!confirm('导入将覆盖现有布局数据，确定继续吗？')) return;
      await layoutStore.importLayouts(data);
      await loadData();
      selectedLayoutId.value = null;
      selectedNodeId.value = null;
      toastr.success('布局数据已导入');
    } catch {
      toastr.error('导入失败：文件解析出错');
    }
  };
  input.click();
}

// ─── 初始化 ───

async function loadData() {
  layouts.value = await layoutStore.getAllLayouts();
  definitions.value = await getAllEntries();
}

onMounted(() => loadData());
</script>

<style>
/* @doc: 布局编排器 | category: 管理器模块 | desc: 可视化布局设计界面 */

.omg-lc {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--omg-space-lg);
}

.omg-lc__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-lc__title {
  font-size: var(--omg-font-lg);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-lc__title i {
  color: var(--omg-accent);
}

.omg-lc__actions {
  display: flex;
  gap: var(--omg-space-xs);
}

/* ── 内容区 ── */
.omg-lc__content {
  display: flex;
  gap: var(--omg-space-lg);
  flex: 1;
  min-height: 0;
}

/* ── 左侧栏 ── */
.omg-lc__sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  padding: var(--omg-space-xs);
  overflow-y: auto;
  gap: 2px;
}

.omg-lc__sidebar-section-title {
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

.omg-lc__sidebar-item {
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

.omg-lc__sidebar-item:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-lc__sidebar-item--active {
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
}

.omg-lc__sidebar-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: var(--omg-font-xs);
}

.omg-lc__sidebar-empty {
  padding: var(--omg-space-md);
  text-align: center;
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

/* ── 右侧主区域 ── */
.omg-lc__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
  min-width: 0;
  overflow-y: auto;
}

.omg-lc__layout-header {
  display: flex;
  align-items: flex-end;
  gap: var(--omg-space-md);
}

/* ── 模式切换 ── */
.omg-lc__mode-tabs {
  display: flex;
  gap: 2px;
  background: var(--omg-bg-secondary);
  padding: 3px;
  border-radius: var(--omg-radius-md);
  width: fit-content;
}

.omg-lc__mode-tab {
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
}

.omg-lc__mode-tab:hover {
  color: var(--omg-text-primary);
}

.omg-lc__mode-tab--active {
  background: var(--omg-bg-primary);
  color: var(--omg-accent);
  box-shadow: var(--omg-shadow-sm);
}

/* ── 编辑器分栏 ── */
.omg-lc__editor-split {
  display: flex;
  gap: var(--omg-space-md);
  flex: 1;
  min-height: 200px;
}

/* ── 结构树面板 ── */
.omg-lc__tree-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  overflow: hidden;
}

.omg-lc__tree-header {
  padding: var(--omg-space-sm) var(--omg-space-md);
  border-bottom: 1px solid var(--omg-border);
}

.omg-lc__tree-label {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.omg-lc__tree-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--omg-space-xs);
}

/* ── 属性面板 ── */
.omg-lc__props-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  overflow: hidden;
}

.omg-lc__props-panel--empty {
  justify-content: center;
  align-items: center;
}

.omg-lc__props-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--omg-space-sm) var(--omg-space-md);
  border-bottom: 1px solid var(--omg-border);
}

.omg-lc__props-label {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.omg-lc__props-type {
  font-size: 9px;
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-accent);
  background: var(--omg-accent-subtle);
  padding: 1px 6px;
  border-radius: var(--omg-radius-full);
}

.omg-lc__props-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--omg-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-lc__props-add {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-xs);
  padding-top: var(--omg-space-sm);
  border-top: 1px solid var(--omg-border);
}

.omg-lc__props-node-actions {
  display: flex;
  gap: var(--omg-space-xs);
  padding-top: var(--omg-space-sm);
  border-top: 1px solid var(--omg-border);
}

.omg-lc__css-textarea {
  width: 100%;
  padding: 6px 8px;
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  color: var(--omg-text-primary);
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
  resize: vertical;
  tab-size: 2;
}

.omg-lc__css-textarea:focus {
  border-color: var(--omg-border-focus);
}

/* ── 预览 ── */
.omg-lc__preview {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-lc__preview-header {
  display: flex;
  align-items: center;
}

.omg-lc__preview-title {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
}

.omg-lc__preview-title i {
  color: var(--omg-accent);
}

.omg-lc__preview-container {
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  padding: var(--omg-space-lg);
  min-height: 80px;
}

/* 预览渲染内容 */
.omg-lc__pv-container {
  border: 1px dashed var(--omg-border-hover);
  border-radius: var(--omg-radius-sm);
  padding: 4px;
  min-height: 24px;
  position: relative;
}

.omg-lc__pv-label {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  position: absolute;
  top: -8px;
  left: 4px;
  background: var(--omg-bg-secondary);
  padding: 0 4px;
}

.omg-lc__pv-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
  border-radius: var(--omg-radius-sm);
  font-size: var(--omg-font-xs);
  white-space: nowrap;
}

/* ── JSON 编辑 ── */
.omg-lc__json-editor {
  width: 100%;
  min-height: 300px;
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
}

.omg-lc__json-editor:focus {
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 3px var(--omg-accent-subtle);
}

.omg-lc__json-error {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  color: var(--omg-danger);
  font-size: var(--omg-font-xs);
  padding: var(--omg-space-sm);
  background: hsla(0, 72%, 58%, 0.08);
  border-radius: var(--omg-radius-md);
}

/* ── 保存栏 ── */
.omg-lc__save-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--omg-space-sm);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .omg-lc__content {
    flex-direction: column;
  }

  .omg-lc__sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .omg-lc__editor-split {
    flex-direction: column;
  }

  .omg-lc__props-panel {
    width: 100%;
  }
}
</style>
