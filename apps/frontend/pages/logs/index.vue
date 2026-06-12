<script setup lang="ts">
import { isApiError } from '~/services/api'
import { logService } from '~/services/log.service'
import { userService } from '~/services/user.service'
import type { ApiLog } from '~/types'

// Admin-only: auth ensures a session, admin ensures the role.
definePageMeta({ middleware: ['auth', 'admin'] })

const { formatDate } = useFormat()

const logs = ref<ApiLog[]>([])
const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 0 })
const loading = ref(true)
const error = ref('')

// Filters
const path = ref('')
const statusCode = ref<string>('')
const page = ref(1)

// userId → name map so logs show who made the request (logs survive user
// deletion, so unknown ids fall back to a short id).
const userNames = ref<Record<string, string>>({})

async function loadUsers(): Promise<void> {
  try {
    const users = await userService.list()
    userNames.value = Object.fromEntries(users.map((u) => [u.id, u.name]))
  } catch {
    // non-fatal — logs still render with raw ids
  }
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await logService.list({
      page: page.value,
      limit: meta.value.limit,
      path: path.value || undefined,
      statusCode: statusCode.value ? Number(statusCode.value) : undefined,
    })
    logs.value = res.data
    meta.value = res.meta
  } catch (err) {
    error.value = isApiError(err) ? err.message : 'Gagal memuat log'
  } finally {
    loading.value = false
  }
}

// Debounced path search; status filter applies immediately. Both reset to page 1.
let timer: ReturnType<typeof setTimeout> | null = null
watch(path, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})
watch(statusCode, () => {
  page.value = 1
  load()
})

function changePage(next: number): void {
  if (next < 1 || next > meta.value.totalPages) return
  page.value = next
  load()
}

function userLabel(id: string | null): string {
  if (!id) return 'Guest'
  return userNames.value[id] ?? `${id.slice(0, 8)}…`
}

function methodClass(method: string): string {
  return `m-${method.toLowerCase()}`
}
function statusClass(code: number): string {
  if (code < 300) return 's-2xx'
  if (code < 400) return 's-3xx'
  if (code < 500) return 's-4xx'
  return 's-5xx'
}

// Detail modal
const detail = ref<ApiLog | null>(null)
const prettyBody = computed(() =>
  detail.value?.requestBody
    ? JSON.stringify(detail.value.requestBody, null, 2)
    : null,
)

onMounted(() => {
  loadUsers()
  load()
})
</script>

<template>
  <div class="stack">
    <div>
      <h1>API Log</h1>
      <p class="text-muted text-sm">Riwayat semua request yang masuk ke API.</p>
    </div>

    <!-- Filters -->
    <div class="card filters">
      <div class="search-box">
        <BaseInput v-model="path" type="search" placeholder="Cari path… (mis. /products)" />
      </div>
      <BaseInput
        v-model="statusCode"
        type="number"
        placeholder="Status code (mis. 404)"
      />
    </div>

    <StateError v-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="table-wrap card" style="padding: 0">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th class="text-right">Durasi</th>
              <th>User</th>
              <th>Waktu</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody v-if="loading">
            <tr v-for="n in 8" :key="n">
              <td v-for="c in 7" :key="c">
                <div class="skeleton" style="height: 1rem; width: 80%" />
              </td>
            </tr>
          </tbody>

          <tbody v-else-if="logs.length === 0">
            <tr>
              <td colspan="7">
                <StateEmpty title="Belum ada log" message="Tidak ada log yang cocok dengan filter." />
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr v-for="log in logs" :key="log.id">
              <td><span class="tag" :class="methodClass(log.method)">{{ log.method }}</span></td>
              <td><code>{{ log.path }}</code></td>
              <td><span class="tag" :class="statusClass(log.statusCode)">{{ log.statusCode }}</span></td>
              <td class="text-right">{{ log.duration }} ms</td>
              <td>{{ userLabel(log.userId) }}</td>
              <td class="text-muted text-sm">{{ formatDate(log.createdAt) }}</td>
              <td class="text-right">
                <BaseButton variant="ghost" size="sm" @click="detail = log">
                  Detail
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BasePagination v-if="logs.length" :meta="meta" @change="changePage" />
    </template>

    <!-- Detail modal -->
    <BaseModal :open="!!detail" size="lg" title="Detail Log" @close="detail = null">
      <div v-if="detail" class="stack">
        <dl class="detail-grid">
          <div><dt>Method</dt><dd><span class="tag" :class="methodClass(detail.method)">{{ detail.method }}</span></dd></div>
          <div><dt>Status</dt><dd><span class="tag" :class="statusClass(detail.statusCode)">{{ detail.statusCode }}</span></dd></div>
          <div class="col-span-2"><dt>Path</dt><dd><code>{{ detail.path }}</code></dd></div>
          <div><dt>Durasi</dt><dd>{{ detail.duration }} ms</dd></div>
          <div><dt>Waktu</dt><dd>{{ formatDate(detail.createdAt) }}</dd></div>
          <div><dt>User</dt><dd>{{ userLabel(detail.userId) }}</dd></div>
          <div><dt>IP</dt><dd>{{ detail.ip || '-' }}</dd></div>
          <div class="col-span-2"><dt>User Agent</dt><dd class="break">{{ detail.userAgent || '-' }}</dd></div>
        </dl>

        <div>
          <dt class="block-label">Request Body</dt>
          <pre v-if="prettyBody" class="json">{{ prettyBody }}</pre>
          <p v-else class="text-muted text-sm">Tidak ada (hanya untuk POST/PATCH; field sensitif dihapus).</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: 1fr 220px;
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

code {
  background: var(--color-code-bg);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
}

/* Method & status tags */
.tag {
  display: inline-block;
  padding: 0.12rem 0.5rem;
  border-radius: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.m-get { background: #dbeafe; color: #1e40af; }
.m-post { background: #dcfce7; color: #166534; }
.m-patch { background: #fef3c7; color: #92400e; }
.m-delete { background: #fee2e2; color: #991b1b; }
.s-2xx { background: #dcfce7; color: #166534; }
.s-3xx { background: #dbeafe; color: #1e40af; }
.s-4xx { background: #fef3c7; color: #92400e; }
.s-5xx { background: #fee2e2; color: #991b1b; }

/* Detail modal grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem 1.5rem;
  margin: 0;
}
.detail-grid .col-span-2 {
  grid-column: span 2;
}
.detail-grid dt,
.block-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-muted);
  margin-bottom: 0.2rem;
}
.detail-grid dd {
  margin: 0;
  font-weight: 600;
}
.break {
  word-break: break-word;
  font-weight: 400;
  font-size: 0.85rem;
}
.json {
  margin: 0.4rem 0 0;
  padding: 0.75rem;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre;
}
@media (max-width: 560px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-grid .col-span-2 {
    grid-column: span 1;
  }
}
</style>
