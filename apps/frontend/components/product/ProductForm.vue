<script setup lang="ts">
import { uploadService } from '~/services/upload.service'
import { isApiError } from '~/services/api'
import type {
  ApiErrorDetail,
  Category,
  Product,
  ProductCreateInput,
} from '~/types'

interface Props {
  // Existing product when editing; undefined when creating.
  initial?: Product
  categories: Category[]
  submitting: boolean
  submitLabel?: string
  // Server-side field errors (from a 400 response) to surface inline.
  serverErrors?: ApiErrorDetail[]
}

const props = withDefaults(defineProps<Props>(), { submitLabel: 'Simpan' })
const emit = defineEmits<{
  submit: [payload: ProductCreateInput]
  'manage-categories': []
}>()

// Local form state. Numbers use string-friendly nullable fields for empty inputs.
const form = reactive({
  categoryId: props.initial?.categoryId ?? (null as string | null),
  sku: props.initial?.sku ?? '',
  name: props.initial?.name ?? '',
  description: props.initial?.description ?? '',
  weight: props.initial?.weight ?? (null as number | null),
  width: props.initial?.width ?? (null as number | null),
  length: props.initial?.length ?? (null as number | null),
  height: props.initial?.height ?? (null as number | null),
  image: props.initial?.image ?? '',
  price: props.initial?.price ?? (null as number | null),
  stock: props.initial?.stock ?? (null as number | null),
})

const errors = reactive<Record<string, string>>({})

const categoryOptions = computed(() =>
  props.categories.map((c) => ({ value: c.id, label: c.name })),
)

// Merge server errors into the same map keyed by field.
watch(
  () => props.serverErrors,
  (list) => {
    if (!list) return
    for (const e of list) errors[e.field] = e.message
  },
  { immediate: true },
)

function generateSku(): void {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sku = ''
  for (let i = 0; i < 6; i++) {
    sku += chars[Math.floor(Math.random() * chars.length)]
  }
  form.sku = sku
  delete errors.sku
}

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]

  if (!form.categoryId) errors.categoryId = 'Kategori wajib dipilih'

  const sku = form.sku.trim()
  if (!sku) errors.sku = 'SKU wajib diisi'
  else if (sku.length > 20) errors.sku = 'SKU maksimal 20 karakter'
  else if (!/^[A-Z0-9]+$/.test(sku))
    errors.sku = 'SKU hanya boleh huruf kapital dan angka'

  const name = form.name.trim()
  if (!name) errors.name = 'Nama wajib diisi'
  else if (name.length < 2) errors.name = 'Nama minimal 2 karakter'
  else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter'

  if (form.price == null || form.price === ('' as unknown))
    errors.price = 'Harga wajib diisi'
  else if (form.price < 0) errors.price = 'Harga tidak boleh negatif'

  if (form.stock == null || form.stock === ('' as unknown))
    errors.stock = 'Stok wajib diisi'
  else if (form.stock < 0) errors.stock = 'Stok tidak boleh negatif'

  for (const dim of ['weight', 'width', 'length', 'height'] as const) {
    const v = form[dim]
    if (v != null && v !== ('' as unknown) && v < 0)
      errors[dim] = 'Tidak boleh negatif'
  }

  return Object.keys(errors).length === 0
}

// ── Image upload (stored locally by the backend, see PRD §9.4) ──
const uploadingImage = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function pickImage(): void {
  fileInputRef.value?.click()
}

async function onImageChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  delete errors.image
  if (!file.type.startsWith('image/')) {
    errors.image = 'File harus berupa gambar'
    input.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errors.image = 'Ukuran gambar maksimal 5MB'
    input.value = ''
    return
  }

  uploadingImage.value = true
  try {
    const { url } = await uploadService.image(file)
    form.image = url
  } catch (err) {
    errors.image = isApiError(err) ? err.message : 'Gagal mengunggah gambar'
  } finally {
    uploadingImage.value = false
    // Reset so selecting the same file again still fires change.
    input.value = ''
  }
}

function removeImage(): void {
  form.image = ''
  delete errors.image
}

function toNumberOrNull(v: number | null): number | null {
  return v == null || (v as unknown) === '' ? null : Number(v)
}

// Submit when Enter is pressed in any field. Skip the description textarea
// (allow newlines) and buttons (Enter there fires their own click).
function onEnterKey(event: KeyboardEvent): void {
  const tag = (event.target as HTMLElement)?.tagName
  if (tag === 'TEXTAREA' || tag === 'BUTTON') return
  onSubmit()
}

function onSubmit(): void {
  // Guard against double-submit (native submit + Enter handler).
  if (props.submitting || uploadingImage.value) return
  if (!validate()) return
  const payload: ProductCreateInput = {
    categoryId: form.categoryId!,
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description?.trim() || null,
    weight: toNumberOrNull(form.weight),
    width: toNumberOrNull(form.width),
    length: toNumberOrNull(form.length),
    height: toNumberOrNull(form.height),
    image: form.image?.trim() || null,
    price: Number(form.price),
    stock: Number(form.stock),
  }
  emit('submit', payload)
}

defineExpose({ submit: onSubmit })
</script>

<template>
  <form class="stack" @submit.prevent="onSubmit" @keyup.enter="onEnterKey">
    <div class="form-grid">
      <div class="field-with-action">
        <BaseSelect
          v-model="form.categoryId"
          label="Kategori"
          placeholder="Pilih kategori"
          required
          :options="categoryOptions"
          :error="errors.categoryId"
        />
        <div class="field-action">
          <span class="field-action-spacer" aria-hidden="true">&nbsp;</span>
          <BaseButton
            variant="secondary"
            type="button"
            @click="emit('manage-categories')"
          >
            Kelola
          </BaseButton>
        </div>
      </div>

      <div class="field-with-action">
        <BaseInput
          v-model="form.sku"
          label="SKU"
          placeholder="MHZVTK"
          required
          :error="errors.sku"
          hint="Huruf kapital & angka, maks 20 karakter"
        />
        <div class="field-action">
          <span class="field-action-spacer" aria-hidden="true">&nbsp;</span>
          <BaseButton variant="primary" type="button" @click="generateSku">
            Generate
          </BaseButton>
        </div>
      </div>

      <BaseInput
        v-model="form.name"
        label="Nama Produk"
        placeholder="Ciki Ciki"
        required
        class="col-span-2"
        :error="errors.name"
      />

      <div class="field col-span-2">
        <label>Deskripsi</label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Deskripsi singkat produk"
          maxlength="1000"
        />
      </div>

      <BaseNumberInput
        v-model="form.price"
        label="Harga (IDR)"
        required
        :error="errors.price"
      />
      <BaseNumberInput
        v-model="form.stock"
        label="Stok"
        required
        :error="errors.stock"
      />

      <BaseNumberInput
        v-model="form.weight"
        label="Berat (gram)"
        :error="errors.weight"
      />

      <BaseNumberInput
        v-model="form.width"
        label="Lebar (cm)"
        decimal
        :error="errors.width"
      />
      <BaseNumberInput
        v-model="form.length"
        label="Panjang (cm)"
        decimal
        :error="errors.length"
      />
      <BaseNumberInput
        v-model="form.height"
        label="Tinggi (cm)"
        decimal
        :error="errors.height"
      />

      <!-- Image upload (stored locally by the backend) -->
      <div class="field col-span-2">
        <label>Gambar Produk</label>
        <div class="image-upload">
          <ProductImage :src="form.image" :size="80" />
          <div class="image-upload-actions">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden-file"
              @change="onImageChange"
            >
            <div class="image-upload-buttons">
              <BaseButton
                variant="secondary"
                type="button"
                :disabled="uploadingImage"
                @click="pickImage"
              >
                {{
                  uploadingImage
                    ? 'Mengunggah…'
                    : form.image
                      ? 'Ganti Gambar'
                      : 'Pilih Gambar'
                }}
              </BaseButton>
              <BaseButton
                v-if="form.image && !uploadingImage"
                variant="ghost"
                type="button"
                @click="removeImage"
              >
                Hapus
              </BaseButton>
            </div>
            <span class="image-upload-hint">
              JPG, PNG, WEBP, atau GIF — maksimal 5MB
            </span>
            <span v-if="errors.image" class="image-upload-error">
              {{ errors.image }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field label {
  font-size: 0.82rem;
  font-weight: 600;
}
textarea {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.field-with-action {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.field-with-action > :first-child {
  flex: 1;
}
.field-action {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.field-action-spacer {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: normal;
  visibility: hidden;
}
.image-upload {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
}
.image-upload-actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.image-upload-buttons {
  display: flex;
  gap: 0.5rem;
}
.hidden-file {
  display: none;
}
.image-upload-hint {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
.image-upload-error {
  font-size: 0.78rem;
  color: var(--color-danger);
}
</style>
