import { defineStore } from 'pinia'
import { productService } from '~/services/product.service'
import { isApiError } from '~/services/api'
import type {
  PaginationMeta,
  Product,
  ProductListQuery,
} from '~/types'

const DEFAULT_META: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 0 }

// Holds the active product list + its loading/error status. Shared so the list
// page and any future widgets (e.g. dashboard counts) read the same source.
export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
    meta: { ...DEFAULT_META } as PaginationMeta,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    isEmpty: (state): boolean => !state.loading && !state.error && state.items.length === 0,
  },

  actions: {
    async fetch(query: ProductListQuery): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const { data, meta } = await productService.list(query)
        this.items = data
        this.meta = meta
      } catch (err) {
        this.items = []
        this.meta = { ...DEFAULT_META }
        this.error = isApiError(err) ? err.message : 'Gagal memuat produk.'
      } finally {
        this.loading = false
      }
    },

    // Optimistic local update after an edit/archive so the table reflects the
    // change without a full refetch.
    patchLocal(updated: Product): void {
      const idx = this.items.findIndex((p) => p.id === updated.id)
      if (idx !== -1) this.items[idx] = updated
    },

    removeLocal(id: string): void {
      this.items = this.items.filter((p) => p.id !== id)
      this.meta.total = Math.max(0, this.meta.total - 1)
    },
  },
})
