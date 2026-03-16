<template>
  <div class="omg-ds">
    <!-- 顶栏 -->
    <div class="omg-ds__toolbar">
      <h2 class="omg-ds__title">
        <i class="fa-solid fa-flask" />
        数据工作室
      </h2>
      <div class="omg-ds__actions">
        <OmgButton icon="fa-solid fa-file-import" size="sm" @click="handleImport"> 导入 </OmgButton>
        <OmgButton icon="fa-solid fa-file-export" size="sm" @click="handleExport"> 导出 </OmgButton>
      </div>
    </div>

    <div class="omg-ds__content">
      <!-- 左侧：分类列表 -->
      <aside class="omg-ds__categories">
        <div class="omg-ds__categories-header">
          <span class="omg-ds__categories-title">分类</span>
          <OmgButton icon="fa-solid fa-plus" size="sm" variant="ghost" icon-only @click="showCategoryDialog = true" />
        </div>
        <div class="omg-ds__category-list">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="omg-ds__category-item"
            :class="{ 'omg-ds__category-item--active': selectedCategoryId === cat.id }"
            @click="selectedCategoryId = cat.id"
          >
            <i :class="cat.icon || 'fa-solid fa-folder'" class="omg-ds__category-icon" />
            <span class="omg-ds__category-name">{{ cat.name }}</span>
            <span class="omg-ds__category-badge">{{ getEntryCount(cat.id) }}</span>
            <span class="omg-ds__category-scope" :class="`omg-ds__category-scope--${cat.scope}`">
              {{ cat.scope === 'shared' ? '共享' : '角色' }}
            </span>
          </button>
          <OmgEmpty v-if="categories.length === 0" text="还没有分类" icon="fa-solid fa-folder-plus">
            <OmgButton size="sm" variant="primary" @click="showCategoryDialog = true"> 创建第一个分类 </OmgButton>
          </OmgEmpty>
        </div>
      </aside>

      <!-- 右侧：条目列表 + 编辑器 -->
      <div class="omg-ds__main">
        <template v-if="selectedCategory">
          <!-- 条目列表 -->
          <div class="omg-ds__entries-header">
            <h3 class="omg-ds__entries-title">
              {{ selectedCategory.name }}
              <span class="omg-ds__entries-scope"
                >— {{ selectedCategory.scope === 'shared' ? '共享数据' : '角色数据' }}</span
              >
            </h3>
            <div class="omg-ds__entries-actions">
              <OmgButton icon="fa-solid fa-pen" size="sm" variant="ghost" @click="editCategory(selectedCategory!)">
                编辑分类
              </OmgButton>
              <OmgButton icon="fa-solid fa-trash" size="sm" variant="danger" @click="confirmDeleteCategory">
                删除分类
              </OmgButton>
              <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="createEntry"> 新增条目 </OmgButton>
            </div>
          </div>

          <div class="omg-ds__entries-list">
            <div
              v-for="entry in filteredEntries"
              :key="entry.id"
              class="omg-ds__entry-row"
              :class="{ 'omg-ds__entry-row--active': selectedEntryId === entry.id }"
              @click="selectedEntryId = entry.id"
            >
              <i :class="entry.icon" class="omg-ds__entry-icon" />
              <div class="omg-ds__entry-info">
                <span class="omg-ds__entry-name">{{ entry.name }}</span>
                <span class="omg-ds__entry-key">{{ entry.key }}</span>
              </div>
              <span class="omg-ds__entry-type">{{ dataTypeLabel(entry.dataType) }}</span>
              <OmgButton
                icon="fa-solid fa-trash-can"
                size="sm"
                variant="ghost"
                icon-only
                @click.stop="confirmDeleteEntry(entry)"
              />
            </div>
            <OmgEmpty v-if="filteredEntries.length === 0" text="该分类下还没有条目" icon="fa-solid fa-list">
              <OmgButton size="sm" variant="primary" @click="createEntry"> 添加条目 </OmgButton>
            </OmgEmpty>
          </div>
        </template>

        <OmgEmpty v-else text="请从左侧选择或创建一个分类" icon="fa-solid fa-hand-pointer" />

        <!-- 条目编辑面板 -->
        <Transition name="omg-slide">
          <div v-if="selectedEntry" class="omg-ds__editor">
            <div class="omg-ds__editor-header">
              <h4 class="omg-ds__editor-title">编辑条目</h4>
              <OmgButton icon="fa-solid fa-xmark" size="sm" variant="ghost" icon-only @click="selectedEntryId = null" />
            </div>
            <div class="omg-ds__editor-body">
              <OmgInput v-model="selectedEntry.key" label="KEY（JSON路径）" placeholder="例: 生命值" required />
              <OmgInput v-model="selectedEntry.name" label="显示名称" placeholder="例: ❤️ 生命值" required />
              <OmgInput
                v-model="selectedEntry.icon"
                label="图标类名"
                placeholder="例: fa-solid fa-heart"
                :prefix-icon="selectedEntry.icon"
              />

              <OmgSelect v-model="selectedEntry.dataType" label="数据类型" :options="dataTypeOptions" />

              <!-- 验证规则 -->
              <div v-if="selectedEntry.dataType === 'number'" class="omg-ds__editor-row">
                <OmgInput
                  v-model.number="selectedEntry.validation.min"
                  label="最小值"
                  type="number"
                  placeholder="不限"
                />
                <OmgInput
                  v-model.number="selectedEntry.validation.max"
                  label="最大值"
                  type="number"
                  placeholder="不限"
                />
              </div>
              <div v-if="selectedEntry.dataType === 'text'" class="omg-ds__editor-row">
                <OmgInput
                  v-model.number="selectedEntry.validation.maxLength"
                  label="最大长度"
                  type="number"
                  placeholder="不限"
                />
              </div>

              <OmgSelect v-model="selectedEntry.interactionType" label="交互类型" :options="interactionOptions" />

              <div class="omg-input">
                <label class="omg-input__label">AI 指导描述</label>
                <textarea
                  v-model="selectedEntry.description"
                  class="omg-ds__textarea"
                  rows="3"
                  placeholder="描述这个条目的含义，用于指导 AI 更新数据..."
                />
              </div>

              <div class="omg-input">
                <label class="omg-input__label">JSON PATCH 示例</label>
                <textarea
                  v-model="selectedEntry.updateSample"
                  class="omg-ds__textarea omg-ds__textarea--code"
                  rows="4"
                  placeholder="自动生成或手动编写..."
                />
                <OmgButton size="sm" variant="ghost" icon="fa-solid fa-wand-magic-sparkles" @click="autoGenerateSample">
                  自动生成
                </OmgButton>
              </div>

              <div class="omg-input">
                <label class="omg-input__label">ZOD 验证预览</label>
                <code class="omg-ds__zod-preview">{{ zodPreview }}</code>
              </div>

              <div class="omg-ds__editor-actions">
                <OmgButton variant="primary" icon="fa-solid fa-check" @click="saveCurrentEntry"> 保存条目 </OmgButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 分类编辑对话框 -->
    <OmgModal v-model="showCategoryDialog" :title="editingCategory ? '编辑分类' : '新建分类'">
      <div class="omg-ds__category-form">
        <OmgInput v-model="categoryForm.name" label="分类名称" placeholder="例: 角色属性" required />
        <OmgInput
          v-model="categoryForm.icon"
          label="图标类名"
          placeholder="例: fa-solid fa-user"
          :prefix-icon="categoryForm.icon || 'fa-solid fa-folder'"
        />
        <OmgSelect
          v-model="categoryForm.scope"
          label="分类属性"
          :options="[
            { value: 'shared', label: '共享 — 全局数据（如世界状态）' },
            { value: 'character', label: '角色 — 每个角色独立（如生命值）' },
          ]"
        />
      </div>
      <template #footer>
        <OmgButton variant="ghost" @click="showCategoryDialog = false">取消</OmgButton>
        <OmgButton variant="primary" @click="saveCategory">{{ editingCategory ? '保存' : '创建' }}</OmgButton>
      </template>
    </OmgModal>
  </div>
</template>

<script setup lang="ts">
import OmgButton from '../../components/base/OmgButton.vue';
import OmgEmpty from '../../components/base/OmgEmpty.vue';
import OmgInput from '../../components/base/OmgInput.vue';
import OmgModal from '../../components/base/OmgModal.vue';
import OmgSelect from '../../components/base/OmgSelect.vue';
import type { CategoryDef, CategoryScope, DefinitionEntry } from '../../data/definitions';
import {
  createDefaultCategory,
  createDefaultEntry,
  generateUpdateSample,
  generateZodSnippet,
} from '../../data/definitions';
import * as store from '../../data/definitions-store';

// ─── 状态 ───

const categories = ref<CategoryDef[]>([]);
const entries = ref<DefinitionEntry[]>([]);
const selectedCategoryId = ref<string | null>(null);
const selectedEntryId = ref<string | null>(null);
const showCategoryDialog = ref(false);
const editingCategory = ref<CategoryDef | null>(null);

const categoryForm = ref<{ name: string; icon: string; scope: CategoryScope }>({
  name: '',
  icon: '',
  scope: 'character',
});

// ─── 计算属性 ───

const selectedCategory = computed(() => categories.value.find(c => c.id === selectedCategoryId.value) ?? null);

const filteredEntries = computed(() => entries.value.filter(e => e.categoryId === selectedCategoryId.value));

const selectedEntry = computed(() => entries.value.find(e => e.id === selectedEntryId.value) ?? null);

const zodPreview = computed(() => (selectedEntry.value ? generateZodSnippet(selectedEntry.value) : ''));

// ─── 常量 ───

const dataTypeOptions = [
  { value: 'text', label: '文本 (String)' },
  { value: 'number', label: '数字 (Number)' },
  { value: 'boolean', label: '布尔 (Boolean)' },
];

const interactionOptions = [
  { value: 'none', label: '无交互' },
  { value: 'click', label: '点击事件' },
  { value: 'toggle', label: '开关切换' },
  { value: 'input', label: '输入修改' },
  { value: 'custom', label: '自定义脚本' },
];

// ─── 方法 ───

function getEntryCount(categoryId: string): number {
  return entries.value.filter(e => e.categoryId === categoryId).length;
}

function dataTypeLabel(dt: string): string {
  return dt === 'number' ? '数字' : dt === 'boolean' ? '布尔' : '文本';
}

// 分类
function editCategory(cat: CategoryDef) {
  editingCategory.value = cat;
  categoryForm.value = { name: cat.name, icon: cat.icon || '', scope: cat.scope };
  showCategoryDialog.value = true;
}

async function saveCategory() {
  if (!categoryForm.value.name.trim()) return;

  if (editingCategory.value) {
    editingCategory.value.name = categoryForm.value.name.trim();
    editingCategory.value.icon = categoryForm.value.icon.trim() || undefined;
    editingCategory.value.scope = categoryForm.value.scope;
    await store.saveCategory(editingCategory.value);
  } else {
    const cat = createDefaultCategory({
      name: categoryForm.value.name.trim(),
      scope: categoryForm.value.scope,
      icon: categoryForm.value.icon.trim() || undefined,
      order: categories.value.length,
    });
    await store.saveCategory(cat);
    categories.value.push(cat);
    selectedCategoryId.value = cat.id;
  }

  editingCategory.value = null;
  showCategoryDialog.value = false;
  categoryForm.value = { name: '', icon: '', scope: 'character' };
}

async function confirmDeleteCategory() {
  if (!selectedCategory.value) return;
  const count = getEntryCount(selectedCategory.value.id);
  const msg =
    count > 0
      ? `确定要删除分类「${selectedCategory.value.name}」及其下 ${count} 个条目吗？`
      : `确定要删除分类「${selectedCategory.value.name}」吗？`;
  if (!confirm(msg)) return;

  await store.deleteCategoryAndEntries(selectedCategory.value.id);
  categories.value = categories.value.filter(c => c.id !== selectedCategoryId.value);
  entries.value = entries.value.filter(e => e.categoryId !== selectedCategoryId.value);
  selectedCategoryId.value = categories.value[0]?.id ?? null;
  selectedEntryId.value = null;
}

// 条目
function createEntry() {
  if (!selectedCategoryId.value) return;
  const entry = createDefaultEntry({
    key: '',
    name: '新条目',
    categoryId: selectedCategoryId.value,
    order: filteredEntries.value.length,
  });
  entries.value.push(entry);
  selectedEntryId.value = entry.id;
}

async function saveCurrentEntry() {
  if (!selectedEntry.value) return;
  if (!selectedEntry.value.key.trim() || !selectedEntry.value.name.trim()) {
    toastr.warning('KEY 和显示名称不能为空');
    return;
  }
  await store.saveEntry(selectedEntry.value);
  toastr.success('条目已保存');
}

async function confirmDeleteEntry(entry: DefinitionEntry) {
  if (!confirm(`确定要删除条目「${entry.name}」吗？`)) return;
  await store.deleteEntry(entry.id);
  entries.value = entries.value.filter(e => e.id !== entry.id);
  if (selectedEntryId.value === entry.id) selectedEntryId.value = null;
}

function autoGenerateSample() {
  if (!selectedEntry.value || !selectedCategory.value) return;
  selectedEntry.value.updateSample = generateUpdateSample(selectedEntry.value, selectedCategory.value.scope);
}

// 导入/导出
async function handleExport() {
  const data = await store.exportDefinitions();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omg-definitions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastr.success('定义数据已导出');
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
      if (!data.version || !data.categories || !data.entries) {
        toastr.error('无效的定义文件格式');
        return;
      }
      if (!confirm('导入将覆盖现有定义数据，确定继续吗？')) return;
      await store.importDefinitions(data);
      await loadData();
      toastr.success('定义数据已导入');
    } catch {
      toastr.error('导入失败：文件解析出错');
    }
  };
  input.click();
}

// ─── 初始化 ───

async function loadData() {
  categories.value = await store.getAllCategories();
  entries.value = await store.getAllEntries();
  if (categories.value.length > 0 && !selectedCategoryId.value) {
    selectedCategoryId.value = categories.value[0].id;
  }
}

onMounted(() => loadData());
</script>

<style>
/* @doc: 数据工作室 | category: 管理器模块 | desc: 条目定义管理界面 */

.omg-ds {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--omg-space-lg);
}

.omg-ds__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-ds__title {
  font-size: var(--omg-font-lg);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-ds__title i {
  color: var(--omg-accent);
}

.omg-ds__actions {
  display: flex;
  gap: var(--omg-space-xs);
}

/* ── 内容区：左右分栏 ── */
.omg-ds__content {
  display: flex;
  gap: var(--omg-space-lg);
  flex: 1;
  min-height: 0;
}

/* ── 左侧分类 ── */
.omg-ds__categories {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  overflow: hidden;
}

.omg-ds__categories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--omg-space-sm) var(--omg-space-md);
  border-bottom: 1px solid var(--omg-border);
}

.omg-ds__categories-title {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.omg-ds__category-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--omg-space-xs);
}

.omg-ds__category-item {
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

.omg-ds__category-item:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-ds__category-item--active {
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
}

.omg-ds__category-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: var(--omg-font-xs);
}

.omg-ds__category-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.omg-ds__category-badge {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  background: var(--omg-bg-primary);
  padding: 1px 6px;
  border-radius: var(--omg-radius-full);
  min-width: 18px;
  text-align: center;
}

.omg-ds__category-scope {
  font-size: 9px;
  font-weight: var(--omg-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: var(--omg-radius-sm);
}

.omg-ds__category-scope--shared {
  color: var(--omg-info);
  background: hsla(205, 70%, 52%, 0.12);
}

.omg-ds__category-scope--character {
  color: var(--omg-success);
  background: hsla(152, 55%, 42%, 0.12);
}

/* ── 右侧主区域 ── */
.omg-ds__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
  min-width: 0;
}

.omg-ds__entries-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--omg-space-sm);
}

.omg-ds__entries-title {
  font-size: var(--omg-font-md);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
}

.omg-ds__entries-scope {
  font-weight: var(--omg-font-weight-normal);
  color: var(--omg-text-tertiary);
  font-size: var(--omg-font-sm);
}

.omg-ds__entries-actions {
  display: flex;
  gap: var(--omg-space-xs);
}

/* ── 条目列表 ── */
.omg-ds__entries-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
}

.omg-ds__entry-row {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  padding: var(--omg-space-sm) var(--omg-space-md);
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-md);
  cursor: pointer;
  transition: all var(--omg-transition-fast);
  border: 1px solid transparent;
}

.omg-ds__entry-row:hover {
  background: var(--omg-bg-tertiary);
}

.omg-ds__entry-row--active {
  border-color: var(--omg-accent);
  background: var(--omg-accent-subtle);
}

.omg-ds__entry-icon {
  width: 20px;
  text-align: center;
  color: var(--omg-text-tertiary);
  font-size: var(--omg-font-sm);
}

.omg-ds__entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.omg-ds__entry-name {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-medium);
  color: var(--omg-text-primary);
}

.omg-ds__entry-key {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  font-family: var(--omg-font-mono);
}

.omg-ds__entry-type {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  padding: 2px 8px;
  background: var(--omg-bg-primary);
  border-radius: var(--omg-radius-sm);
  white-space: nowrap;
}

/* ── 编辑面板 ── */
.omg-ds__editor {
  border-top: 1px solid var(--omg-border);
  padding-top: var(--omg-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

.omg-ds__editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-ds__editor-title {
  font-size: var(--omg-font-md);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
}

.omg-ds__editor-body {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

.omg-ds__editor-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--omg-space-md);
}

.omg-ds__textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
  resize: vertical;
  transition: border-color var(--omg-transition-fast);
}

.omg-ds__textarea:focus {
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 3px var(--omg-accent-subtle);
}

.omg-ds__textarea--code {
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
}

.omg-ds__zod-preview {
  display: block;
  padding: 8px 12px;
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  color: var(--omg-accent);
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-md);
  border: 1px solid var(--omg-border);
}

.omg-ds__editor-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--omg-space-sm);
}

/* ── 分类表单 ── */
.omg-ds__category-form {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

/* ── 过渡动画 ── */
.omg-slide-enter-active,
.omg-slide-leave-active {
  transition: all var(--omg-transition-normal);
}
.omg-slide-enter-from,
.omg-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .omg-ds__content {
    flex-direction: column;
  }

  .omg-ds__categories {
    width: 100%;
  }

  .omg-ds__category-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--omg-space-xs);
  }

  .omg-ds__category-item {
    width: auto;
  }

  .omg-ds__editor-row {
    grid-template-columns: 1fr;
  }
}
</style>
