<template>
  <div class="omg-sc">
    <!-- 顶栏 -->
    <div class="omg-sc__toolbar">
      <h2 class="omg-sc__title">
        <i class="fa-solid fa-gear" />
        系统配置
      </h2>
    </div>

    <!-- 子标签页 -->
    <div class="omg-sc__tabs">
      <button
        v-for="tab in subTabs"
        :key="tab.key"
        class="omg-sc__tab"
        :class="{ 'omg-sc__tab--active': activeSubTab === tab.key }"
        @click="activeSubTab = tab.key"
      >
        <i :class="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 子模块内容 -->
    <div class="omg-sc__body">
      <!-- ═══ 原始数据 ═══ -->
      <div v-if="activeSubTab === 'raw'" class="omg-sc__section">
        <div class="omg-sc__section-header">
          <h3><i class="fa-solid fa-code" /> 原始数据查看器</h3>
          <div class="omg-sc__section-actions">
            <OmgButton icon="fa-solid fa-rotate" size="sm" @click="loadRawData">刷新</OmgButton>
            <OmgButton icon="fa-solid fa-copy" size="sm" variant="ghost" @click="copyRawData">复制</OmgButton>
          </div>
        </div>
        <div class="omg-sc__raw-toolbar">
          <label class="omg-sc__raw-label">
            数据源:
            <select v-model="rawSource" class="omg-sc__select" @change="loadRawData">
              <option value="current">当前状态 (聊天变量)</option>
              <option value="config">系统配置 (脚本变量)</option>
            </select>
          </label>
          <label class="omg-sc__checkbox-label">
            <input type="checkbox" v-model="rawEditable" />
            允许编辑
          </label>
        </div>
        <textarea
          ref="rawTextarea"
          class="omg-sc__raw-editor"
          :value="rawJson"
          :readonly="!rawEditable"
          spellcheck="false"
          @input="rawJson = ($event.target as HTMLTextAreaElement).value"
        />
        <div v-if="rawEditable" class="omg-sc__raw-save">
          <OmgButton icon="fa-solid fa-floppy-disk" size="sm" variant="primary" @click="saveRawData">
            写入保存
          </OmgButton>
          <span class="omg-sc__hint">⚠ 直接修改原始数据可能导致意外结果</span>
        </div>
      </div>

      <!-- ═══ 主题组合 ═══ -->
      <div v-if="activeSubTab === 'themes'" class="omg-sc__section">
        <div class="omg-sc__section-header">
          <h3><i class="fa-solid fa-swatchbook" /> 主题组合</h3>
          <div class="omg-sc__section-actions">
            <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="addTheme">新建</OmgButton>
            <OmgButton icon="fa-solid fa-file-export" size="sm" variant="ghost" @click="exportThemesAction"
              >导出</OmgButton
            >
            <OmgButton icon="fa-solid fa-file-import" size="sm" variant="ghost" @click="importThemesAction"
              >导入</OmgButton
            >
          </div>
        </div>

        <div v-if="themes.length === 0" class="omg-sc__empty-hint">
          <i class="fa-solid fa-swatchbook" />
          <p>暂无主题组合，点击"新建"创建第一个。</p>
          <p class="omg-sc__hint">主题组合可将定义、样式和布局打包在一起，一键切换外观。</p>
        </div>

        <div v-for="t in themes" :key="t.id" class="omg-sc__card">
          <div class="omg-sc__card-header">
            <input
              class="omg-sc__card-name"
              :value="t.name"
              @change="
                t.name = ($event.target as HTMLInputElement).value;
                saveThemeItem(t);
              "
            />
            <div class="omg-sc__card-actions">
              <OmgButton
                icon="fa-solid fa-link"
                size="xs"
                variant="ghost"
                title="绑定到当前聊天"
                @click="bindTheme(t.id)"
                >绑定</OmgButton
              >
              <OmgButton
                icon="fa-solid fa-play"
                size="xs"
                variant="ghost"
                title="仅应用一次"
                @click="applyThemeOnce(t.id)"
                >应用</OmgButton
              >
              <OmgButton icon="fa-solid fa-trash-can" size="xs" variant="danger" @click="removeTheme(t.id)"
                >删除</OmgButton
              >
            </div>
          </div>
          <div class="omg-sc__card-body">
            <textarea
              class="omg-sc__card-desc"
              :value="t.description"
              placeholder="描述（可选）"
              rows="2"
              @change="
                t.description = ($event.target as HTMLTextAreaElement).value;
                saveThemeItem(t);
              "
            />
            <div class="omg-sc__card-meta">
              <span>条目: {{ t.entryIds.length }}</span>
              <span>布局: {{ t.layoutId || '未指定' }}</span>
              <span>覆盖: {{ Object.keys(t.styleOverrides).length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ 叙事快照 ═══ -->
      <div v-if="activeSubTab === 'narrative'" class="omg-sc__section">
        <div class="omg-sc__section-header">
          <h3><i class="fa-solid fa-scroll" /> 叙事快照</h3>
          <div class="omg-sc__section-actions">
            <label class="omg-sc__toggle-label">
              <input type="checkbox" v-model="sysConfig.narrativeEnabled" @change="saveSysConfig" />
              启用叙事生成
            </label>
            <label class="omg-sc__toggle-label">
              <input type="checkbox" v-model="sysConfig.narrativeInjectEnabled" @change="saveSysConfig" />
              注入世界书
            </label>
          </div>
        </div>

        <div class="omg-sc__narr-actions">
          <OmgButton icon="fa-solid fa-plus" size="sm" variant="primary" @click="addNarrative">新建模板</OmgButton>
          <OmgButton icon="fa-solid fa-file-export" size="sm" variant="ghost" @click="exportNarrAction">导出</OmgButton>
          <OmgButton icon="fa-solid fa-file-import" size="sm" variant="ghost" @click="importNarrAction">导入</OmgButton>
        </div>

        <div v-if="narratives.length === 0" class="omg-sc__empty-hint">
          <i class="fa-solid fa-scroll" />
          <p>暂无叙事模板。</p>
          <p class="omg-sc__hint">叙事模板用于检测数据变化并生成叙事文本，通知 AI 上下文中发生了什么。</p>
        </div>

        <div v-for="n in narratives" :key="n.id" class="omg-sc__card">
          <div class="omg-sc__card-header">
            <input
              class="omg-sc__card-name"
              :value="n.name"
              @change="
                n.name = ($event.target as HTMLInputElement).value;
                saveNarrItem(n);
              "
            />
            <OmgButton icon="fa-solid fa-trash-can" size="xs" variant="danger" @click="removeNarrative(n.id)" />
          </div>
          <div class="omg-sc__narr-fields">
            <label class="omg-sc__field-label">
              共享数据变化
              <textarea
                class="omg-sc__narr-tpl"
                :value="n.sharedTemplate"
                rows="2"
                @change="
                  n.sharedTemplate = ($event.target as HTMLTextAreaElement).value;
                  saveNarrItem(n);
                "
              />
            </label>
            <label class="omg-sc__field-label">
              角色数据变化
              <textarea
                class="omg-sc__narr-tpl"
                :value="n.characterTemplate"
                rows="2"
                @change="
                  n.characterTemplate = ($event.target as HTMLTextAreaElement).value;
                  saveNarrItem(n);
                "
              />
            </label>
            <label class="omg-sc__field-label">
              用户角色变化
              <textarea
                class="omg-sc__narr-tpl"
                :value="n.userTemplate"
                rows="2"
                @change="
                  n.userTemplate = ($event.target as HTMLTextAreaElement).value;
                  saveNarrItem(n);
                "
              />
            </label>
            <label class="omg-sc__field-label">
              用户修改标记
              <textarea
                class="omg-sc__narr-tpl"
                :value="n.userModifiedTemplate"
                rows="2"
                @change="
                  n.userModifiedTemplate = ($event.target as HTMLTextAreaElement).value;
                  saveNarrItem(n);
                "
              />
            </label>
            <label class="omg-sc__field-label">
              AI 叙事风格指导
              <textarea
                class="omg-sc__narr-tpl omg-sc__narr-tpl--long"
                :value="n.stylePrompt"
                rows="3"
                placeholder="指导 AI 如何描写数据变化（如：以武侠风格描写伤害计算结果）"
                @change="
                  n.stylePrompt = ($event.target as HTMLTextAreaElement).value;
                  saveNarrItem(n);
                "
              />
            </label>
          </div>
          <div class="omg-sc__narr-hint">
            可用占位符: <code v-text="wrapPlaceholder('key')" /> <code v-text="wrapPlaceholder('old_value')" />
            <code v-text="wrapPlaceholder('new_value')" /> <code v-text="wrapPlaceholder('char_name')" />
            <code v-text="wrapPlaceholder('user_name')" />
          </div>
        </div>
      </div>

      <!-- ═══ 备份与迁移 ═══ -->
      <div v-if="activeSubTab === 'backup'" class="omg-sc__section">
        <div class="omg-sc__section-header">
          <h3><i class="fa-solid fa-box-archive" /> 备份与迁移</h3>
        </div>

        <div class="omg-sc__backup-grid">
          <!-- 导出 -->
          <div class="omg-sc__backup-card">
            <h4><i class="fa-solid fa-file-export" /> 导出数据</h4>
            <p class="omg-sc__hint">选择要导出的模块，生成 JSON 文件。</p>
            <div class="omg-sc__backup-checks">
              <label v-for="mod in exportModules" :key="mod.key" class="omg-sc__checkbox-label">
                <input type="checkbox" v-model="mod.selected" />
                {{ mod.label }}
              </label>
            </div>
            <OmgButton icon="fa-solid fa-download" size="sm" variant="primary" @click="doExport"> 导出所选 </OmgButton>
          </div>

          <!-- 导入 -->
          <div class="omg-sc__backup-card">
            <h4><i class="fa-solid fa-file-import" /> 导入数据</h4>
            <p class="omg-sc__hint">选择 JSON 文件导入（将覆盖对应模块数据）。</p>
            <input ref="importFileInput" type="file" accept=".json" class="omg-sc__file-input" @change="doImport" />
            <OmgButton
              icon="fa-solid fa-upload"
              size="sm"
              variant="primary"
              @click="($refs.importFileInput as HTMLInputElement).click()"
            >
              选择文件
            </OmgButton>
          </div>

          <!-- 恢复出厂 -->
          <div class="omg-sc__backup-card omg-sc__backup-card--danger">
            <h4><i class="fa-solid fa-triangle-exclamation" /> 恢复出厂设置</h4>
            <p class="omg-sc__hint">
              清除所有 IndexedDB 数据（定义、样式、布局、主题、叙事模板）。聊天中的角色数据不受影响。
            </p>
            <OmgButton icon="fa-solid fa-rotate-left" size="sm" variant="danger" @click="factoryReset">
              恢复出厂
            </OmgButton>
          </div>
        </div>
      </div>

      <!-- ═══ 使用指南 ═══ -->
      <div v-if="activeSubTab === 'guide'" class="omg-sc__section">
        <div class="omg-sc__section-header">
          <h3><i class="fa-solid fa-circle-question" /> 使用指南</h3>
        </div>
        <div class="omg-sc__guide">
          <div class="omg-sc__guide-section" v-for="g in guideItems" :key="g.title">
            <h4 class="omg-sc__guide-title"><i :class="g.icon" /> {{ g.title }}</h4>
            <p class="omg-sc__guide-text">{{ g.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import OmgButton from '../../components/base/OmgButton.vue';
import { STORES } from '../../core/constants';
import { clearStore } from '../../core/storage';

import { exportDefinitions, importDefinitions, type DefinitionsExport } from '../../data/definitions-store';
import { exportLayouts, importLayouts, type LayoutsExport } from '../../data/layouts-store';
import {
  createNarrativeTemplate,
  deleteNarrative,
  exportNarratives,
  getAllNarratives,
  importNarratives,
  saveNarrative,
  type NarrativeTemplate,
  type NarrativesExport,
} from '../../data/narratives-store';
import { exportStyles, importStyles, type StylesExport } from '../../data/styles-store';
import {
  createThemeCombo,
  deleteTheme,
  exportThemes,
  getAllThemes,
  importThemes,
  saveTheme,
  type ThemeCombo,
  type ThemesExport,
} from '../../data/themes-store';
import { loadConfig, loadState, saveConfig, saveState, type SystemConfig } from '../../data/variables';

// ─── 子标签 ───

const subTabs = [
  { key: 'raw', label: '原始数据', icon: 'fa-solid fa-code' },
  { key: 'themes', label: '主题组合', icon: 'fa-solid fa-swatchbook' },
  { key: 'narrative', label: '叙事快照', icon: 'fa-solid fa-scroll' },
  { key: 'backup', label: '备份与迁移', icon: 'fa-solid fa-box-archive' },
  { key: 'guide', label: '使用指南', icon: 'fa-solid fa-circle-question' },
] as const;

type SubTab = (typeof subTabs)[number]['key'];
const activeSubTab = ref<SubTab>('raw');

// ─── 占位符辅助 ───

function wrapPlaceholder(key: string): string {
  return '{{' + key + '}}';
}

// ─── 原始数据 ───

const rawSource = ref<'current' | 'config'>('current');
const rawJson = ref('');
const rawEditable = ref(false);
const rawTextarea = ref<HTMLTextAreaElement>();

function loadRawData() {
  if (rawSource.value === 'current') {
    rawJson.value = JSON.stringify(loadState(), null, 2);
  } else {
    rawJson.value = JSON.stringify(loadConfig(), null, 2);
  }
}

function copyRawData() {
  navigator.clipboard.writeText(rawJson.value).then(
    () => toastr.success('已复制到剪贴板'),
    () => toastr.error('复制失败'),
  );
}

function saveRawData() {
  try {
    const parsed = JSON.parse(rawJson.value);
    if (rawSource.value === 'current') {
      saveState(parsed);
      toastr.success('状态数据已保存');
    } else {
      saveConfig(parsed);
      toastr.success('系统配置已保存');
    }
  } catch {
    toastr.error('JSON 格式无效');
  }
}

// ─── 主题组合 ───

const themes = ref<ThemeCombo[]>([]);

async function loadThemes() {
  themes.value = await getAllThemes();
}

async function addTheme() {
  const t = createThemeCombo('新主题组合');
  await saveTheme(t);
  themes.value.push(t);
}

async function saveThemeItem(t: ThemeCombo) {
  await saveTheme(t);
}

async function removeTheme(id: string) {
  if (!confirm('确定要删除此主题组合？')) return;
  await deleteTheme(id);
  themes.value = themes.value.filter(t => t.id !== id);
}

function bindTheme(id: string) {
  saveConfig({ activeThemeId: id });
  toastr.success('已绑定到当前聊天');
}

function applyThemeOnce(_id: string) {
  toastr.info('已应用（仅本次）');
}

async function exportThemesAction() {
  const data = await exportThemes();
  downloadJson(data, 'omg-themes.json');
}

async function importThemesAction() {
  const data = await uploadJson<ThemesExport>();
  if (!data) return;
  await importThemes(data);
  await loadThemes();
  toastr.success('主题组合已导入');
}

// ─── 叙事快照 ───

const narratives = ref<NarrativeTemplate[]>([]);
const sysConfig = ref<SystemConfig>(loadConfig());

function saveSysConfig() {
  saveConfig(sysConfig.value);
}

async function loadNarratives() {
  narratives.value = await getAllNarratives();
}

async function addNarrative() {
  const n = createNarrativeTemplate('新叙事模板');
  await saveNarrative(n);
  narratives.value.push(n);
}

async function saveNarrItem(n: NarrativeTemplate) {
  await saveNarrative(n);
}

async function removeNarrative(id: string) {
  if (!confirm('确定要删除此叙事模板？')) return;
  await deleteNarrative(id);
  narratives.value = narratives.value.filter(n => n.id !== id);
}

async function exportNarrAction() {
  const data = await exportNarratives();
  downloadJson(data, 'omg-narratives.json');
}

async function importNarrAction() {
  const data = await uploadJson<NarrativesExport>();
  if (!data) return;
  await importNarratives(data);
  await loadNarratives();
  toastr.success('叙事模板已导入');
}

// ─── 备份与迁移 ───

const exportModules = ref([
  { key: 'definitions', label: '定义工作室', selected: true },
  { key: 'styles', label: '样式工坊', selected: true },
  { key: 'layouts', label: '布局编排器', selected: true },
  { key: 'themes', label: '主题组合', selected: true },
  { key: 'narratives', label: '叙事模板', selected: true },
]);

const importFileInput = ref<HTMLInputElement>();

interface FullExport {
  _omg_export: true;
  version: 1;
  timestamp: number;
  definitions?: DefinitionsExport;
  styles?: StylesExport;
  layouts?: LayoutsExport;
  themes?: ThemesExport;
  narratives?: NarrativesExport;
}

async function doExport() {
  const selected = exportModules.value.filter(m => m.selected).map(m => m.key);
  if (selected.length === 0) {
    toastr.warning('请至少选择一个模块');
    return;
  }
  const data: FullExport = { _omg_export: true, version: 1, timestamp: Date.now() };
  if (selected.includes('definitions')) data.definitions = await exportDefinitions();
  if (selected.includes('styles')) data.styles = await exportStyles();
  if (selected.includes('layouts')) data.layouts = await exportLayouts();
  if (selected.includes('themes')) data.themes = await exportThemes();
  if (selected.includes('narratives')) data.narratives = await exportNarratives();
  downloadJson(data, `omg-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toastr.success(`已导出 ${selected.length} 个模块`);
}

async function doImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text) as FullExport;
    if (!data._omg_export) {
      toastr.error('无效的备份文件');
      return;
    }
    let count = 0;
    if (data.definitions) {
      await importDefinitions(data.definitions);
      count++;
    }
    if (data.styles) {
      await importStyles(data.styles);
      count++;
    }
    if (data.layouts) {
      await importLayouts(data.layouts);
      count++;
    }
    if (data.themes) {
      await importThemes(data.themes);
      count++;
    }
    if (data.narratives) {
      await importNarratives(data.narratives);
      count++;
    }
    toastr.success(`已导入 ${count} 个模块`);
    // 重新加载当前子标签的数据
    await loadThemes();
    await loadNarratives();
  } catch {
    toastr.error('导入失败: 文件格式无效');
  }
  if (importFileInput.value) importFileInput.value.value = '';
}

async function factoryReset() {
  if (
    !confirm(
      '⚠ 确定要恢复出厂设置？\n这将清除所有 IndexedDB 数据（定义、样式、布局、主题、叙事模板）。\n聊天中的角色数据不受影响。',
    )
  )
    return;
  if (!confirm('再次确认：此操作不可撤销！')) return;
  await clearStore(STORES.DEFINITIONS);
  await clearStore(STORES.STYLES);
  await clearStore(STORES.LAYOUTS);
  await clearStore(STORES.THEMES);
  await clearStore(STORES.NARRATIVES);
  toastr.success('已恢复出厂设置');
  await loadThemes();
  await loadNarratives();
}

// ─── 使用指南 ───

const guideItems = [
  {
    icon: 'fa-solid fa-database',
    title: '数据中心',
    text: '实时编辑所有角色和共享数据。左侧选择数据源（共享/角色），右侧编辑条目。所有修改先暂存在内存中，点击"保存"按钮统一写入。支持添加/删除角色、切换角色在场状态。',
  },
  {
    icon: 'fa-solid fa-flask',
    title: '数据工作室',
    text: '全局"条目字典"，定义数据的结构和元信息。创建分类（共享/角色），在分类下创建条目定义（KEY、显示名、图标、描述等）。定义好的条目可在数据中心中通过智能推荐快速添加，也可通过"注入世界书"让 AI 了解数据结构。',
  },
  {
    icon: 'fa-solid fa-palette',
    title: '样式工坊',
    text: '创建和管理"样式单元"——状态栏条目的外观模板。使用 HTML + CSS 编写，支持 {{placeholder}} 占位符语法。内置多个默认样式供参考或复制。全局主题允许定制框架级外观。',
  },
  {
    icon: 'fa-solid fa-grip',
    title: '布局编排器',
    text: '以树状结构设计状态栏的布局。支持 Flexbox/Grid/Absolute/Custom 四种布局模式，可嵌套容器，绑定定义条目到节点上。所有布局保存为 JSON，支持多布局方案切换。',
  },
  {
    icon: 'fa-solid fa-swatchbook',
    title: '主题组合',
    text: '将定义、样式和布局"打包"成主题组合。可以为不同世界观创建不同组合（如"魔法世界观"、"赛博朋克"），并绑定到聊天或一次性应用。',
  },
  {
    icon: 'fa-solid fa-scroll',
    title: '叙事快照',
    text: '检测数据变化并生成叙事文本。创建模板，使用占位符（如 {{key}}、{{old_value}}、{{new_value}}）定制叙事格式。可注入世界书让 AI 了解数据变更的上下文。',
  },
  {
    icon: 'fa-solid fa-box-archive',
    title: '备份与迁移',
    text: '导出所选模块数据为 JSON 文件，或导入文件恢复。支持恢复出厂设置（仅清除 IndexedDB 配置数据，聊天中的角色数据不受影响）。',
  },
  {
    icon: 'fa-solid fa-keyboard',
    title: '安全模式',
    text: '按下 Ctrl + Alt + Shift + R 可随时触发安全模式，强制移除所有自定义样式并恢复默认外观。当因样式错误导致 UI 不可操作时使用此功能。',
  },
];

// ─── 工具函数 ───

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function uploadJson<T>(): Promise<T | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(JSON.parse(text));
      } catch {
        toastr.error('文件格式无效');
        resolve(null);
      }
    };
    input.click();
  });
}

// ─── 初始化 ───

onMounted(async () => {
  loadRawData();
  await loadThemes();
  await loadNarratives();
  sysConfig.value = loadConfig();
});
</script>

<style>
/* @doc: 系统配置 | category: 管理器模块 | desc: 系统级设置与备份 */

.omg-sc {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--omg-space-md);
}

.omg-sc__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.omg-sc__title {
  font-size: var(--omg-font-lg);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-sc__title i {
  color: var(--omg-accent);
}

/* ── 子标签页 ── */
.omg-sc__tabs {
  display: flex;
  gap: 2px;
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  padding: 3px;
  flex-shrink: 0;
}

.omg-sc__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--omg-space-xs);
  padding: var(--omg-space-xs) var(--omg-space-sm);
  font-size: var(--omg-font-xs);
  border: none;
  background: none;
  color: var(--omg-text-secondary);
  cursor: pointer;
  border-radius: var(--omg-radius-md);
  transition: all var(--omg-transition-fast);
  white-space: nowrap;
}

.omg-sc__tab:hover {
  color: var(--omg-text-primary);
  background: var(--omg-bg-tertiary);
}

.omg-sc__tab--active {
  color: var(--omg-accent);
  background: var(--omg-bg-primary);
  box-shadow: var(--omg-shadow-sm);
}

/* ── 内容体 ── */
.omg-sc__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.omg-sc__section {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

.omg-sc__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--omg-space-sm);
}

.omg-sc__section-header h3 {
  font-size: var(--omg-font-md);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-sc__section-header h3 i {
  color: var(--omg-accent);
}

.omg-sc__section-actions {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  flex-wrap: wrap;
}

.omg-sc__hint {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-sc__empty-hint {
  text-align: center;
  padding: var(--omg-space-xl) var(--omg-space-md);
  color: var(--omg-text-tertiary);
}

.omg-sc__empty-hint i {
  font-size: 32px;
  margin-bottom: var(--omg-space-sm);
  opacity: 0.4;
}

.omg-sc__empty-hint p {
  margin: var(--omg-space-xs) 0;
}

/* ── 原始数据 ── */
.omg-sc__raw-toolbar {
  display: flex;
  align-items: center;
  gap: var(--omg-space-md);
  flex-wrap: wrap;
}

.omg-sc__raw-label {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  font-size: var(--omg-font-sm);
  color: var(--omg-text-secondary);
}

.omg-sc__select {
  padding: 4px 8px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
}

.omg-sc__select:focus {
  border-color: var(--omg-accent);
}

.omg-sc__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  font-size: var(--omg-font-sm);
  color: var(--omg-text-secondary);
  cursor: pointer;
}

.omg-sc__toggle-label {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  font-size: var(--omg-font-sm);
  color: var(--omg-text-secondary);
  cursor: pointer;
}

.omg-sc__raw-editor {
  width: 100%;
  min-height: 300px;
  max-height: 500px;
  padding: var(--omg-space-md);
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  line-height: 1.5;
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-lg);
  resize: vertical;
  outline: none;
  tab-size: 2;
}

.omg-sc__raw-editor:focus {
  border-color: var(--omg-accent);
}

.omg-sc__raw-editor[readonly] {
  opacity: 0.8;
  cursor: default;
}

.omg-sc__raw-save {
  display: flex;
  align-items: center;
  gap: var(--omg-space-md);
}

/* ── 卡片 (主题/叙事) ── */
.omg-sc__card {
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  overflow: hidden;
  border: 1px solid var(--omg-border);
}

.omg-sc__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--omg-space-sm) var(--omg-space-md);
  background: var(--omg-bg-tertiary);
  gap: var(--omg-space-sm);
}

.omg-sc__card-name {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--omg-radius-sm);
  padding: 2px 6px;
  outline: none;
  font-family: var(--omg-font-family);
  flex: 1;
  min-width: 0;
}

.omg-sc__card-name:hover {
  border-color: var(--omg-border);
}

.omg-sc__card-name:focus {
  border-color: var(--omg-accent);
  background: var(--omg-bg-primary);
}

.omg-sc__card-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.omg-sc__card-body {
  padding: var(--omg-space-sm) var(--omg-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-sc__card-desc {
  width: 100%;
  padding: 6px 8px;
  font-size: var(--omg-font-xs);
  font-family: var(--omg-font-family);
  color: var(--omg-text-secondary);
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  resize: vertical;
  outline: none;
}

.omg-sc__card-desc:focus {
  border-color: var(--omg-accent);
}

.omg-sc__card-meta {
  display: flex;
  gap: var(--omg-space-md);
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

/* ── 叙事 ── */
.omg-sc__narr-actions {
  display: flex;
  gap: var(--omg-space-xs);
}

.omg-sc__narr-fields {
  padding: var(--omg-space-sm) var(--omg-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-sc__field-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--omg-font-xs);
  color: var(--omg-text-secondary);
  font-weight: var(--omg-font-weight-semibold);
}

.omg-sc__narr-tpl {
  width: 100%;
  padding: 6px 8px;
  font-family: var(--omg-font-mono);
  font-size: var(--omg-font-xs);
  line-height: 1.5;
  color: var(--omg-text-primary);
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  resize: vertical;
  outline: none;
}

.omg-sc__narr-tpl:focus {
  border-color: var(--omg-accent);
}

.omg-sc__narr-tpl--long {
  min-height: 60px;
}

.omg-sc__narr-hint {
  padding: var(--omg-space-xs) var(--omg-space-md) var(--omg-space-sm);
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
}

.omg-sc__narr-hint code {
  font-family: var(--omg-font-mono);
  color: var(--omg-accent);
  background: var(--omg-bg-tertiary);
  padding: 1px 4px;
  border-radius: var(--omg-radius-sm);
  margin: 0 2px;
}

/* ── 备份 ── */
.omg-sc__backup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--omg-space-md);
}

.omg-sc__backup-card {
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-lg);
  padding: var(--omg-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-sm);
}

.omg-sc__backup-card h4 {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
}

.omg-sc__backup-card h4 i {
  color: var(--omg-accent);
}

.omg-sc__backup-card--danger {
  border-color: var(--omg-danger);
}

.omg-sc__backup-card--danger h4 i {
  color: var(--omg-danger);
}

.omg-sc__backup-checks {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-xs);
}

.omg-sc__file-input {
  display: none;
}

/* ── 使用指南 ── */
.omg-sc__guide {
  display: flex;
  flex-direction: column;
  gap: var(--omg-space-md);
}

.omg-sc__guide-section {
  background: var(--omg-bg-secondary);
  border-radius: var(--omg-radius-lg);
  padding: var(--omg-space-md);
}

.omg-sc__guide-title {
  font-size: var(--omg-font-sm);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0 0 var(--omg-space-xs);
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
}

.omg-sc__guide-title i {
  color: var(--omg-accent);
  width: 16px;
  text-align: center;
}

.omg-sc__guide-text {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .omg-sc__tabs {
    flex-wrap: wrap;
  }

  .omg-sc__backup-grid {
    grid-template-columns: 1fr;
  }
}
</style>
