<script setup lang="ts">
import { isApiError } from '~/services/api'
import { productService } from '~/services/product.service'
import type { ApiErrorDetail, Product, ProductCreateInput } from '~/types'

definePageMeta({ middleware: 'auth' })

const {
  items,
  meta,
  loading,
  error,
  isEmpty,
  search,
  categoryId,
  isActive,
  sortBy,
  sortOrder,
  load,
  refresh,
  changePage,
  toggleSort,
} = useProducts()

const { isAdmin } = useAuth()
const { categories, fetchCategories } = useCategories()
const toast = useToast()

// Status filter as a tri-state select bound to the composable's isActive ref.
const statusOptions = [
  { value: 'all', label: 'Semua status' },
  { value: 'true', label: 'Aktif' },
  { value: 'false', label: 'Arsip' },
]
const statusModel = computed<string>({
  get: () => (isActive.value === null ? 'all' : String(isActive.value)),
  set: (v) => {
    isActive.value = v === 'all' ? null : v === 'true'
  },
})

const categoryOptions = computed(() => [
  { value: '', label: 'Semua kategori' },
  ...categories.value.map((c) => ({ value: c.id, label: c.name })),
])
const categoryModel = computed<string>({
  get: () => categoryId.value ?? '',
  set: (v) => {
    categoryId.value = v === '' ? null : v
  },
})

// ── Create / Edit modal ────────────────────────────────
const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formProduct = ref<Product | null>(null)
const submitting = ref(false)
const serverErrors = ref<ApiErrorDetail[]>([])
const productFormRef = ref<{ submit: () => void } | null>(null)

// ── Category manager (modal-over-modal) ─────────────────
const categoryManagerOpen = ref(false)

function openCreate(): void {
  formMode.value = 'create'
  formProduct.value = null
  serverErrors.value = []
  formOpen.value = true
}

function openEdit(product: Product): void {
  formMode.value = 'edit'
  formProduct.value = product
  serverErrors.value = []
  detailProduct.value = null
  formOpen.value = true
}

async function onFormSubmit(payload: ProductCreateInput): Promise<void> {
  submitting.value = true
  serverErrors.value = []
  try {
    if (formMode.value === 'create') {
      const created = await productService.create(payload)
      toast.success(`Produk "${created.name}" berhasil dibuat`)
    } else if (formProduct.value) {
      await productService.update(formProduct.value.id, payload)
      toast.success('Perubahan disimpan')
    }
    formOpen.value = false
    refresh()
  } catch (err) {
    if (isApiError(err)) {
      if (err.details?.length) serverErrors.value = err.details
      toast.error(err.message)
    } else {
      toast.error('Terjadi kesalahan')
    }
  } finally {
    submitting.value = false
  }
}

// ── Detail modal ───────────────────────────────────────
const detailProduct = ref<Product | null>(null)

function openDetail(product: Product): void {
  detailProduct.value = product
}

// ── Archive confirmation ───────────────────────────────
const archiveTarget = ref<Product | null>(null)
const archiving = ref(false)

function confirmArchive(product: Product): void {
  detailProduct.value = null
  archiveTarget.value = product
}

async function doArchive(): Promise<void> {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    await productService.archive(archiveTarget.value.id)
    toast.success(`"${archiveTarget.value.name}" berhasil diarsipkan`)
    archiveTarget.value = null
    refresh()
  } catch (err) {
    toast.error(isApiError(err) ? err.message : 'Gagal mengarsipkan produk')
  } finally {
    archiving.value = false
  }
}

// Restore is safe & reversible, so no confirmation dialog — just do it.
async function doRestore(product: Product): Promise<void> {
  detailProduct.value = null
  try {
    await productService.restore(product.id)
    toast.success(`"${product.name}" berhasil dipulihkan`)
    refresh()
  } catch (err) {
    toast.error(isApiError(err) ? err.message : 'Gagal memulihkan produk')
  }
}

// ── Permanent delete confirmation ───────────────────────
const deleteTarget = ref<Product | null>(null)
const deleting = ref(false)

function confirmDelete(product: Product): void {
  detailProduct.value = null
  deleteTarget.value = product
}

async function doDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await productService.remove(deleteTarget.value.id)
    toast.success(`"${deleteTarget.value.name}" berhasil dihapus permanen`)
    deleteTarget.value = null
    refresh()
  } catch (err) {
    toast.error(isApiError(err) ? err.message : 'Gagal menghapus produk')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchCategories()
  load()
})
</script>

<template>
  <div class="stack">
    <div class="row between row-wrap">
      <div>
        <h1>Produk</h1>
        <p class="text-muted text-sm">Kelola katalog produk toko.</p>
      </div>
      <div class="row">
        <BaseButton v-if="isAdmin" variant="secondary" @click="categoryManagerOpen = true">
          Kelola Kategori
        </BaseButton>
        <BaseButton @click="openCreate">+ Tambah Produk</BaseButton>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="card filters">
      <div class="search-box">
        <BaseInput
          v-model="search"
          type="search"
          placeholder="Cari nama produk atau SKU…"
        />
      </div>
      <BaseSelect v-model="categoryModel" :options="categoryOptions" />
      <BaseSelect v-model="statusModel" :options="statusOptions" />
    </div>

    <!-- Error state -->
    <StateError v-if="error" :message="error" @retry="refresh" />

    <!-- Empty state -->
    <div v-else-if="isEmpty" class="card">
      <StateEmpty>
        <BaseButton size="sm" @click="openCreate">Tambah produk pertama</BaseButton>
      </StateEmpty>
    </div>

    <!-- Table (handles its own loading skeleton) -->
    <template v-else>
      <ProductTable
        :products="items"
        :loading="loading"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :can-archive="isAdmin"
        @sort="toggleSort"
        @detail="openDetail"
        @edit="openEdit"
        @archive="confirmArchive"
        @restore="doRestore"
        @delete="confirmDelete"
      />
      <BasePagination :meta="meta" @change="changePage" />
    </template>

    <!-- Create / Edit modal -->
    <BaseModal
      :open="formOpen"
      size="lg"
      :title="formMode === 'create' ? 'Tambah Produk' : 'Edit Produk'"
      @close="formOpen = false"
    >
      <ProductForm
        ref="productFormRef"
        :key="formProduct?.id ?? 'create'"
        :initial="formProduct ?? undefined"
        :categories="categories"
        :submitting="submitting"
        :server-errors="serverErrors"
        @submit="onFormSubmit"
        @manage-categories="categoryManagerOpen = true"
      />
      <template #actions>
        <BaseButton variant="secondary" type="button" @click="formOpen = false">
          Batal
        </BaseButton>
        <BaseButton :loading="submitting" @click="productFormRef?.submit()">
          {{ formMode === 'create' ? 'Buat Produk' : 'Simpan Perubahan' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Detail modal -->
    <BaseModal
      :open="!!detailProduct"
      size="lg"
      title="Detail Produk"
      @close="detailProduct = null"
    >
      <ProductDetail v-if="detailProduct" :product="detailProduct" />
      <template v-if="detailProduct" #actions>
        <BaseButton
          v-if="detailProduct.isActive"
          variant="secondary"
          @click="openEdit(detailProduct)"
        >
          Edit
        </BaseButton>
        <BaseButton
          v-if="isAdmin && detailProduct.isActive"
          variant="danger"
          @click="confirmArchive(detailProduct)"
        >
          Arsip
        </BaseButton>
        <BaseButton
          v-if="isAdmin && !detailProduct.isActive"
          variant="secondary"
          @click="doRestore(detailProduct)"
        >
          Pulihkan
        </BaseButton>
        <BaseButton
          v-if="isAdmin && !detailProduct.isActive"
          variant="danger"
          @click="confirmDelete(detailProduct)"
        >
          Delete
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Archive confirmation -->
    <BaseModal
      :open="!!archiveTarget"
      title="Arsipkan produk?"
      @close="archiveTarget = null"
    >
      <p class="text-muted">
        Produk <strong>{{ archiveTarget?.name }}</strong> akan diarsipkan
        (soft delete). Data tetap tersimpan dan bisa dilihat lewat filter
        "Arsip".
      </p>
      <template #actions>
        <BaseButton variant="secondary" @click="archiveTarget = null">
          Batal
        </BaseButton>
        <BaseButton variant="danger" :loading="archiving" @click="doArchive">
          Arsipkan
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Permanent delete confirmation -->
    <BaseModal
      :open="!!deleteTarget"
      title="Hapus produk permanen?"
      @close="deleteTarget = null"
    >
      <p class="text-muted">
        Produk <strong>{{ deleteTarget?.name }}</strong> akan dihapus secara
        permanen dan tidak bisa dikembalikan.
      </p>
      <template #actions>
        <BaseButton variant="secondary" @click="deleteTarget = null">
          Batal
        </BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="doDelete">
          Hapus Permanen
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Category manager (can open on top of the create/edit modal) -->
    <CategoryManagerModal
      :open="categoryManagerOpen"
      @close="categoryManagerOpen = false"
    />
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  align-items: start;
}
.search-box {
  min-width: 0;
}
@media (max-width: 640px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
