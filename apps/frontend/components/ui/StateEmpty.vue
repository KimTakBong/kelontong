<script setup lang="ts">
defineProps<{ title?: string; message?: string }>()
</script>

<template>
  <div class="state">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.5" class="state-icon">
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
    <h3>{{ title || 'Belum ada data' }}</h3>
    <p class="text-muted">{{ message || 'Tidak ada produk yang cocok dengan filter saat ini.' }}</p>
    <slot />
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
  color: var(--color-text-muted);
  opacity: 0.6;
  margin-bottom: 0.5rem;
}
p {
  margin: 0 0 0.75rem;
  max-width: 360px;
}
</style>
