<template>
  <div class="omg-tn">
    <button
      class="omg-tn__row"
      :class="{ 'omg-tn__row--selected': selectedId === node.id }"
      :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
      @click.stop="$emit('select', node.id)"
    >
      <!-- 展开/收起 -->
      <span v-if="node.type === 'container'" class="omg-tn__toggle" @click.stop="expanded = !expanded">
        <i :class="expanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'" />
      </span>
      <span v-else class="omg-tn__toggle omg-tn__toggle--leaf" />

      <!-- 图标 -->
      <i :class="nodeIcon" class="omg-tn__icon" />

      <!-- 标签 -->
      <span class="omg-tn__label">{{ nodeLabel }}</span>

      <!-- 类型标识 -->
      <span v-if="node.type === 'container'" class="omg-tn__mode">{{ modeLabel }}</span>
      <span v-if="childCount > 0" class="omg-tn__count">{{ childCount }}</span>
    </button>

    <!-- 子节点 -->
    <div v-if="expanded && node.children" class="omg-tn__children">
      <LayoutTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LayoutNode } from '../../data/layouts-store';

const props = defineProps<{
  node: LayoutNode;
  depth: number;
  selectedId: string | null;
}>();

defineEmits<{ select: [id: string] }>();

const expanded = ref(true);

const nodeIcon = computed(() => {
  if (props.node.type === 'item') return 'fa-solid fa-cube';
  switch (props.node.layoutMode) {
    case 'flex-row':
      return 'fa-solid fa-arrows-left-right';
    case 'flex-col':
      return 'fa-solid fa-arrows-up-down';
    case 'grid':
      return 'fa-solid fa-table-cells';
    case 'absolute':
      return 'fa-solid fa-expand';
    default:
      return 'fa-solid fa-folder';
  }
});

const nodeLabel = computed(() => props.node.label || (props.node.type === 'container' ? '容器' : '条目'));

const modeLabel = computed(() => {
  switch (props.node.layoutMode) {
    case 'flex-row':
      return '横向';
    case 'flex-col':
      return '纵向';
    case 'grid':
      return '网格';
    case 'absolute':
      return '绝对';
    case 'custom':
      return '自定义';
    default:
      return '';
  }
});

const childCount = computed(() => props.node.children?.length ?? 0);
</script>

<style>
/* @doc: 布局树节点 | category: 管理器模块 | desc: 递归树形节点组件 */

.omg-tn__row {
  display: flex;
  align-items: center;
  gap: var(--omg-space-xs);
  width: 100%;
  padding: 4px 8px;
  border: none;
  background: none;
  color: var(--omg-text-secondary);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  font-size: var(--omg-font-sm);
  text-align: left;
  transition: all var(--omg-transition-fast);
}

.omg-tn__row:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-tn__row--selected {
  background: var(--omg-accent-subtle);
  color: var(--omg-accent);
}

.omg-tn__toggle {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: 9px;
  color: var(--omg-text-tertiary);
  cursor: pointer;
}

.omg-tn__toggle--leaf {
  visibility: hidden;
}

.omg-tn__icon {
  width: 14px;
  text-align: center;
  flex-shrink: 0;
  font-size: var(--omg-font-xs);
}

.omg-tn__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.omg-tn__mode {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  background: var(--omg-bg-primary);
  padding: 0 4px;
  border-radius: var(--omg-radius-sm);
}

.omg-tn__count {
  font-size: 9px;
  color: var(--omg-text-tertiary);
  min-width: 14px;
  text-align: center;
}

.omg-tn__children {
  /* no extra spacing needed; indentation is handled by padding-left */
}
</style>
