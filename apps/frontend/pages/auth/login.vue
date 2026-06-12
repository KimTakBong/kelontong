<script setup lang="ts">
import { isApiError } from '~/services/api'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const toast = useToast()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const errorMessage = ref('')

async function onSubmit(): Promise<void> {
  // Guard against double-submit (native form submit + explicit Enter handler).
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    await login({ email: form.email.trim(), password: form.password })
    toast.success('Berhasil masuk')
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/products'
    await navigateTo(redirect)
  } catch (err) {
    errorMessage.value = isApiError(err)
      ? err.message
      : 'Gagal masuk. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="stack">
    <div>
      <h2>Masuk</h2>
      <p class="text-muted text-sm">Masuk untuk mengelola produk toko.</p>
    </div>

    <form class="stack" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="admin@klontong.com"
        required
        @keyup.enter="onSubmit"
      />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        @keyup.enter="onSubmit"
      />

      <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>

      <BaseButton type="submit" block :loading="submitting">Masuk</BaseButton>
    </form>

    <p class="text-sm text-muted text-center">
      Belum punya akun?
      <NuxtLink to="/auth/register">Daftar di sini</NuxtLink>
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
