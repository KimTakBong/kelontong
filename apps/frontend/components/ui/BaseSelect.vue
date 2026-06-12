<script setup lang="ts" generic="T extends string | number">
interface Option {
  value: T
  label: string
}

interface Props {
  modelValue: T | null
  options: Option[]
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>()

const id = useId()

function onChange(event: Event): void {
  const raw = (event.target as HTMLSelectElement).value
  if (raw === '') {
    emit('update:modelValue', null)
    return
  }
  // Coerce back to the option's original type (number ids vs string values).
  const match = props.options.find((o) => String(o.value) === raw)
  emit('update:modelValue', match ? match.value : (raw as T))
}
</script>

<template>
  <div class="field">
    <label v-if="label" :for="id">
      {{ label }}
      <span v-if="required" class="req">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue ?? ''"
      :required="required"
      :disabled="disabled"
      :class="{ invalid: !!error }"
      @change="onChange"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="msg error">{{ error }}</p>
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
}
.req {
  color: var(--color-danger);
}
select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
select.invalid {
  border-color: var(--color-danger);
}
.msg {
  margin: 0;
  font-size: 0.78rem;
}
.msg.error {
  color: var(--color-danger);
}
</style>
