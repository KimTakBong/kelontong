import { storeToRefs } from 'pinia'
import { useProductsStore } from '~/stores/products'
import type {
  ProductListQuery,
  ProductSortBy,
  SortOrder,
} from '~/types'

const DEFAULT_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 400

// Orchestrates the product list page: reads filter state from the URL, keeps it
// in sync, debounces search, and triggers store fetches. The page stays thin —
// it just binds inputs to the refs this returns. (Architecture-Note §3.)
export function useProducts() {
  const route = useRoute()
  const router = useRouter()
  const store = useProductsStore()
  const { items, meta, loading, error, isEmpty } = storeToRefs(store)

  // Parse helpers — query params are always strings (or undefined).
  const q = route.query
  const search = ref<string>(typeof q.search === 'string' ? q.search : '')
  const page = ref<number>(toInt(q.page, 1))
  const limit = ref<number>(toInt(q.limit, DEFAULT_LIMIT))
  const categoryId = ref<string | null>(typeof q.categoryId === 'string' ? q.categoryId : null)
  const isActive = ref<boolean | null>(toTriState(q.isActive))
  const sortBy = ref<ProductSortBy>(toSortBy(q.sortBy))
  const sortOrder = ref<SortOrder>(q.sortOrder === 'asc' ? 'asc' : 'desc')

  function buildQuery(): ProductListQuery {
    return {
      page: page.value,
      limit: limit.value,
      search: search.value || undefined,
      categoryId: categoryId.value ?? undefined,
      isActive: isActive.value ?? undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    }
  }

  // Push current filter state into the URL (persist across refresh / shareable).
  function syncUrl(): void {
    const query: Record<string, string> = {}
    if (search.value) query.search = search.value
    if (page.value !== 1) query.page = String(page.value)
    if (limit.value !== DEFAULT_LIMIT) query.limit = String(limit.value)
    if (categoryId.value != null) query.categoryId = String(categoryId.value)
    if (isActive.value != null) query.isActive = String(isActive.value)
    if (sortBy.value !== 'createdAt') query.sortBy = sortBy.value
    if (sortOrder.value !== 'desc') query.sortOrder = sortOrder.value
    router.replace({ query })
  }

  async function load(): Promise<void> {
    syncUrl()
    await store.fetch(buildQuery())
  }

  // Filters (other than page) reset pagination back to page 1.
  function applyFilterReset(): void {
    page.value = 1
    load()
  }

  // Debounced search: typing waits 400ms before firing a request.
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => applyFilterReset(), SEARCH_DEBOUNCE_MS)
  })

  watch([categoryId, isActive], () => applyFilterReset())

  function changePage(next: number): void {
    if (next < 1 || (meta.value.totalPages && next > meta.value.totalPages)) return
    page.value = next
    load()
  }

  // Click a sortable column header: toggle order if same field, else asc.
  function toggleSort(field: ProductSortBy): void {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
    applyFilterReset()
  }

  function refresh(): void {
    load()
  }

  return {
    // state
    items,
    meta,
    loading,
    error,
    isEmpty,
    // filters (v-model targets)
    search,
    page,
    limit,
    categoryId,
    isActive,
    sortBy,
    sortOrder,
    // actions
    load,
    refresh,
    changePage,
    toggleSort,
  }
}

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN
  return Number.isFinite(n) ? n : fallback
}

function toTriState(value: unknown): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function toSortBy(value: unknown): ProductSortBy {
  const allowed: ProductSortBy[] = ['name', 'price', 'stock', 'createdAt']
  return allowed.includes(value as ProductSortBy) ? (value as ProductSortBy) : 'createdAt'
}
