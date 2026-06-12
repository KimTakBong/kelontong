import { categoryService } from '~/services/category.service'
import { isApiError } from '~/services/api'
import type { Category } from '~/types'

// Categories rarely change and are reused across the list filter and the
// product form, so cache them once at module scope.
const categories = ref<Category[]>([])
const loaded = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

export function useCategories() {
  async function fetchCategories(force = false): Promise<void> {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      categories.value = await categoryService.list()
      loaded.value = true
    } catch (err) {
      error.value = isApiError(err) ? err.message : 'Gagal memuat kategori.'
    } finally {
      loading.value = false
    }
  }

  function categoryName(id: string | null | undefined): string {
    if (id == null) return '-'
    return categories.value.find((c) => c.id === id)?.name ?? '-'
  }

  return { categories, loading, error, loaded, fetchCategories, categoryName }
}
