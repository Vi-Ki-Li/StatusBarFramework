<template>
  <Transition name="omg-modal">
    <div v-if="modelValue" class="omg-modal-overlay" @click.self="closeable && $emit('update:modelValue', false)">
      <div class="omg-modal" :style="{ width: width }">
        <header v-if="title" class="omg-modal__header">
          <h3 class="omg-modal__title">{{ title }}</h3>
          <button v-if="closeable" class="omg-modal__close" @click="$emit('update:modelValue', false)">
            <i class="fa-solid fa-xmark" />
          </button>
        </header>
        <div class="omg-modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="omg-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string;
    closeable?: boolean;
  }>(),
  {
    width: '480px',
    closeable: true,
  },
);

defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<style>
/* @doc: 对话框 | category: 基础组件 | desc: 模态对话框，支持标题/主体/底部 */
.omg-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--omg-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--omg-bg-overlay);
}

.omg-modal {
  background: var(--omg-bg-primary);
  border-radius: var(--omg-radius-lg);
  box-shadow: var(--omg-shadow-xl);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.omg-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--omg-space-md) var(--omg-space-lg);
  border-bottom: 1px solid var(--omg-border);
}

.omg-modal__title {
  font-size: var(--omg-font-md);
  font-weight: var(--omg-font-weight-semibold);
  color: var(--omg-text-primary);
  margin: 0;
}

.omg-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: var(--omg-text-tertiary);
  cursor: pointer;
  border-radius: var(--omg-radius-sm);
  transition: all var(--omg-transition-fast);
}

.omg-modal__close:hover {
  background: var(--omg-bg-tertiary);
  color: var(--omg-text-primary);
}

.omg-modal__body {
  padding: var(--omg-space-lg);
  overflow-y: auto;
  flex: 1;
}

.omg-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--omg-space-sm);
  padding: var(--omg-space-md) var(--omg-space-lg);
  border-top: 1px solid var(--omg-border);
}

/* 过渡动画 */
.omg-modal-enter-active,
.omg-modal-leave-active {
  transition: opacity var(--omg-transition-normal);
}
.omg-modal-enter-active .omg-modal,
.omg-modal-leave-active .omg-modal {
  transition:
    transform var(--omg-transition-normal),
    opacity var(--omg-transition-normal);
}
.omg-modal-enter-from,
.omg-modal-leave-to {
  opacity: 0;
}
.omg-modal-enter-from .omg-modal,
.omg-modal-leave-to .omg-modal {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
