<script setup lang="ts">
import { isApiError } from '~/services/api'

definePageMeta({ layout: 'auth' })

const { register } = useAuth()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const errorMessage = ref('')

function validate(): boolean {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!form.name.trim()) errors.name = 'Nama wajib diisi'
  if (!form.email.trim()) errors.email = 'Email wajib diisi'
  if (form.password.length < 6) errors.password = 'Password minimal 6 karakter'
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Konfirmasi password tidak cocok'
  return Object.keys(errors).length === 0
}

async function onSubmit(): Promise<void> {
  // Guard against double-submit (native form submit + explicit Enter handler).
  if (submitting.value) return
  errorMessage.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    })
    toast.success('Akun berhasil dibuat. Silakan masuk.')
    await navigateTo('/auth/login')
  } catch (err) {
    errorMessage.value = isApiError(err)
      ? err.message
      : 'Gagal mendaftar. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div>
      <h2>Daftar</h2>
      <p class="text-muted text-sm">Buat akun staff baru.</p>
    </div>

    <form class="stack" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.name"
        label="Nama Lengkap"
        placeholder="John Doe"
        required
        :error="errors.name"
        @keyup.enter="onSubmit"
      />
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="john@example.com"
        required
        :error="errors.email"
        @keyup.enter="onSubmit"
      />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="Minimal 6 karakter"
        required
        :error="errors.password"
        @keyup.enter="onSubmit"
      />
      <BaseInput
        v-model="form.confirmPassword"
        label="Konfirmasi Password"
        type="password"
        placeholder="Ulangi password"
        required
        :error="errors.confirmPassword"
        @keyup.enter="onSubmit"
      />

      <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>

      <BaseButton type="submit" block :loading="submitting">Daftar</BaseButton>
    </form>

    <p class="text-sm text-muted text-center">
      Sudah punya akun?
      <NuxtLink to="/auth/login">Masuk di sini</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.text-center {
  text-align: center;
}
.alert-error {
  margin: 0;
  padding: 0.6rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--color-danger);
  border-radius: var(--radius);
  font-size: 0.85rem;
}
</style>
