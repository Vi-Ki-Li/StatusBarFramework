<template>
  <div class="omg-help-tip">
    <button class="omg-help-tip__trigger" @click="open = !open" :title="title ?? '帮助'">
      <i class="fa-solid fa-circle-question" />
    </button>
    <div v-if="open" class="omg-help-tip__popup" @click.stop>
      <div class="omg-help-tip__header">
        <span class="omg-help-tip__title">{{ title ?? '帮助' }}</span>
        <button class="omg-help-tip__close" @click="open = false">
          <i class="fa-solid fa-xmark" />
        </button>
      </div>
      <div class="omg-help-tip__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
const open = ref(false);
</script>

<style>
.omg-help-tip {
  position: relative;
  display: inline-flex;
}

.omg-help-tip__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  cursor: pointer;
  border-radius: var(--omg-radius-full);
  font-size: var(--omg-font-sm);
  transition: all var(--omg-transition-fast);
}

.omg-help-tip__trigger:hover {
  color: var(--omg-accent);
  background: var(--omg-accent-subtle);
}

.omg-help-tip__popup {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  width: 280px;
  max-height: 300px;
  background: var(--omg-bg-primary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-lg);
  box-shadow: var(--omg-shadow-lg);
  overflow: hidden;
  margin-top: 4px;
}

.omg-help-tip__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--omg-space-sm) var(--omg-space-md);
  background: var(--omg-bg-tertiary);
  border-bottom: 1px solid var(--omg-border);
}

.omg-help-tip__title {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
}

.omg-help-tip__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  font-size: 10px;
}

.omg-help-tip__close:hover {
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
}

.omg-help-tip__body {
  padding: var(--omg-space-sm) var(--omg-space-md);
  font-size: var(--omg-font-xs);
  color: var(--omg-text-secondary);
  line-height: 1.6;
  overflow-y: auto;
  max-height: 250px;
}
</style>
