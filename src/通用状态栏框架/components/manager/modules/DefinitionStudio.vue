<script setup lang="ts">
/**
 * 定义工坊 (Definition Studio)
 *
 * 功能：全局的"条目字典"，用于创建和管理所有分类和数据条目的结构和元数据
 *
 * 根据开发总纲：
 * - 分类列表：CRUD 数据类别，设定 shared/character 属性
 * - 条目列表：按类别分组，提供 CRUD
 * - 属性编辑器：key, name, category, icon, entry_type, parts, ui_type, separator, etc.
 */
import type {
    CategoryDefinition,
    CategoryScope,
    DataType,
    EntryType,
    ItemDefinition
} from '@/通用状态栏框架/types';
import { computed, reactive, ref } from 'vue';

// ==================== 状态 ====================

const categories = ref<Record<string, CategoryDefinition>>({});
const itemDefinitions = ref<Record<string, ItemDefinition>>({});

// UI 状态
const selectedCategoryKey = ref<string | null>(null);
const isSidebarCollapsed = ref(false);
const isEditingCategory = ref(false);
const isEditingItem = ref(false);

// 编辑表单
const categoryForm = reactive<CategoryDefinition>({
  key: '',
  name: '',
  icon: 'folder',
  order: 0,
  scope: 'character',
});

const itemForm = reactive<ItemDefinition>({
  key: '',
  name: '',
  icon: '',
  category: '',
  entry_type: 'Single',
  parts: [],
  separator: '|',
  secondary_separator: '@',
  description: '',
});

// ==================== 计算属性 ====================

const sortedCategories = computed(() =>
  Object.values(categories.value).sort((a, b) => a.order - b.order)
);

const filteredItems = computed(() => {
  const items = Object.values(itemDefinitions.value);
  if (!selectedCategoryKey.value) return items;
  return items.filter(item => item.category === selectedCategoryKey.value);
});

const currentCategory = computed(() =>
  selectedCategoryKey.value ? categories.value[selectedCategoryKey.value] : null
);

// 自动生成格式字符串
const generatedFormat = computed(() => {
  if (!itemForm.key || !itemForm.category) return '';

  const cat = categories.value[itemForm.category];
  const scope = cat?.scope === 'shared' ? 'ST' : '{角色}';
  const categoryKey = itemForm.category;

  let valuePart = '';
  if (itemForm.parts.length === 0) {
    valuePart = `{${itemForm.key}}`;
  } else if (itemForm.entry_type === 'Single') {
    valuePart = itemForm.parts.map(p => `{${p.key}}`).join(itemForm.separator);
  } else {
    // List
    const partTemplate = itemForm.parts.length > 1
      ? itemForm.parts.map(p => `{${p.key}}`).join(itemForm.secondary_separator || '@')
      : `{${itemForm.parts[0]?.key || 'item'}}`;
    valuePart = `${partTemplate}${itemForm.separator}...`;
  }

  return `[${scope}^${categoryKey}|${itemForm.key}::${valuePart}]`;
});

// ==================== 分类操作 ====================

function openNewCategory() {
  Object.assign(categoryForm, {
    key: '',
    name: '',
    icon: 'folder',
    order: sortedCategories.value.length,
    scope: 'character' as CategoryScope,
  });
  isEditingCategory.value = true;
}

function editCategory(cat: CategoryDefinition) {
  Object.assign(categoryForm, { ...cat });
  isEditingCategory.value = true;
}

function saveCategory() {
  if (!categoryForm.key.trim() || !categoryForm.name.trim()) return;

  categories.value[categoryForm.key] = { ...categoryForm };
  isEditingCategory.value = false;
}

function deleteCategory(key: string) {
  if (confirm(`确定删除分类 "${categories.value[key]?.name}"？\n注意：不会删除属于该分类的条目定义。`)) {
    delete categories.value[key];
    if (selectedCategoryKey.value === key) {
      selectedCategoryKey.value = null;
    }
  }
}

// ==================== 条目操作 ====================

function openNewItem() {
  Object.assign(itemForm, {
    key: '',
    name: '',
    icon: '',
    category: selectedCategoryKey.value || '',
    entry_type: 'Single' as EntryType,
    parts: [{ key: 'value', label: '值', data_type: 'string' as DataType }],
    separator: '|',
    secondary_separator: '@',
    description: '',
  });
  isEditingItem.value = true;
}

function editItem(item: ItemDefinition) {
  Object.assign(itemForm, {
    ...item,
    parts: item.parts.map(p => ({ ...p })),
  });
  isEditingItem.value = true;
}

function saveItem() {
  if (!itemForm.key.trim() || !itemForm.name.trim()) return;

  // 更新 format
  itemForm.format = generatedFormat.value;

  itemDefinitions.value[itemForm.key] = {
    ...itemForm,
    parts: itemForm.parts.map(p => ({ ...p })),
  };
  isEditingItem.value = false;
}

function deleteItem(key: string) {
  if (confirm(`确定删除条目定义 "${itemDefinitions.value[key]?.name}"？`)) {
    delete itemDefinitions.value[key];
  }
}

// ==================== Parts 操作 ====================

function addPart() {
  itemForm.parts.push({
    key: '',
    label: '',
    data_type: 'string',
  });
}

function removePart(index: number) {
  itemForm.parts.splice(index, 1);
}

function movePart(index: number, direction: -1 | 1) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= itemForm.parts.length) return;
  const temp = itemForm.parts[index];
  itemForm.parts[index] = itemForm.parts[newIndex];
  itemForm.parts[newIndex] = temp;
}

// ==================== 图标 ====================

const iconPaths: Record<string, string> = {
  folder: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  x: 'M18 6L6 18M6 6l12 12',
  chevronUp: 'M18 15l-6-6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  database: 'M12 2C6.48 2 2 4.69 2 8v8c0 3.31 4.48 6 10 6s10-2.69 10-6V8c0-3.31-4.48-6-10-6zm0 2c4.42 0 8 1.79 8 4s-3.58 4-8 4-8-1.79-8-4 3.58-4 8-4z',
  box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  singleUser: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
};
</script>

<template>
  <div class="definition-studio">
    <!-- 左侧分类列表 -->
    <aside class="studio__sidebar" :class="{ 'studio__sidebar--collapsed': isSidebarCollapsed }">
      <div class="studio__sidebar-header">
        <span class="studio__sidebar-title">分类列表</span>
        <button class="studio__icon-btn" title="新建分类" @click="openNewCategory">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path :d="iconPaths.plus" />
          </svg>
        </button>
      </div>

      <div class="studio__sidebar-content">
        <!-- 全部 -->
        <button
          class="studio__category-item"
          :class="{ 'studio__category-item--active': selectedCategoryKey === null }"
          @click="selectedCategoryKey = null"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path :d="iconPaths.database" />
          </svg>
          <span>全部条目</span>
          <span class="studio__category-count">{{ Object.keys(itemDefinitions).length }}</span>
        </button>

        <!-- 分类列表 -->
        <button
          v-for="cat in sortedCategories"
          :key="cat.key"
          class="studio__category-item"
          :class="{ 'studio__category-item--active': selectedCategoryKey === cat.key }"
          @click="selectedCategoryKey = cat.key"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path :d="iconPaths.folder" />
          </svg>
          <span>{{ cat.name }}</span>
          <span class="studio__category-badge" :class="cat.scope === 'shared' ? 'studio__category-badge--shared' : ''">
            {{ cat.scope === 'shared' ? '共享' : '角色' }}
          </span>
          <div class="studio__category-actions">
            <button class="studio__mini-btn" title="编辑" @click.stop="editCategory(cat)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.edit" />
              </svg>
            </button>
            <button class="studio__mini-btn studio__mini-btn--danger" title="删除" @click.stop="deleteCategory(cat.key)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.trash" />
              </svg>
            </button>
          </div>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="studio__main">
      <!-- 工具栏 -->
      <div class="studio__toolbar">
        <h2 class="studio__section-title">
          {{ currentCategory ? currentCategory.name : '全部条目' }}
          <span class="studio__item-count">({{ filteredItems.length }} 项)</span>
        </h2>
        <div class="studio__toolbar-actions">
          <button class="studio__btn studio__btn--primary" @click="openNewItem">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="iconPaths.plus" />
            </svg>
            新建条目
          </button>
        </div>
      </div>

      <!-- 条目列表 -->
      <div class="studio__items-grid">
        <div
          v-for="item in filteredItems"
          :key="item.key"
          class="studio__item-card"
          @click="editItem(item)"
        >
          <div class="studio__item-header">
            <span class="studio__item-key">{{ item.key }}</span>
            <span class="studio__item-type" :class="item.entry_type === 'List' ? 'studio__item-type--list' : ''">
              {{ item.entry_type }}
            </span>
          </div>
          <div class="studio__item-name">{{ item.name }}</div>
          <div class="studio__item-parts">
            <span v-for="part in item.parts" :key="part.key" class="studio__part-tag">
              {{ part.label }}
            </span>
          </div>
          <div class="studio__item-format">{{ item.format }}</div>
          <div class="studio__item-actions">
            <button class="studio__mini-btn studio__mini-btn--danger" title="删除" @click.stop="deleteItem(item.key)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.trash" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredItems.length === 0" class="studio__empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path :d="iconPaths.box" />
          </svg>
          <p>暂无条目定义</p>
          <button class="studio__btn studio__btn--primary" @click="openNewItem">创建第一个条目</button>
        </div>
      </div>
    </main>

    <!-- 分类编辑抽屉 -->
    <Teleport to="body">
      <div v-if="isEditingCategory" class="studio__drawer-overlay" @click="isEditingCategory = false">
        <div class="studio__drawer" @click.stop>
          <div class="studio__drawer-header">
            <h3>{{ categoryForm.key ? '编辑分类' : '新建分类' }}</h3>
            <button class="studio__icon-btn" @click="isEditingCategory = false">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.x" />
              </svg>
            </button>
          </div>

          <div class="studio__drawer-content">
            <div class="studio__form-group">
              <label>唯一键 (Key)</label>
              <input v-model="categoryForm.key" type="text" placeholder="如: CV, CP" />
            </div>
            <div class="studio__form-group">
              <label>显示名称</label>
              <input v-model="categoryForm.name" type="text" placeholder="如: 角色属性" />
            </div>
            <div class="studio__form-group">
              <label>作用域</label>
              <div class="studio__radio-group">
                <label class="studio__radio">
                  <input v-model="categoryForm.scope" type="radio" value="character" />
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path :d="iconPaths.singleUser" />
                  </svg>
                  角色数据
                </label>
                <label class="studio__radio">
                  <input v-model="categoryForm.scope" type="radio" value="shared" />
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path :d="iconPaths.users" />
                  </svg>
                  共享数据
                </label>
              </div>
            </div>
            <div class="studio__form-group">
              <label>排序权重</label>
              <input v-model.number="categoryForm.order" type="number" min="0" />
            </div>
          </div>

          <div class="studio__drawer-footer">
            <button class="studio__btn" @click="isEditingCategory = false">取消</button>
            <button class="studio__btn studio__btn--primary" @click="saveCategory">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.save" />
              </svg>
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 条目编辑抽屉 -->
    <Teleport to="body">
      <div v-if="isEditingItem" class="studio__drawer-overlay" @click="isEditingItem = false">
        <div class="studio__drawer studio__drawer--wide" @click.stop>
          <div class="studio__drawer-header">
            <h3>{{ itemForm.key ? '编辑条目' : '新建条目' }}</h3>
            <button class="studio__icon-btn" @click="isEditingItem = false">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.x" />
              </svg>
            </button>
          </div>

          <div class="studio__drawer-content">
            <!-- 基础信息 -->
            <div class="studio__form-row">
              <div class="studio__form-group">
                <label>唯一键 (Key) *</label>
                <input v-model="itemForm.key" type="text" placeholder="如: HP, 背包" />
              </div>
              <div class="studio__form-group">
                <label>显示名称 *</label>
                <input v-model="itemForm.name" type="text" placeholder="如: 生命值" />
              </div>
            </div>

            <div class="studio__form-row">
              <div class="studio__form-group">
                <label>所属分类</label>
                <select v-model="itemForm.category">
                  <option value="">-- 选择分类 --</option>
                  <option v-for="cat in sortedCategories" :key="cat.key" :value="cat.key">
                    {{ cat.name }} ({{ cat.key }})
                  </option>
                </select>
              </div>
              <div class="studio__form-group">
                <label>条目类型 (entry_type)</label>
                <div class="studio__radio-group">
                  <label class="studio__radio">
                    <input v-model="itemForm.entry_type" type="radio" value="Single" />
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path :d="iconPaths.box" />
                    </svg>
                    单体 (Single)
                  </label>
                  <label class="studio__radio">
                    <input v-model="itemForm.entry_type" type="radio" value="List" />
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path :d="iconPaths.list" />
                    </svg>
                    列表 (List)
                  </label>
                </div>
              </div>
            </div>

            <!-- 分隔符 -->
            <div class="studio__form-row">
              <div class="studio__form-group studio__form-group--small">
                <label>主分隔符</label>
                <input v-model="itemForm.separator" type="text" placeholder="|" />
              </div>
              <div v-if="itemForm.entry_type === 'List'" class="studio__form-group studio__form-group--small">
                <label>次分隔符</label>
                <input v-model="itemForm.secondary_separator" type="text" placeholder="@" />
              </div>
            </div>

            <!-- Parts 结构定义 -->
            <div class="studio__form-group">
              <div class="studio__parts-header">
                <label>结构定义 (Parts)</label>
                <button class="studio__btn studio__btn--small" @click="addPart">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path :d="iconPaths.plus" />
                  </svg>
                  添加
                </button>
              </div>

              <div class="studio__parts-list">
                <div v-for="(part, index) in itemForm.parts" :key="index" class="studio__part-row">
                  <input v-model="part.key" type="text" placeholder="key" class="studio__part-input" />
                  <input v-model="part.label" type="text" placeholder="标签" class="studio__part-input" />
                  <select v-model="part.data_type" class="studio__part-select">
                    <option value="string">文本</option>
                    <option value="number">数字</option>
                    <option value="boolean">布尔</option>
                  </select>
                  <div class="studio__part-actions">
                    <button class="studio__mini-btn" :disabled="index === 0" @click="movePart(index, -1)">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path :d="iconPaths.chevronUp" />
                      </svg>
                    </button>
                    <button class="studio__mini-btn" :disabled="index === itemForm.parts.length - 1" @click="movePart(index, 1)">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path :d="iconPaths.chevronDown" />
                      </svg>
                    </button>
                    <button class="studio__mini-btn studio__mini-btn--danger" @click="removePart(index)">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path :d="iconPaths.trash" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI 描述 -->
            <div class="studio__form-group">
              <label>AI 描述</label>
              <textarea v-model="itemForm.description" rows="3" placeholder="给 AI 的说明，如：简述角色当前的生命状态"></textarea>
            </div>

            <!-- 自动生成的格式 -->
            <div class="studio__form-group">
              <label>自动生成格式 (format)</label>
              <div class="studio__format-preview">{{ generatedFormat }}</div>
            </div>
          </div>

          <div class="studio__drawer-footer">
            <button class="studio__btn" @click="isEditingItem = false">取消</button>
            <button class="studio__btn studio__btn--secondary">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.upload" />
              </svg>
              注入世界书
            </button>
            <button class="studio__btn studio__btn--primary" @click="saveItem">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="iconPaths.save" />
              </svg>
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ========================================
   定义工坊样式 - 左侧分类 + 右侧条目网格
   ======================================== */

.definition-studio {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: var(--bg-app, #f9fafb);
}

/* ====== 侧边栏 ====== */
.studio__sidebar {
  width: 260px;
  min-width: 260px;
  background: rgba(255, 255, 255, 0.8);
  border-right: 1px solid var(--border-base, rgba(0,0,0,0.08));
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.studio__sidebar--collapsed {
  width: 0;
  min-width: 0;
  opacity: 0;
  overflow: hidden;
}

.studio__sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-base, rgba(0,0,0,0.08));
}

.studio__sidebar-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.studio__sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.studio__category-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary, #6b7280);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.studio__category-item:hover {
  background: var(--surface-hover, rgba(0,0,0,0.04));
  color: var(--text-primary, #1f2937);
}

.studio__category-item--active {
  background: var(--color-primary-subtle, rgba(99, 102, 241, 0.1));
  color: var(--color-primary, #6366f1);
}

.studio__category-count {
  margin-left: auto;
  font-size: 0.75rem;
  background: var(--surface-hover, rgba(0,0,0,0.05));
  padding: 2px 8px;
  border-radius: 10px;
}

.studio__category-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-primary-subtle, rgba(99, 102, 241, 0.1));
  color: var(--color-primary, #6366f1);
}

.studio__category-badge--shared {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.studio__category-actions {
  display: none;
  gap: 4px;
  margin-left: auto;
}

.studio__category-item:hover .studio__category-actions {
  display: flex;
}

.studio__category-item:hover .studio__category-count,
.studio__category-item:hover .studio__category-badge {
  display: none;
}

/* ====== 主内容区 ====== */
.studio__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.studio__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-base, rgba(0,0,0,0.08));
  background: rgba(255,255,255,0.6);
}

.studio__section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.studio__item-count {
  font-weight: 400;
  color: var(--text-tertiary, #9ca3af);
  font-size: 0.9rem;
}

.studio__toolbar-actions {
  display: flex;
  gap: 8px;
}

/* ====== 条目网格 ====== */
.studio__items-grid {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
}

.studio__item-card {
  background: #fff;
  border: 1px solid var(--border-base, rgba(0,0,0,0.08));
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.studio__item-card:hover {
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.studio__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.studio__item-key {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-primary, #6366f1);
  background: var(--color-primary-subtle, rgba(99, 102, 241, 0.1));
  padding: 2px 8px;
  border-radius: 4px;
}

.studio__item-type {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.studio__item-type--list {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.studio__item-name {
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 8px;
}

.studio__item-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.studio__part-tag {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--surface-hover, rgba(0,0,0,0.05));
  color: var(--text-secondary, #6b7280);
}

.studio__item-format {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-tertiary, #9ca3af);
  background: var(--surface-hover, rgba(0,0,0,0.03));
  padding: 6px 8px;
  border-radius: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio__item-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: none;
}

.studio__item-card:hover .studio__item-actions {
  display: flex;
}

/* ====== 空状态 ====== */
.studio__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--text-tertiary, #9ca3af);
}

.studio__empty svg {
  opacity: 0.5;
  margin-bottom: 16px;
}

.studio__empty p {
  margin: 0 0 16px;
}

/* ====== 按钮 ====== */
.studio__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-base, rgba(0,0,0,0.1));
  border-radius: 8px;
  background: #fff;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio__btn:hover {
  background: var(--surface-hover, rgba(0,0,0,0.04));
  border-color: var(--border-base, rgba(0,0,0,0.15));
}

.studio__btn--primary {
  background: linear-gradient(135deg, var(--color-primary, #6366f1), #4f46e5);
  color: #fff;
  border: none;
}

.studio__btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.studio__btn--secondary {
  background: var(--color-primary-subtle, rgba(99, 102, 241, 0.1));
  color: var(--color-primary, #6366f1);
  border: none;
}

.studio__btn--small {
  padding: 4px 10px;
  font-size: 0.8rem;
}

.studio__icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
  transition: all 0.2s ease;
}

.studio__icon-btn:hover {
  background: var(--surface-hover, rgba(0,0,0,0.05));
  color: var(--text-primary, #1f2937);
}

.studio__mini-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
  transition: all 0.15s ease;
}

.studio__mini-btn:hover {
  background: var(--surface-hover, rgba(0,0,0,0.08));
  color: var(--text-primary, #1f2937);
}

.studio__mini-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.studio__mini-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ====== 抽屉 ====== */
.studio__drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.studio__drawer {
  width: 420px;
  max-width: 95vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.studio__drawer--wide {
  width: 600px;
}

.studio__drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-base, rgba(0,0,0,0.08));
}

.studio__drawer-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.studio__drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.studio__drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-base, rgba(0,0,0,0.08));
  background: rgba(249, 250, 251, 0.9);
}

/* ====== 表单 ====== */
.studio__form-group {
  margin-bottom: 16px;
}

.studio__form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 6px;
}

.studio__form-group input,
.studio__form-group select,
.studio__form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-base, rgba(0,0,0,0.1));
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text-primary, #1f2937);
  background: #fff;
  transition: border-color 0.2s ease;
}

.studio__form-group input:focus,
.studio__form-group select:focus,
.studio__form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #6366f1);
  box-shadow: 0 0 0 3px var(--color-primary-subtle, rgba(99, 102, 241, 0.1));
}

.studio__form-row {
  display: flex;
  gap: 16px;
}

.studio__form-row .studio__form-group {
  flex: 1;
}

.studio__form-group--small {
  max-width: 100px;
}

.studio__radio-group {
  display: flex;
  gap: 16px;
}

.studio__radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary, #6b7280);
}

.studio__radio input[type="radio"] {
  width: auto;
  margin: 0;
}

/* ====== Parts 编辑器 ====== */
.studio__parts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.studio__parts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.studio__part-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.studio__part-input {
  flex: 1;
  padding: 8px 10px !important;
  font-size: 0.85rem !important;
}

.studio__part-select {
  width: 90px;
  padding: 8px 6px !important;
  font-size: 0.85rem !important;
}

.studio__part-actions {
  display: flex;
  gap: 2px;
}

/* ====== Format 预览 ====== */
.studio__format-preview {
  font-family: monospace;
  font-size: 0.9rem;
  padding: 12px;
  background: var(--surface-hover, rgba(0,0,0,0.03));
  border-radius: 8px;
  border: 1px solid var(--border-base, rgba(0,0,0,0.08));
  color: var(--color-primary, #6366f1);
}
</style>
