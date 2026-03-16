<template>
  <div class="omg-select" :class="{ 'omg-select--error': error }">
    <label v-if="label" class="omg-select__label">{{ label }}</label>
    <select
      class="omg-select__field"
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="omg-select__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  label?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  error?: string;
  disabled?: boolean;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<style>
/* @doc: 下拉框 | category: 基础组件 | desc: 统一下拉选择器 */
.omg-select {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.omg-select__label {
  font-size: var(--omg-font-xs);
  font-weight: var(--omg-font-weight-medium);
  color: var(--omg-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.omg-select__field {
  width: 100%;
  padding: 7px 12px;
  font-size: var(--omg-font-sm);
  font-family: var(--omg-font-family);
  color: var(--omg-text-primary);
  background: var(--omg-bg-secondary);
  border: 1px solid var(--omg-border);
  border-radius: var(--omg-radius-md);
  outline: none;
  cursor: pointer;
  transition: border-color var(--omg-transition-fast);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}

.omg-select__field:focus {
  border-color: var(--omg-border-focus);
  box-shadow: 0 0 0 3px var(--omg-accent-subtle);
}

.omg-select__field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.omg-select--error .omg-select__field {
  border-color: var(--omg-danger);
}

.omg-select__error {
  font-size: var(--omg-font-xs);
  color: var(--omg-danger);
  margin: 0;
}
</style>
