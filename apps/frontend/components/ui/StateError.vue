<script setup lang="ts">
defineProps<{ message?: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="state">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.5" class="state-icon">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
    <h3>Terjadi kesalahan</h3>
    <p class="text-muted">{{ message || 'Gagal memuat data. Silakan coba lagi.' }}</p>
    <BaseButton variant="secondary" size="sm" @click="emit('retry')">
      Coba lagi
    </BaseButton>
  </div>
</template>

<style scoped>
.state {
  text-align: center;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.state-icon {
  color: var(--color-danger);
  opacity: 0.7;
  margin-bottom: 0.5rem;
}
p {
  margin: 0 0 0.75rem;
  max-width: 360px;
}
</style>
