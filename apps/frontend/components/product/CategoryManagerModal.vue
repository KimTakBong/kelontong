<script setup lang="ts">
import { categoryService } from '~/services/category.service'
import { isApiError } from '~/services/api'
import type { Category } from '~/types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { categories, loading, fetchCategories } = useCategories()
const toast = useToast()

// ── Create ──────────────────────────────────────────────
const newName = ref('')
const creating = ref(false)
const createError = ref('')

async function onCreate(): Promise<void> {
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Nama kategori wajib diisi'
    return
  }
  creating.value = true
  createError.value = ''
  try {
    await categoryService.create(name)
    newName.value = ''
    await fetchCategories(true)
    toast.success('Kategori berhasil ditambahkan')
  } catch (err) {
    createError.value = isApiError(err) ? err.message : 'Gagal menambah kategori'
  } finally {
    creating.value = false
  }
}

// ── Edit (inline) ───────────────────────────────────────
const editingId = ref<string | null>(null)
const editName = ref('')
const editError = ref('')
const saving = ref(false)

function startEdit(category: Category): void {
  deleteTarget.value = null
  editingId.value = category.id
  editName.value = category.name
  editError.value = ''
}

function cancelEdit(): void {
  editingId.value = null
  editError.value = ''
}

async function saveEdit(category: Category): Promise<void> {
  const name = editName.value.trim()
  if (!name) {
    editError.value = 'Nama kategori wajib diisi'
    return
  }
  if (name === category.name) {
    editingId.value = null
    return
  }
  saving.value = true
  editError.value = ''
  try {
    await categoryService.update(category.id, name)
    editingId.value = null
    await fetchCategories(true)
    toast.success('Kategori berhasil diperbarui')
  } catch (err) {
    editError.value = isApiError(err) ? err.message : 'Gagal memperbarui kategori'
  } finally {
    saving.value = false
  }
}

// ── Delete (inline confirm) ─────────────────────────────
const deleteTarget = ref<Category | null>(null)
const deleting = ref(false)

function startDelete(category: Category): void {
  editingId.value = null
  deleteTarget.value = category
}

async function confirmDeleteCategory(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await categoryService.remove(deleteTarget.value.id)
    toast.success(`Kategori "${deleteTarget.value.name}" berhasil dihapus`)
    deleteTarget.value = null
    await fetchCategories(true)
  } catch (err) {
    toast.error(isApiError(err) ? err.message : 'Gagal menghapus kategori')
  } finally {
    deleting.value = false
  }
}

// Reset transient state and refresh the list each time the modal opens.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    newName.value = ''
    createError.value = ''
    editingId.value = null
    deleteTarget.value = null
    fetchCategories(true)
  },
)
</script>

<template>
  <BaseModal :open="open" title="Kelola Kategori" @close="emit('close')">
    <div class="stack">
      <form class="row create-row" @submit.prevent="onCreate">
        <BaseInput
          v-model="newName"
          placeholder="Nama kategori baru"
          :error="createError"
        />
        <BaseButton type="submit" :loading="creating">Tambah</BaseButton>
      </form>

      <p v-if="loading" class="text-muted text-sm">Memuat kategori…</p>
      <p v-else-if="!categories.length" class="text-muted text-sm">
        Belum ada kategori.
      </p>

      <ul v-else class="category-list">
        <li v-for="category in categories" :key="category.id" class="category-row">
          <template v-if="editingId === category.id">
            <BaseInput
              v-model="editName"
              :error="editError"
              class="category-edit-input"
              @keyup.enter="saveEdit(category)"
            />
            <div class="row category-actions">
              <BaseButton size="sm" variant="secondary" @click="cancelEdit">
                Batal
              </BaseButton>
              <BaseButton size="sm" :loading="saving" @click="saveEdit(category)">
                Simpan
              </BaseButton>
            </div>
          </template>

          <template v-else-if="deleteTarget?.id === category.id">
            <span class="category-name text-muted">
              Hapus "{{ category.name }}"?
            </span>
            <div class="row category-actions">
              <BaseButton size="sm" variant="secondary" @click="deleteTarget = null">
                Batal
              </BaseButton>
              <BaseButton
                size="sm"
                variant="danger"
                :loading="deleting"
                @click="confirmDeleteCategory"
              >
                Hapus
              </BaseButton>
            </div>
          </template>

          <template v-else>
            <span class="category-name">{{ category.name }}</span>
            <div class="row category-actions">
              <BaseButton size="sm" variant="secondary" @click="startEdit(category)">
                Edit
              </BaseButton>
              <BaseButton size="sm" variant="danger" @click="startDelete(category)">
                Hapus
              </BaseButton>
            </div>
          </template>
        </li>
      </ul>
    </div>

    <template #actions>
      <BaseButton variant="secondary" @click="emit('close')">Tutup</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.create-row {
  align-items: flex-start;
}
.create-row > :first-child {
  flex: 1;
}
.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.category-name {
  font-weight: 600;
  word-break: break-word;
}
.category-edit-input {
  flex: 1;
}
.category-actions {
  flex-shrink: 0;
}
</style>
