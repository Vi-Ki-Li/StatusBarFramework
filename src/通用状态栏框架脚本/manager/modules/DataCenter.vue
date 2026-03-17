<template>
  <div class="omg-dc">
    <!-- 顶栏 -->
    <div class="omg-dc__toolbar">
      <h2 class="omg-dc__title">
        <i class="fa-solid fa-database" />
        数据中心
      </h2>
      <div class="omg-dc__actions">
        <OmgButton icon="fa-solid fa-rotate" size="sm" @click="reload"> 刷新 </OmgButton>
        <OmgButton icon="fa-solid fa-floppy-disk" size="sm" variant="primary" @click="saveAll">
          保存
          <span v-if="isDirty" class="omg-dc__dirty-badge">●</span>
        </OmgButton>
      </div>
    </div>

    <div class="omg-dc__content">
      <!-- 左侧：数据源选择 -->
      <aside class="omg-dc__sidebar">
        <!-- 共享数据 -->
        <button
          class="omg-dc__source-item"
          :class="{ 'omg-dc__source-item--active': source === 'shared' }"
          @click="source = 'shared'; selectedCharId = null"
        >
          <i class="fa-solid fa-globe omg-dc__source-icon" />
          <span>共享数据</span>
          <span class="omg-dc__source-count">{{ sharedKeyCount }}</span>
        </button>

        <div class="omg-dc__sidebar-divider" />

        <!-- 角色列表 -->
        <div class="omg-dc__sidebar-section-title">
          <i class="fa-solid fa-users" />
          角色数据
        </div>
        <div
          v-for="char in characterList"
          :key="char.char_id"
          class="omg-dc__char-row"
        >
          <button
            class="omg-dc__source-item omg-dc__source-item--char"
            :class="{ 'omg-dc__source-item--active': source === 'character' && selectedCharId === char.char_id }"
            @click="source = 'character'; selectedCharId = char.char_id"
          >
            <i class="fa-solid fa-user omg-dc__source-icon" />
            <span class="omg-dc__char-name">{{ char.name }}</span>
            <code class="omg-dc__char-id">{{ char.char_id }}</code>
          </button>
          <button
            class="omg-dc__present-toggle"
            :class="{ 'omg-dc__present-toggle--off': !char.isPresent }"
            :title="char.isPresent ? '在场 — 点击隐藏' : '不在场 — 点击显示'"
            @click="togglePresent(char.char_id)"
          >
            <i :class="char.isPresent ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'" />
          </button>
          <button
            v-if="char.char_id !== 'char_user'"
            class="omg-dc__char-delete"
            title="删除角色"
            @click="deleteCharacter(char.char_id)"
          >
            <i class="fa-solid fa-trash-can" />
          </button>
        </div>

        <div v-if="characterList.length === 0" class="omg-dc__sidebar-empty">暂无角色数据</div>

        <!-- 操作按钮 -->
        <div class="omg-dc__sidebar-actions">
          <OmgButton icon="fa-solid fa-user-plus" size="sm" variant="ghost" @click="showAddCharDialog = true">
            添加角色
          </OmgButton>
          <OmgButton
            v-if="source === 'shared'"
            icon="fa-solid fa-eraser" size="sm" variant="danger"
            @click="clearSharedData"
          >
            清空共享
          </OmgButton>
          <OmgButton
            v-if="source === 'character' && selectedCharId"
            icon="fa-solid fa-eraser" size="sm" variant="danger"
            @click="clearCharacterData"
          >
            清空角色数据
          </OmgButton>
        </div>
      </aside>

      <!-- 右侧：数据编辑器 -->
      <div class="omg-dc__main">
        <template v-if="currentData">
          <!-- 分类分组显示 -->
          <div
            v-for="group in groupedEntries"
            :key="group.category"
            class="omg-dc__group"
          >
            <div class="omg-dc__group-header">
              <i :class="group.icon || 'fa-solid fa-folder'" class="omg-dc__group-icon" />
              <span class="omg-dc__group-name">{{ group.category }}</span>
              <span class="omg-dc__group-count">{{ group.entries.length }}</span>
            </div>
            <div class="omg-dc__group-body">
              <div
                v-for="entry in group.entries"
                :key="entry.key"
                class="omg-dc__entry-row"
              >
                <span class="omg-dc__entry-key" :title="entry.key">{{ entry.key }}</span>
                <span v-if="entry.defName" class="omg-dc__entry-def">{{ entry.defName }}</span>
                <!-- 值编辑 -->
                <input
                  v-if="entry.type === 'number'"
                  type="number"
                  class="omg-dc__entry-value"
                  :value="entry.value"
                  @change="updateEntry(entry.key, Number(($event.target as HTMLInputElement).value))"
                />
                <select
                  v-else-if="entry.type === 'boolean'"
                  class="omg-dc__entry-value omg-dc__entry-value--select"
                  :value="String(entry.value)"
                  @change="updateEntry(entry.key, ($event.target as HTMLSelectElement).value === 'true')"
                >
                  <option value="true">是</option>
                  <option value="false">否</option>
                </select>
                <input
                  v-else-if="entry.type === 'string'"
                  type="text"
                  class="omg-dc__entry-value"
                  :value="entry.value"
                  @change="updateEntry(entry.key, ($event.target as HTMLInputElement).value)"
                />
                <textarea
                  v-else
                  class="omg-dc__entry-value omg-dc__entry-value--json"
                  :value="JSON.stringify(entry.value, null, 2)"
                  rows="2"
                  @change="updateJsonEntry(entry.key, ($event.target as HTMLTextAreaElement).value)"
                />
                <span class="omg-dc__entry-type">{{ typeLabel(entry.type) }}</span>
                <button class="omg-dc__entry-delete" title="删除" @click="deleteEntry(entry.key)">
                  <i class="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
          </div>

          <!-- 新增条目 -->
          <div class="omg-dc__add-entry">
            <div class="omg-dc__add-entry-form">
              <input
                v-model="newEntryKey"
                class="omg-dc__add-input"
                placeholder="KEY（输入或从建议中选择）"
                list="omg-dc-suggestions"
              />
              <datalist id="omg-dc-suggestions">
                <option v-for="s in suggestions" :key="s" :value="s" />
              </datalist>
              <input
                v-model="newEntryValue"
                class="omg-dc__add-input"
                placeholder="值"
              />
              <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="addEntry"> 添加 </OmgButton>
            </div>
          </div>
        </template>

        <OmgEmpty v-else text="请从左侧选择数据源" icon="fa-solid fa-database" />
      </div>
    </div>

    <!-- 添加角色对话框 -->
    <OmgModal v-model="showAddCharDialog" title="添加角色">
      <div class="omg-dc__add-char-form">
        <OmgInput v-model="newCharName" label="角色名称" placeholder="角色名" required />
        <OmgInput v-model="newCharId" label="角色 ID" placeholder="自动生成（或手动输入 char_xxx）" />
      </div>
      <template #footer>
        <OmgButton variant="ghost" @click="showAddCharDialog = false">取消</OmgButton>
        <OmgButton variant="primary" @click="addCharacter">添加</OmgButton>
      </template>
    </OmgModal>
  </div>
</template>

<script setup lang="ts">
import OmgButton from '../../components/base/OmgButton.vue';
import OmgEmpty from '../../components/base/OmgEmpty.vue';
import OmgInput from '../../components/base/OmgInput.vue';
import OmgModal from '../../components/base/OmgModal.vue';
import { getAllCategories, getAllEntries } from '../../data/definitions-store';
import type { CategoryDef, DefinitionEntry } from '../../data/definitions';
import type { CharId, CharacterInfo, FrameworkState } from '../../data/types';
import { createEmptyState, isNil } from '../../data/types';
import { loadState, saveState } from '../../data/variables';

// ─── 状态 ───

const staging = ref<FrameworkState>(createEmptyState());
const originalJson = ref('');
const source = ref<'shared' | 'character'>('shared');
const selectedCharId = ref<CharId | null>(null);
const showAddCharDialog = ref(false);
const newCharName = ref('');
const newCharId = ref('');
const newEntryKey = ref('');
const newEntryValue = ref('');

const categories = ref<CategoryDef[]>([]);
const definitions = ref<DefinitionEntry[]>([]);

// ─── 计算属性 ───

const isDirty = computed(() => JSON.stringify(staging.value) !== originalJson.value);

const characterList = computed((): CharacterInfo[] => {
  return Object.values(staging.value._characters).sort((a, b) => {
    if (a.char_id === 'char_user') return -1;
    if (b.char_id === 'char_user') return 1;
    return a.name.localeCompare(b.name);
  });
});

const sharedKeyCount = computed(() => Object.keys(staging.value.shared).length);

const currentData = computed((): Record<string, any> | null => {
  if (source.value === 'shared') return staging.value.shared;
  if (source.value === 'character' && selectedCharId.value) {
    return staging.value.characters[selectedCharId.value] ?? null;
  }
  return null;
});

interface DisplayEntry {
  key: string;
  value: any;
  type: string;
  categoryId?: string;
  defName?: string;
}

interface GroupedData {
  category: string;
  icon?: string;
  entries: DisplayEntry[];
}

const groupedEntries = computed((): GroupedData[] => {
  const data = currentData.value;
  if (!data) return [];

  const defMap = new Map(definitions.value.map(d => [d.key, d]));
  const catMap = new Map(categories.value.map(c => [c.id, c]));

  const groups = new Map<string, GroupedData>();
  const otherEntries: DisplayEntry[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (isNil(value)) continue;

    const def = defMap.get(key);
    const entry: DisplayEntry = {
      key,
      value,
      type: typeof value,
      categoryId: def?.categoryId,
      defName: def?.name,
    };

    if (def && def.categoryId) {
      const cat = catMap.get(def.categoryId);
      const catName = cat?.name ?? '未知分类';
      if (!groups.has(def.categoryId)) {
        groups.set(def.categoryId, { category: catName, icon: cat?.icon, entries: [] });
      }
      groups.get(def.categoryId)!.entries.push(entry);
    } else {
      otherEntries.push(entry);
    }
  }

  const result = Array.from(groups.values());
  if (otherEntries.length > 0) {
    result.push({ category: '其他', icon: 'fa-solid fa-ellipsis', entries: otherEntries });
  }
  return result;
});

const suggestions = computed(() => {
  const data = currentData.value ?? {};
  const existingKeys = new Set(Object.keys(data));
  const scope = source.value === 'shared' ? 'shared' : 'character';
  return definitions.value
    .filter(d => {
      const cat = categories.value.find(c => c.id === d.categoryId);
      return cat?.scope === scope && !existingKeys.has(d.key);
    })
    .map(d => d.key);
});

// ─── 方法 ───

function typeLabel(t: string): string {
  switch (t) {
    case 'number': return '数字';
    case 'boolean': return '布尔';
    case 'string': return '文本';
    case 'object': return 'JSON';
    default: return t;
  }
}

function updateEntry(key: string, value: any) {
  const data = currentData.value;
  if (data) data[key] = value;
}

function updateJsonEntry(key: string, jsonStr: string) {
  const data = currentData.value;
  if (!data) return;
  try {
    data[key] = JSON.parse(jsonStr);
  } catch {
    toastr.warning('JSON 格式无效');
  }
}

function deleteEntry(key: string) {
  const data = currentData.value;
  if (data) delete data[key];
}

function addEntry() {
  if (!newEntryKey.value.trim()) {
    toastr.warning('请输入 KEY');
    return;
  }
  const data = currentData.value;
  if (!data) return;

  let value: any = newEntryValue.value;
  if (value === 'true') value = true;
  else if (value === 'false') value = false;
  else if (!isNaN(Number(value)) && value.trim() !== '') value = Number(value);

  data[newEntryKey.value.trim()] = value;
  newEntryKey.value = '';
  newEntryValue.value = '';
}

function togglePresent(charId: CharId) {
  const info = staging.value._characters[charId];
  if (info) info.isPresent = !info.isPresent;
}

function clearSharedData() {
  if (!confirm('确定要清空所有共享数据吗？')) return;
  staging.value.shared = {};
}

function clearCharacterData() {
  if (!selectedCharId.value) return;
  const name = staging.value._characters[selectedCharId.value]?.name ?? selectedCharId.value;
  if (!confirm(`确定要清空「${name}」的所有数据吗？`)) return;
  staging.value.characters[selectedCharId.value] = {};
}

function deleteCharacter(charId: CharId) {
  if (charId === 'char_user') return;
  const name = staging.value._characters[charId]?.name ?? charId;
  if (!confirm(`确定要删除角色「${name}」及其所有数据吗？`)) return;
  delete staging.value._characters[charId];
  delete staging.value.characters[charId];
  if (selectedCharId.value === charId) {
    selectedCharId.value = null;
    source.value = 'shared';
  }
}

function addCharacter() {
  if (!newCharName.value.trim()) {
    toastr.warning('请输入角色名称');
    return;
  }
  const id = (newCharId.value.trim() || `char_${Date.now().toString(36)}`) as CharId;
  if (!id.startsWith('char_')) {
    toastr.warning('角色 ID 必须以 char_ 开头');
    return;
  }
  staging.value._characters[id] = { char_id: id, name: newCharName.value.trim(), isPresent: true };
  staging.value.characters[id] = {};
  showAddCharDialog.value = false;
  newCharName.value = '';
  newCharId.value = '';
  source.value = 'character';
  selectedCharId.value = id;
}

function reload() {
  const state = loadState();
  staging.value = state;
  originalJson.value = JSON.stringify(state);
  toastr.info('数据已刷新');
}

function saveAll() {
  saveState(staging.value);
  originalJson.value = JSON.stringify(staging.value);
  toastr.success('数据已保存');
}

// ─── 初始化 ───

onMounted(async () => {
  reload();
  categories.value = await getAllCategories();
  definitions.value = await getAllEntries();
});
</script>

<style>
/* @doc: 数据中心 | category: 管理器模块 | desc: 实时数据编辑器 */

.omg-dc {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--omg-space-lg);
}

.omg-dc__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-dc__title {
  font-size: var(--omg-font-lg);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-dc__title i {
  color: var(--omg-accent);
}

.omg-dc__actions {
  display: flex;
  gap: var(--omg-space-xs);
}

.omg-dc__dirty-badge {
  color: var(--omg-warning);
  margin-left: 2px;
}

/* ── 内容区 ── */
.omg-dc__content {
  display: flex;
  gap: var(--omg-space-lg);
  flex: 1;
  min-height: 0;
}

/* ── 左侧栏 ── */
.omg-dc__sidebar {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  padding: var(--omg-space-xs);
  overflow-y: auto;
  gap: 2px;
}

.omg-dc__source-item {
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
  flex: 1;
  min-width: 0;
}

.omg-dc__source-item:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-dc__source-item--active {
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
}

.omg-dc__source-icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.omg-dc__source-count {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  background: var(--omg-bg-primary);
  padding: 0 6px;
  border-radius: var(--omg-radius-full);
  margin-left: auto;
}

.omg-dc__sidebar-divider {
  height: 1px;
  background: var(--omg-border);
  margin: var(--omg-space-xs) var(--omg-space-sm);
}

.omg-dc__sidebar-section-title {
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

.omg-dc__char-row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.omg-dc__char-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.omg-dc__char-id {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  font-family: var(--omg-font-mono);
}

.omg-dc__present-toggle,
.omg-dc__char-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  font-size: var(--omg-font-xs);
  transition: all var(--omg-transition-fast);
  flex-shrink: 0;
}

.omg-dc__present-toggle:hover {
  color: var(--omg-accent);
  background: var(--omg-accent-subtle);
}

.omg-dc__present-toggle--off {
  opacity: 0.5;
}

.omg-dc__char-delete:hover {
  color: var(--omg-danger);
  background: hsla(0, 72%, 58%, 0.1);
}

.omg-dc__sidebar-empty {
  padding: var(--omg-space-md);
  text-align: center;
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-dc__sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-xs);
  padding: var(--omg-space-sm);
  margin-top: auto;
  border-top: 1px solid var(--omg-border);
}

/* ── 右侧主区域 ── */
.omg-dc__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
  min-width: 0;
  overflow-y: auto;
}

/* ── 分组 ── */
.omg-dc__group {
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  overflow: hidden;
}

.omg-dc__group-header {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  padding: var(--omg-space-sm) var(--omg-space-md);
  background: var(--omg-bg-tertiary);
}

.omg-dc__group-icon {
  width: 14px;
  text-align: center;
  color: var(--omg-accent);
  font-size: var(--omg-font-xs);
}

.omg-dc__group-name {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
}

.omg-dc__group-count {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  margin-left: auto;
}

.omg-dc__group-body {
  padding: var(--omg-space-xs);
}

/* ── 条目行 ── */
.omg-dc__entry-row {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  padding: var(--omg-space-xs) var(--omg-space-sm);
  border-radius: var(--omg-radius-sm);
  transition: background var(--omg-transition-fast);
}

.omg-dc__entry-row:hover {
  background: var(--omg-bg-primary);
}

.omg-dc__entry-key {
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  color: var(--omg-accent);
  min-width: 80px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.omg-dc__entry-def {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  min-width: 60px;
  flex-shrink: 0;
}

.omg-dc__entry-value {
  flex: 1;
  min-width: 80px;
  padding: 3px 8px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-sm);
  outline: none;
  transition: border-color var(--omg-transition-fast);
}

.omg-dc__entry-value:focus {
  border-color: var(--omg-accent);
}

.omg-dc__entry-value--select {
  cursor: pointer;
}

.omg-dc__entry-value--json {
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  resize: vertical;
  min-height: 32px;
}

.omg-dc__entry-type {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  background: var(--omg-bg-tertiary);
  padding: 1px 5px;
  border-radius: var(--omg-radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.omg-dc__entry-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  font-size: var(--omg-font-xs);
  flex-shrink: 0;
  transition: all var(--omg-transition-fast);
}

.omg-dc__entry-delete:hover {
  color: var(--omg-danger);
  background: hsla(0, 72%, 58%, 0.1);
}

/* ── 新增条目 ── */
.omg-dc__add-entry {
  padding: var(--omg-space-sm);
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
}

.omg-dc__add-entry-form {
  display: flex;
  gap: var(--omg-space-sm);
  align-items: center;
}

.omg-dc__add-input {
  flex: 1;
  padding: 6px 10px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
}

.omg-dc__add-input:focus {
  border-color: var(--omg-accent);
}

/* ── 添加角色表单 ── */
.omg-dc__add-char-form {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .omg-dc__content {
    flex-direction: column;
  }

  .omg-dc__sidebar {
    width: 100%;
  }
}
</style>
