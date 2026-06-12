<script setup lang="ts">
import type { PaginationMeta } from '~/types'

const props = defineProps<{ meta: PaginationMeta }>()
const emit = defineEmits<{ change: [page: number] }>()

// Show a compact window of page numbers around the current page.
const pages = computed<number[]>(() => {
  const { page, totalPages } = props.meta
  if (totalPages <= 1) return [1]
  const span = 2
  const start = Math.max(1, page - span)
  const end = Math.min(totalPages, page + span)
  const result: number[] = []
  for (let i = start; i <= end; i++) result.push(i)
  return result
})

const rangeText = computed<string>(() => {
  const { page, limit, total } = props.meta
  if (total === 0) return '0 produk'
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return `${from}–${to} dari ${total} produk`
})
</script>

<template>
  <div class="pagination row between row-wrap">
    <span class="text-sm text-muted">{{ rangeText }}</span>
    <div class="row">
      <button
        class="page-btn"
        :disabled="meta.page <= 1"
        @click="emit('change', meta.page - 1)"
      >
        ‹
      </button>
      <button
        v-for="p in pages"
        :key="p"
        class="page-btn"
        :class="{ active: p === meta.page }"
        @click="emit('change', p)"
      >
        {{ p }}
      </button>
      <button
        class="page-btn"
        :disabled="meta.page >= meta.totalPages"
        @click="emit('change', meta.page + 1)"
      >
        ›
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  margin-top: 1rem;
}
.page-btn {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-text);
}
.page-btn:hover:not(:disabled) {
  background: var(--color-surface-alt);
}
.page-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
