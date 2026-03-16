<template>
  <div class="omg-empty">
    <i :class="icon" class="omg-empty__icon" />
    <p class="omg-empty__text">{{ text }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    text?: string;
  }>(),
  {
    icon: 'fa-solid fa-inbox',
    text: '暂无数据',
  },
);
</script>

<style>
/* @doc: 空状态 | category: 基础组件 | desc: 列表为空时的占位提示 */
.omg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--omg-space-md);
  padding: var(--omg-space-3xl) var(--omg-space-xl);
  color: var(--omg-text-tertiary);
}

.omg-empty__icon {
  font-size: 36px;
  opacity: 0.4;
}

.omg-empty__text {
  font-size: var(--omg-font-sm);
  margin: 0;
}
</style>
