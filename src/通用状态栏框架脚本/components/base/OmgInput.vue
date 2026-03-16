<template>
  <div class="omg-input" :class="{ 'omg-input--error': error }">
    <label v-if="label" class="omg-input__label">
      {{ label }}
      <span v-if="required" class="omg-input__required">*</span>
    </label>
    <div class="omg-input__wrapper">
      <i v-if="prefixIcon" :class="prefixIcon" class="omg-input__prefix-icon" />
      <input
        class="omg-input__field"
        :class="{ 'omg-input__field--has-prefix': prefixIcon }"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
        @keydown.enter="$emit('enter')"
      />
    </div>
    <p v-if="error" class="omg-input__error">{{ error }}</p>
    <p v-else-if="hint" class="omg-input__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  error?: string;
  hint?: string;
  prefixIcon?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  blur: [];
  enter: [];
}>();
</script>

<style>
/* @doc: 输入框 | category: 基础组件 | desc: 统一输入框，支持标签/图标/校验 */
.omg-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.omg-input__label {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-medium);
  color: var(--omg-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.omg-input__required {
  color: var(--omg-danger);
}

.omg-input__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.omg-input__prefix-icon {
  position: absolute;
  left: 10px;
  font-size: var(--omg-font-sm);
  color: var(--omg-text-tertiary);
  pointer-events: none;
}

.omg-input__field {
  width: 100%;
  padding: 7px 12px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
  transition:
    border-color var(--omg-transition-fast),
    box-shadow var(--omg-transition-fast);
}

.omg-input__field--has-prefix {
  padding-left: 32px;
}

.omg-input__field:focus {
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 3px var(--omg-accent-subtle);
}

.omg-input__field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.omg-input--error .omg-input__field {
  border-color: var(--omg-danger);
}
.omg-input--error .omg-input__field:focus {
  box-shadow: 0 0 0 3px hsla(0, 72%, 58%, 0.15);
}

.omg-input__error {
  font-size: var(--omg-font-xs);
  color: var(--omg-danger);
  margin: 0;
}

.omg-input__hint {
  font-size: var(--omg-font-xs);
  color: var(--omg-text-tertiary);
  margin: 0;
}
</style>
