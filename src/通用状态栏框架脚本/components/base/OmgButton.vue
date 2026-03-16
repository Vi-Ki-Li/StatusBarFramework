<template>
  <button
    class="omg-btn"
    :class="[`omg-btn--${variant}`, `omg-btn--${size}`, { 'omg-btn--icon-only': iconOnly }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <i v-if="icon" :class="icon" class="omg-btn__icon" />
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    iconOnly?: boolean;
    disabled?: boolean;
  }>(),
  {
    variant: 'secondary',
    size: 'md',
    disabled: false,
    iconOnly: false,
  },
);

defineEmits<{ click: [e: MouseEvent] }>();
</script>

<style>
/* @doc: 按钮 | category: 基础组件 | desc: 统一按钮组件，多种变体和尺寸 */
.omg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--omg-space-xs);
  font-family: var(--omg-font-family);
  font-weight: var(--omg-font-weight-medium);
  border: 1px solid transparent;
  border-radius: var(--omg-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--omg-transition-fast);
  user-select: none;
  line-height: 1;
}

.omg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 尺寸 */
.omg-btn--sm {
  padding: 4px 10px;
  font-size: var(--omg-font-xs);
  border-radius: var(--omg-radius-sm);
}
.omg-btn--md {
  padding: 6px 14px;
  font-size: var(--omg-font-sm);
}
.omg-btn--lg {
  padding: 10px 20px;
  font-size: var(--omg-font-md);
}
.omg-btn--icon-only {
  padding: 6px;
  min-width: 32px;
  min-height: 32px;
}
.omg-btn--icon-only.omg-btn--sm {
  min-width: 26px;
  min-height: 26px;
  padding: 4px;
}

/* Primary */
.omg-btn--primary {
  background: var(--omg-accent);
  color: var(--omg-accent-text);
}
.omg-btn--primary:hover:not(:disabled) {
  background: var(--omg-accent-hover);
}

/* Secondary */
.omg-btn--secondary {
  background: var(--omg-bg-secondary);
  color: var(--omg-text-primary);
  border-color: var(--omg-border);
}
.omg-btn--secondary:hover:not(:disabled) {
  background: var(--omg-bg-tertiary);
  border-color: var(--omg-border-hover);
}

/* Ghost */
.omg-btn--ghost {
  background: transparent;
  color: var(--omg-text-secondary);
}
.omg-btn--ghost:hover:not(:disabled) {
  background: var(--omg-bg-secondary);
  color: var(--omg-text-primary);
}

/* Danger */
.omg-btn--danger {
  background: transparent;
  color: var(--omg-danger);
  border-color: var(--omg-danger);
}
.omg-btn--danger:hover:not(:disabled) {
  background: var(--omg-danger);
  color: var(--omg-text-inverse);
}

.omg-btn__icon {
  font-size: 0.9em;
}
</style>
