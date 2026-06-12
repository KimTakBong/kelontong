<script setup lang="ts">
interface Props {
  modelValue: string | number | null
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  min?: number
  step?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const id = useId()

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? target.valueAsNumber : target.value
  emit('update:modelValue', Number.isNaN(value as number) ? '' : value)
}
</script>

<template>
  <div class="field">
    <label v-if="label" :for="id">
      {{ label }}
      <span v-if="required" class="req">*</span>
    </label>
    <input
      :id="id"
      :value="modelValue ?? ''"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :step="step"
      :class="{ invalid: !!error }"
      @input="onInput"
    >
    <p v-if="error" class="msg error">{{ error }}</p>
    <p v-else-if="hint" class="msg hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
}
.req {
  color: var(--color-danger);
}
input {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
input:disabled {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
}
input.invalid {
  border-color: var(--color-danger);
}
.msg {
  margin: 0;
  font-size: 0.78rem;
}
.msg.error {
  color: var(--color-danger);
}
.msg.hint {
  color: var(--color-text-muted);
}
</style>
