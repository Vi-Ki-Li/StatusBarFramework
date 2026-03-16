<template>
  <div class="omg-icon-picker">
    <div class="omg-icon-picker__trigger" @click="open = !open">
      <i :class="modelValue || 'fa-solid fa-icons'" class="omg-icon-picker__preview" />
      <span class="omg-icon-picker__text">{{ modelValue || '选择图标' }}</span>
      <i class="fa-solid fa-chevron-down omg-icon-picker__arrow" />
    </div>

    <div v-if="open" class="omg-icon-picker__dropdown">
      <div class="omg-icon-picker__search">
        <i class="fa-solid fa-magnifying-glass omg-icon-picker__search-icon" />
        <input
          ref="searchInput"
          v-model="query"
          class="omg-icon-picker__search-input"
          placeholder="搜索图标名称..."
          @keydown.esc="open = false"
        />
      </div>

      <div class="omg-icon-picker__grid">
        <button
          v-for="icon in filteredIcons"
          :key="icon"
          class="omg-icon-picker__item"
          :class="{ 'omg-icon-picker__item--selected': icon === modelValue }"
          :title="icon"
          @click="selectIcon(icon)"
        >
          <i :class="icon" />
        </button>
        <div v-if="filteredIcons.length === 0" class="omg-icon-picker__empty">无匹配图标</div>
      </div>

      <div class="omg-icon-picker__custom">
        <input
          v-model="customInput"
          class="omg-icon-picker__custom-input"
          placeholder="或手动输入类名，如 fa-solid fa-star"
          @keydown.enter="applyCustom"
        />
        <button class="omg-icon-picker__custom-btn" @click="applyCustom">
          <i class="fa-solid fa-check" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const open = ref(false);
const query = ref('');
const customInput = ref('');
const searchInput = ref<HTMLInputElement>();

// 常用 Font Awesome 图标列表
const ICON_LIST: string[] = [
  // 状态/属性
  'fa-solid fa-heart',
  'fa-solid fa-shield-halved',
  'fa-solid fa-bolt',
  'fa-solid fa-star',
  'fa-solid fa-fire',
  'fa-solid fa-snowflake',
  'fa-solid fa-droplet',
  'fa-solid fa-wind',
  'fa-solid fa-sun',
  'fa-solid fa-moon',
  'fa-solid fa-cloud',
  'fa-solid fa-leaf',
  // 角色/人物
  'fa-solid fa-user',
  'fa-solid fa-users',
  'fa-solid fa-person',
  'fa-solid fa-skull',
  'fa-solid fa-ghost',
  'fa-solid fa-hat-wizard',
  'fa-solid fa-crown',
  'fa-solid fa-mask',
  'fa-solid fa-face-smile',
  // 武器/装备
  'fa-solid fa-shield',
  'fa-solid fa-wand-magic-sparkles',
  'fa-solid fa-gun',
  'fa-solid fa-hand-fist',
  'fa-solid fa-crosshairs',
  'fa-solid fa-bomb',
  // 物品/资源
  'fa-solid fa-gem',
  'fa-solid fa-coins',
  'fa-solid fa-sack-dollar',
  'fa-solid fa-key',
  'fa-solid fa-flask',
  'fa-solid fa-scroll',
  'fa-solid fa-book',
  'fa-solid fa-map',
  'fa-solid fa-compass',
  // 行动/交互
  'fa-solid fa-running',
  'fa-solid fa-eye',
  'fa-solid fa-ear-listen',
  'fa-solid fa-comments',
  'fa-solid fa-handshake',
  'fa-solid fa-rotate',
  // 场景/位置
  'fa-solid fa-house',
  'fa-solid fa-building',
  'fa-solid fa-mountain',
  'fa-solid fa-tree',
  'fa-solid fa-water',
  'fa-solid fa-bridge',
  'fa-solid fa-dungeon',
  'fa-solid fa-church',
  'fa-solid fa-tower-observation',
  // 状态效果
  'fa-solid fa-circle-check',
  'fa-solid fa-circle-xmark',
  'fa-solid fa-triangle-exclamation',
  'fa-solid fa-circle-info',
  'fa-solid fa-lock',
  'fa-solid fa-unlock',
  'fa-solid fa-ban',
  // 数值/统计
  'fa-solid fa-chart-bar',
  'fa-solid fa-chart-line',
  'fa-solid fa-gauge',
  'fa-solid fa-percent',
  'fa-solid fa-hashtag',
  'fa-solid fa-calculator',
  // 时间/进度
  'fa-solid fa-clock',
  'fa-solid fa-hourglass-half',
  'fa-solid fa-calendar',
  'fa-solid fa-stopwatch',
  'fa-solid fa-spinner',
  // 通用
  'fa-solid fa-circle',
  'fa-solid fa-square',
  'fa-solid fa-diamond',
  'fa-solid fa-certificate',
  'fa-solid fa-tag',
  'fa-solid fa-bookmark',
  'fa-solid fa-flag',
  'fa-solid fa-bell',
  'fa-solid fa-gear',
  'fa-solid fa-sliders',
  'fa-solid fa-palette',
  'fa-solid fa-brush',
  // Regular 变体
  'fa-regular fa-heart',
  'fa-regular fa-star',
  'fa-regular fa-circle',
  'fa-regular fa-square',
  'fa-regular fa-eye',
  'fa-regular fa-bookmark',
  'fa-regular fa-bell',
  'fa-regular fa-face-smile',
  'fa-regular fa-compass',
  'fa-regular fa-clock',
  'fa-regular fa-calendar',
  'fa-regular fa-gem',
];

const filteredIcons = computed(() => {
  if (!query.value.trim()) return ICON_LIST;
  const q = query.value.toLowerCase();
  return ICON_LIST.filter(icon => icon.toLowerCase().includes(q));
});

function selectIcon(icon: string) {
  emit('update:modelValue', icon);
  open.value = false;
  query.value = '';
}

function applyCustom() {
  if (customInput.value.trim()) {
    emit('update:modelValue', customInput.value.trim());
    customInput.value = '';
    open.value = false;
  }
}

watch(open, val => {
  if (val) nextTick(() => searchInput.value?.focus());
});

// 点击外部关闭
onMounted(() => {
  const handler = (e: MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.omg-icon-picker');
    if (!el) open.value = false;
  };
  document.addEventListener('click', handler);
  onUnmounted(() => document.removeEventListener('click', handler));
});
</script>

<style>
/* @doc: 图标选择器 | category: 基础组件 | desc: 搜索+预览的 Font Awesome 图标选择器 */
.omg-icon-picker {
  position: relative;
}

.omg-icon-picker__trigger {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  padding: 6px 12px;
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  cursor: pointer;
  transition: all var(--omg-transition-fast);
  font-size: var(--omg-font-sm);
  color: var(--omg-text-primary);
  min-height: 34px;
}

.omg-icon-picker__trigger:hover {
  border-color: var(--omg-border-hover);
}

.omg-icon-picker__preview {
  font-size: 16px;
  color: var(--omg-accent);
  width: 20px;
  text-align: center;
}

.omg-icon-picker__text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--omg-text-secondary);
  font-size: var(--omg-font-xs);
}

.omg-icon-picker__arrow {
  font-size: 10px;
  color: var(--omg-text-tertiary);
}

.omg-icon-picker__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  box-shadow: var(--omg-shadow-xl);
  z-index: 100;
  min-width: 280px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
}

.omg-icon-picker__search {
  display: flex;
  align-items: center;
  gap: var(--omg-space-sm);
  padding: 8px 12px;
  border-bottom: 1px solid var(--omg-border);
}

.omg-icon-picker__search-icon {
  color: var(--omg-text-tertiary);
  font-size: 12px;
}

.omg-icon-picker__search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--omg-text-primary);
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
}

.omg-icon-picker__search-input::placeholder {
  color: var(--omg-text-tertiary);
}

.omg-icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 2px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  max-height: 240px;
}

.omg-icon-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: var(--omg-radius-sm);
  background: none;
  color: var(--omg-text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all var(--omg-transition-fast);
}

.omg-icon-picker__item:hover {
  background: var(--omg-bg-secondary);
  color: var(--omg-text-primary);
  border-color: var(--omg-border);
}

.omg-icon-picker__item--selected {
  background: var(--omg-accent);
  color: var(--omg-accent-text);
  border-color: var(--omg-accent);
}

.omg-icon-picker__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 16px;
  color: var(--omg-text-tertiary);
  font-size: var(--omg-font-sm);
}

.omg-icon-picker__custom {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid var(--omg-border);
}

.omg-icon-picker__custom-input {
  flex: 1;
  padding: 4px 8px;
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-sm);
  outline: none;
  color: var(--omg-text-primary);
  font-size: var(--omg-font-xs);
  font-family: var(--omg-font-family);
}

.omg-icon-picker__custom-input::placeholder {
  color: var(--omg-text-tertiary);
}

.omg-icon-picker__custom-input:focus {
  border-color: var(--omg-accent);
}

.omg-icon-picker__custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--omg-accent);
  color: var(--omg-accent-text);
  border: none;
  border-radius: var(--omg-radius-sm);
  cursor: pointer;
  transition: background var(--omg-transition-fast);
}

.omg-icon-picker__custom-btn:hover {
  background: var(--omg-accent-hover);
}
</style>
