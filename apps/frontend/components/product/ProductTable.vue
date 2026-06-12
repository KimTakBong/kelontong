<script setup lang="ts">
import type { Product, ProductSortBy, SortOrder } from '~/types'

interface Props {
  products: Product[]
  loading: boolean
  sortBy: ProductSortBy
  sortOrder: SortOrder
  canArchive: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  sort: [field: ProductSortBy]
  detail: [product: Product]
  edit: [product: Product]
  archive: [product: Product]
  restore: [product: Product]
  delete: [product: Product]
}>()

const { formatPrice } = useFormat()

function sortIndicator(field: ProductSortBy): string {
  if (props.sortBy !== field) return ''
  return props.sortOrder === 'asc' ? ' ▲' : ' ▼'
}
</script>

<template>
  <div class="table-wrap card" style="padding: 0">
    <table>
      <thead>
        <tr>
          <th>Produk</th>
          <th>SKU</th>
          <th>Kategori</th>
          <th class="sortable text-right" @click="emit('sort', 'price')">
            Harga{{ sortIndicator('price') }}
          </th>
          <th class="sortable text-right" @click="emit('sort', 'stock')">
            Stok{{ sortIndicator('stock') }}
          </th>
          <th>Status</th>
          <th class="text-right">Aksi</th>
        </tr>
      </thead>

      <!-- Loading skeleton rows -->
      <tbody v-if="loading">
        <tr v-for="n in 6" :key="`sk-${n}`">
          <td v-for="c in 7" :key="c">
            <div class="skeleton" style="height: 1rem; width: 80%" />
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr v-for="product in products" :key="product.id">
          <td>
            <button class="product-cell" @click="emit('detail', product)">
              <ProductImage :src="product.image" :alt="product.name" />
              <span class="product-name">{{ product.name }}</span>
            </button>
          </td>
          <td><code>{{ product.sku }}</code></td>
          <td>{{ product.categoryName || '-' }}</td>
          <td class="text-right">{{ formatPrice(product.price) }}</td>
          <td class="text-right">{{ product.stock }}</td>
          <td><ProductStatusBadge :active="product.isActive" /></td>
          <td class="text-right">
            <div class="row" style="justify-content: flex-end; gap: 0.4rem">
              <BaseButton variant="secondary" size="sm" @click="emit('detail', product)">
                Detail
              </BaseButton>
              <BaseButton
                v-if="product.isActive"
                variant="secondary"
                size="sm"
                @click="emit('edit', product)"
              >
                Edit
              </BaseButton>
              <BaseButton
                v-if="canArchive && product.isActive"
                variant="danger"
                size="sm"
                @click="emit('archive', product)"
              >
                Arsip
              </BaseButton>
              <BaseButton
                v-if="canArchive && !product.isActive"
                variant="secondary"
                size="sm"
                @click="emit('restore', product)"
              >
                Pulihkan
              </BaseButton>
              <BaseButton
                v-if="canArchive && !product.isActive"
                variant="danger"
                size="sm"
                @click="emit('delete', product)"
              >
                Delete
              </BaseButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.product-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-text);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.product-name {
  font-weight: 600;
  white-space: normal;
}
.product-cell:hover .product-name {
  color: var(--color-primary);
  text-decoration: underline;
}
code {
  background: var(--color-code-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
}
</style>
