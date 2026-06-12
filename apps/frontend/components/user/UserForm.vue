<script setup lang="ts">
import type { ApiErrorDetail, User, UserRole } from '~/types'

export interface UserFormPayload {
  name: string
  email?: string
  password?: string
  role: UserRole
  isActive?: boolean
}

interface Props {
  mode: 'create' | 'edit'
  initial?: User
  submitting: boolean
  serverErrors?: ApiErrorDetail[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ submit: [payload: UserFormPayload] }>()

const form = reactive({
  name: props.initial?.name ?? '',
  email: props.initial?.email ?? '',
  password: '',
  role: (props.initial?.role ?? 'staff') as UserRole,
  isActive: props.initial?.isActive ?? true,
})

const errors = reactive<Record<string, string>>({})

const roleOptions = [
  { value: 'staff' as UserRole, label: 'Staff' },
  { value: 'admin' as UserRole, label: 'Admin' },
]
const statusOptions = [
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Nonaktif' },
]
const statusModel = computed<string>({
  get: () => String(form.isActive),
  set: (v) => {
    form.isActive = v === 'true'
  },
})

watch(
  () => props.serverErrors,
  (list) => {
    if (!list) return
    for (const e of list) if (e.field) errors[e.field] = e.message
  },
  { immediate: true },
)

function validate(): boolean {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!form.name.trim()) errors.name = 'Nama wajib diisi'

  if (props.mode === 'create') {
    if (!form.email.trim()) errors.email = 'Email wajib diisi'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errors.email = 'Format email tidak valid'
    if (form.password.length < 6) errors.password = 'Password minimal 6 karakter'
  }
  return Object.keys(errors).length === 0
}

// Submit when Enter is pressed in any field. Skip textareas (allow newlines)
// and buttons (Enter there already fires their own click).
function onEnterKey(event: KeyboardEvent): void {
  const tag = (event.target as HTMLElement)?.tagName
  if (tag === 'TEXTAREA' || tag === 'BUTTON') return
  onSubmit()
}

function onSubmit(): void {
  // Guard against double-submit (native submit + Enter handler).
  if (props.submitting) return
  if (!validate()) return
  const payload: UserFormPayload = {
    name: form.name.trim(),
    role: form.role,
  }
  if (props.mode === 'create') {
    payload.email = form.email.trim()
    payload.password = form.password
  } else {
    payload.isActive = form.isActive
  }
  emit('submit', payload)
}

defineExpose({ submit: onSubmit })
</script>

<template>
  <form class="stack" @submit.prevent="onSubmit" @keyup.enter="onEnterKey">
    <BaseInput
      v-model="form.name"
      label="Nama Lengkap"
      placeholder="Budi Santoso"
      required
      :error="errors.name"
    />

    <BaseInput
      v-if="mode === 'create'"
      v-model="form.email"
      label="Email"
      type="email"
      placeholder="budi@klontong.com"
      required
      :error="errors.email"
    />
    <BaseInput
      v-else
      :model-value="form.email"
      label="Email"
      disabled
      hint="Email tidak dapat diubah"
    />

    <BaseInput
      v-if="mode === 'create'"
      v-model="form.password"
      label="Password"
      type="password"
      placeholder="Minimal 6 karakter"
      required
      :error="errors.password"
    />

    <BaseSelect v-model="form.role" label="Role" :options="roleOptions" required />

    <BaseSelect
      v-if="mode === 'edit'"
      v-model="statusModel"
      label="Status"
      :options="statusOptions"
    />
  </form>
</template>
