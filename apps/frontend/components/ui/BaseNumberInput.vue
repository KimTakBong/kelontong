<script setup lang="ts">
// Text input that shows a thousands-separated number (id-ID locale) while
// typing, but emits/accepts a plain numeric v-model. Defaults to digits-only
// (price/stock/weight); set `decimal` to allow a fractional part using the
// id-ID decimal comma (e.g. dimensions in cm like "12,5").
interface Props {
  modelValue: number | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
  decimal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  decimal: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const id = useId()
const intFormatter = new Intl.NumberFormat('id-ID')
const decimalFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 20,
})

function formatValue(value: number | null): string {
  if (value == null || Number.isNaN(value)) return ''
  return props.decimal ? decimalFormatter.format(value) : intFormatter.format(value)
}

// Parse what's currently displayed back into a number so we can tell whether an
// external modelValue change actually differs (and avoid clobbering mid-typing,
// e.g. a trailing comma in "12,").
function displayToNumber(text: string): number | null {
  if (!text) return null
  if (!props.decimal) {
    const digits = text.replace(/\D/g, '')
    return digits ? Number(digits) : null
  }
  const cleaned = text.replace(/[^\d,]/g, '')
  const [intPart = '', ...rest] = cleaned.split(',')
  const decPart = rest.join('')
  if (!intPart && !decPart) return null
  return Number(`${intPart || '0'}${decPart ? `.${decPart}` : ''}`)
}

const display = ref(formatValue(props.modelValue))

// Keep the display in sync when the value changes from outside (e.g.
// switching the form's `initial` product), but don't fight our own input.
watch(
  () => props.modelValue,
  (value) => {
    if (displayToNumber(display.value) === value) return
    display.value = formatValue(value)
  },
)

// Count digits/commas left of the caret so we can restore it after reformatting.
function countSignificant(text: string): number {
  return (text.match(/[\d,]/g) ?? []).length
}

function caretAfter(text: string, significant: number): number {
  if (significant <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (/[\d,]/.test(text[i]!)) {
      seen++
      if (seen === significant) return i + 1
    }
  }
  return text.length
}

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const raw = target.value
  const prevCursor = target.selectionStart ?? raw.length
  const sigLeft = countSignificant(raw.slice(0, prevCursor))

  let nextDisplay: string
  let nextValue: number | null

  if (!props.decimal) {
    const digits = raw.replace(/\D/g, '')
    nextDisplay = digits ? intFormatter.format(Number(digits)) : ''
    nextValue = digits ? Number(digits) : null
  } else {
    const cleaned = raw.replace(/[^\d,]/g, '')
    const firstComma = cleaned.indexOf(',')
    const intDigits =
      firstComma === -1 ? cleaned : cleaned.slice(0, firstComma)
    const decDigits =
      firstComma === -1 ? '' : cleaned.slice(firstComma + 1).replace(/,/g, '')
    const hasComma = firstComma !== -1

    if (!intDigits && !decDigits && !hasComma) {
      nextDisplay = ''
      nextValue = null
    } else {
      const intFormatted = intDigits
        ? intFormatter.format(Number(intDigits))
        : ''
      nextDisplay = intFormatted + (hasComma ? `,${decDigits}` : '')
      nextValue =
        !intDigits && !decDigits
          ? null
          : Number(`${intDigits || '0'}${decDigits ? `.${decDigits}` : ''}`)
    }
  }

  display.value = nextDisplay
  emit('update:modelValue', nextValue)

  // Restore the caret after the same number of significant chars.
  nextTick(() => {
    const pos = caretAfter(nextDisplay, sigLeft)
    target.setSelectionRange(pos, pos)
  })
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
      :value="display"
      type="text"
      :inputmode="decimal ? 'decimal' : 'numeric'"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
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
