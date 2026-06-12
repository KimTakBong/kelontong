<script setup lang="ts">
import type { Product } from '~/types'

const props = defineProps<{ product: Product }>()

const { formatPrice, formatDate } = useFormat()

const dimensions = computed(() => {
  const { width, length, height } = props.product
  if (width == null && length == null && height == null) return '-'
  return `${width ?? '-'} × ${length ?? '-'} × ${height ?? '-'} cm`
})
</script>

<template>
  <div class="stack">
    <div class="row" style="gap: 1rem; align-items: flex-start">
      <ProductImage :src="product.image" :alt="product.name" :size="88" />
      <div>
        <h2 style="margin: 0">{{ product.name }}</h2>
        <div class="row" style="gap: 0.5rem; margin-top: 0.25rem">
          <code>{{ product.sku }}</code>
          <ProductStatusBadge :active="product.isActive" />
        </div>
        <p class="price">{{ formatPrice(product.price) }}</p>
      </div>
    </div>

    <p v-if="product.description" class="description">{{ product.description }}</p>

    <dl class="detail-grid">
      <div><dt>Kategori</dt><dd>{{ product.categoryName || '-' }}</dd></div>
      <div><dt>Stok</dt><dd>{{ product.stock }}</dd></div>
      <div><dt>Berat</dt><dd>{{ product.weight != null ? `${product.weight} gram` : '-' }}</dd></div>
      <div><dt>Dimensi (P × L × T)</dt><dd>{{ dimensions }}</dd></div>
      <div><dt>Dibuat</dt><dd>{{ formatDate(product.createdAt) }}</dd></div>
      <div><dt>Diperbarui</dt><dd>{{ formatDate(product.updatedAt) }}</dd></div>
    </dl>
  </div>
</template>

<style scoped>
.price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0.5rem 0 0;
}
.description {
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1.5rem;
  margin: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.detail-grid dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
  margin-bottom: 0.2rem;
}
.detail-grid dd {
  margin: 0;
  font-weight: 600;
}
code {
  background: var(--color-code-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
}
@media (max-width: 560px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
