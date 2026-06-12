<script setup lang="ts">
import { isApiError } from '~/services/api'
import { userService } from '~/services/user.service'
import type { UserFormPayload } from '~/components/user/UserForm.vue'
import type { ApiErrorDetail, User } from '~/types'

// Both guards: auth ensures a session, admin ensures the right role.
definePageMeta({ middleware: ['auth', 'admin'] })

const { user: currentUser } = useAuth()
const { formatDate } = useFormat()
const toast = useToast()

const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    users.value = await userService.list()
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Gagal memuat pengguna'
  } finally {
    loading.value = false
  }
}

// ── Create / Edit modal ────────────────────────────────
const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editTarget = ref<User | null>(null)
const submitting = ref(false)
const serverErrors = ref<ApiErrorDetail[]>([])
const userFormRef = ref<{ submit: () => void } | null>(null)

function openCreate(): void {
  formMode.value = 'create'
  editTarget.value = null
  serverErrors.value = []
  formOpen.value = true
}

function openEdit(user: User): void {
  formMode.value = 'edit'
  editTarget.value = user
  serverErrors.value = []
  formOpen.value = true
}

async function onSubmit(payload: UserFormPayload): Promise<void> {
  submitting.value = true
  serverErrors.value = []
  try {
    if (formMode.value === 'create') {
      const created = await userService.create({
        name: payload.name,
        email: payload.email!,
        password: payload.password!,
        role: payload.role,
      })
      users.value.push(created)
      toast.success(`Pengguna "${created.name}" berhasil ditambahkan`)
    } else if (editTarget.value) {
      const updated = await userService.update(editTarget.value.id, {
        name: payload.name,
        role: payload.role,
        isActive: payload.isActive,
      })
      Object.assign(editTarget.value, updated)
      toast.success('Perubahan disimpan')
    }
    formOpen.value = false
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

// ── Delete confirmation ────────────────────────────────
const deleteTarget = ref<User | null>(null)
const deleting = ref(false)

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await userService.remove(deleteTarget.value.id)
    users.value = users.value.filter((u) => u.id !== deleteTarget.value!.id)
    toast.success(`Pengguna "${deleteTarget.value.name}" dihapus`)
    deleteTarget.value = null
  } catch (err) {
    toast.error(isApiError(err) ? err.message : 'Gagal menghapus pengguna')
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="stack">
    <div class="row between row-wrap">
      <div>
        <h1>Pengguna</h1>
        <p class="text-muted text-sm">Kelola pengguna, role, dan status akses.</p>
      </div>
      <BaseButton @click="openCreate">+ Tambah Pengguna</BaseButton>
    </div>

    <StateError v-if="error" :message="error" @retry="load" />

    <div v-else class="table-wrap card" style="padding: 0">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Dibuat</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="n in 3" :key="n">
            <td v-for="c in 6" :key="c">
              <div class="skeleton" style="height: 1rem; width: 80%" />
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-for="u in users" :key="u.id">
            <td>
              <strong>{{ u.name }}</strong>
              <span v-if="u.id === currentUser?.id" class="text-muted text-sm"> (Anda)</span>
            </td>
            <td>{{ u.email }}</td>
            <td>
              <span class="badge" :class="u.role === 'admin' ? 'badge-admin' : 'badge-staff'">
                {{ u.role }}
              </span>
            </td>
            <td>
              <span class="badge" :class="u.isActive ? 'badge-success' : 'badge-muted'">
                {{ u.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="text-muted text-sm">{{ formatDate(u.createdAt) }}</td>
            <td class="text-right">
              <div class="row" style="justify-content: flex-end; gap: 0.4rem">
                <BaseButton variant="secondary" size="sm" @click="openEdit(u)">
                  Edit
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="sm"
                  :disabled="u.id === currentUser?.id"
                  :title="u.id === currentUser?.id ? 'Tidak dapat menghapus akun sendiri' : ''"
                  @click="deleteTarget = u"
                >
                  Hapus
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit modal -->
    <BaseModal
      :open="formOpen"
      :title="formMode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'"
      @close="formOpen = false"
    >
      <UserForm
        ref="userFormRef"
        :key="editTarget?.id ?? 'create'"
        :mode="formMode"
        :initial="editTarget ?? undefined"
        :submitting="submitting"
        :server-errors="serverErrors"
        @submit="onSubmit"
      />
      <template #actions>
        <BaseButton variant="secondary" type="button" @click="formOpen = false">
          Batal
        </BaseButton>
        <BaseButton :loading="submitting" @click="userFormRef?.submit()">
          {{ formMode === 'create' ? 'Tambah' : 'Simpan' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirmation -->
    <BaseModal
      :open="!!deleteTarget"
      title="Hapus pengguna?"
      @close="deleteTarget = null"
    >
      <p class="text-muted">
        Pengguna <strong>{{ deleteTarget?.name }}</strong> ({{ deleteTarget?.email }})
        akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
      </p>
      <template #actions>
        <BaseButton variant="secondary" @click="deleteTarget = null">Batal</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="confirmDelete">
          Hapus
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
