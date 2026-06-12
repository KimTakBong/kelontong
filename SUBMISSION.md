# Jawaban Test — Klontong Admin

Ini ringkasan jawaban dari semua poin di `documentation/test_skill_it.pdf`. Tiap
poin saya tunjukin statusnya plus di file mana implementasinya, biar gampang dicek.

Buat cara jalanin app-nya, lihat [`README.md`](./README.md). Buat alasan teknis yang
lebih dalam, lihat [`documentation/Architecture-Note.md`](./documentation/Architecture-Note.md).

**Stack:** Nuxt 3 + Pinia (frontend), NestJS + TypeORM (backend), PostgreSQL,
session-based auth, Docker, Swagger, GitHub Actions CI.

---

## 1. Stack yang Wajib

| Wajib | Status | Di mana |
|-------|--------|---------|
| Frontend: Nuxt 3 | ✅ | `apps/frontend` (Nuxt 3, SPA) |
| State management: Pinia | ✅ | `apps/frontend/stores/auth.ts`, `stores/products.ts` |
| Backend: NestJS | ✅ | `apps/backend` (NestJS 10) |
| Database: PostgreSQL / MongoDB | ✅ | Pakai PostgreSQL + TypeORM, alasannya ada di Architecture-Note bagian 1 |

---

## 2. Ekspektasi Teknis

| Poin | Status | Di mana |
|------|--------|---------|
| Frontend & backend dipisah | ✅ | Dua app sendiri-sendiri di `/apps`, masing-masing punya `package.json` & `.env` |
| Semua request/response JSON | ✅ | REST JSON; bentuk responsnya konsisten `{ data }` / `{ data, meta }` |
| API rapi & konsisten | ✅ | Prefix `/api`, bungkus respons global (`common/interceptors/response.interceptor.ts`), format error global (`common/filters/http-exception.filter.ts`) |
| Ada validation di backend | ✅ | DTO `class-validator` + `ValidationPipe` global, error-nya per-field |
| Frontend pakai struktur jelas buat manggil API | ✅ | Ada service layer (`services/*.service.ts`) + composable (`composables/useProducts.ts`); komponen nggak pernah manggil axios langsung |
| Struktur & naming jelas | ✅ | Backend: 1 module per domain (Controller → Service → Repository). Frontend: pages / components / composables / services / stores / middleware |

---

## 3. Skema Produk

Skema-nya ngikutin contoh di PDF, cuma ada sedikit penyesuaian (alasan lengkapnya
ada di Architecture-Note bagian 2 dan DB-Schema.md):

- `id` saya bikin **UUID**, bukan angka urut, biar jumlah data nggak ketebak dan aman
  kalau nanti datanya tersebar.
- `categoryId` (FK) + `categoryName` digabung di respons (sesuai contoh PDF) lewat
  `apps/backend/src/products/products.presenter.ts`.
- Field lainnya sama persis: `sku`, `name`, `description`, `weight`, `width`, `length`,
  `height`, `image`, `price`, `isActive`, `stock`.
- Tambahan: `deletedAt` (buat soft delete), `createdAt`, `updatedAt`.

Definisi lengkapnya: `apps/backend/src/products/entities/product.entity.ts`.

---

## 4. Fitur Wajib

### 4.1 Authentication
| Fitur | Status | Di mana |
|-------|--------|---------|
| Register | ✅ | `POST /api/auth/register` (default role `staff`) |
| Login | ✅ | `POST /api/auth/login` (Passport local strategy) |
| Halaman yang diproteksi | ✅ | Backend: `AuthenticatedGuard` global; Frontend: `middleware/auth.ts` |

**Kenapa session-based (cookie `connect.sid`), bukan JWT?** Singkatnya ini admin
internal, bukan API publik. Jadi nggak ada token yang nyangkut di local storage buat
dicuri, dan server bisa matiin session kapan aja. Session-nya disimpan di PostgreSQL
(`connect-pg-simple`). Detailnya ada di Architecture-Note bagian 3.

### 4.2 Product Management
| Fitur | Status | Di mana |
|-------|--------|---------|
| List product | ✅ | `GET /api/products` |
| Detail product | ✅ | `GET /api/products/:id` + modal detail di frontend |
| Create product | ✅ | `POST /api/products` + modal form |
| Edit product | ✅ | `PATCH /api/products/:id` |
| Soft delete / archive | ✅ | `DELETE /api/products/:id` (isi `deletedAt`), bisa di-restore lagi |

### 4.3 Pengalaman Halaman List
| Fitur | Status | Di mana |
|-------|--------|---------|
| Pagination dari server | ✅ | `?page&limit`, default 20 (`QueryProductsDto`) |
| Search nama / SKU | ✅ | `?search=` (ILIKE nama/SKU), di-debounce 400ms di frontend |
| Filter kategori / status | ✅ | `?categoryId=` & `?isActive=` |
| Sorting (minimal 1 field) | ✅ | `?sortBy=name\|price\|stock\|createdAt&sortOrder=` |
| Loading state | ✅ | Skeleton di `pages/products/index.vue` |
| Empty state | ✅ | `components/ui/StateEmpty.vue` |
| Error state | ✅ | `components/ui/StateError.vue` + tombol retry |

### 4.4 Data Model & Validation
| Poin | Status | Di mana |
|------|--------|---------|
| Schema/model jelas | ✅ | `documentation/DB-Schema.md` + entities + migrations TypeORM |
| Validation di backend | ✅ | DTO `class-validator` (`products/dto/*.ts`) |
| Constraint masuk akal | ✅ | `sku` UNIQUE, `price`/`stock` CHECK ≥ 0, FK `categoryId` |
| Seeder ~100 produk | ✅ | `npm run seed` → 5 kategori, 2 user, **100 produk** (`database/seeds/run-seed.ts`) |

---

## 5. Bagian Khusus Level Lead

### A. Architecture Note → [`documentation/Architecture-Note.md`](./documentation/Architecture-Note.md)
Semua yang diminta udah dibahas:
- ✅ Kenapa pilih **PostgreSQL** (data relasional, butuh constraint, query filter/sort/paginate)
- ✅ Cara nyusun **backend NestJS** (1 module per domain, layering, guard/interceptor/filter global)
- ✅ Cara nyusun **frontend Nuxt 3** (pages/components/composables/services/stores/middleware)
- ✅ Desain **API contract** (bentuk respons, format error, query params) — detail di `API-Contract.md`
- ✅ **Trade-off** karena waktu mepet
- ✅ Rencana scaling **100 → 100.000 produk** (full-text search, cursor pagination, Redis cache, index, read replica)
- ✅ Rencana **RBAC** (dari guard simpel → tabel permission)
- ✅ Rencana **audit logging** (API log udah jadi fondasinya → tinggal catat nilai lama/baru)
- ✅ Apa aja yang **sengaja nggak dibikin** dan alasannya

### B. Production Gaps → ada di bagian **Production Gaps** [`README.md`](./README.md)
Udah dibahas semua kategorinya: **Security** (CSRF, rate limit, HTTPS, secret
management, XSS, security headers), **Performance** (ILIKE→FTS, offset→cursor, caching,
index, pooling), **Logging/Observability** (structured logging, health check, APM),
**Deployment** (Dockerfile prod, K8s, CD), **Testing** (coverage, integration, E2E,
load), dan **Data Migration** (rollback bertahap, backup/restore).

### C. Kualitas Handoff ke Tim → ada di [`README.md`](./README.md)
Semua checklist-nya ada:
- ✅ Langkah setup (DB → backend → frontend)
- ✅ Daftar environment variables (tabel backend & frontend)
- ✅ Cara jalanin migration (`npm run migration:run` / `:revert`)
- ✅ Cara jalanin seeder (`npm run seed`)
- ✅ Cara jalanin test (`npm test` backend; `lint`/`typecheck` frontend)
- ✅ Akun buat testing (ada di tabel bagian 7)
- ✅ Gambaran struktur folder
- ✅ Penjelasan keputusan arsitektur utama

---

## 6. Nice to Have

| Item | Status | Di mana |
|------|--------|---------|
| UI responsive mobile-first | ✅ | Layout & tabel udah responsif |
| Search state nyimpen | ✅ | Filter/search disimpen ke URL query (`useProducts`) |
| Debounced search | ✅ | 400ms |
| Docker / docker-compose | ✅ | `docker-compose.yml` (PostgreSQL + pgAdmin) |
| CI workflow | ✅ | `.github/workflows/ci.yml` (lint, typecheck, test, build buat BE & FE) |
| Role support (admin & staff) | ✅ | `RolesGuard` + `@Roles()`, UI ngikutin role |
| Swagger / OpenAPI | ✅ | `http://localhost:3001/api/docs` |
| Image fallback | ✅ | `components/product/ProductImage.vue` |
| Optimistic UI update | ✅ | `stores/products.ts` (update lokal abis edit/arsip) |

**Bonus di luar daftar:** upload gambar produk langsung dari file (disimpan lokal di
backend `/uploads`, terus disajikan statis) — lihat `apps/backend/src/uploads/` +
form upload di `components/product/ProductForm.vue`. Buat produksi tinggal pindah ke
S3 + CDN, dan itu udah dicatat sebagai gap.

---

## 7. Deliverables & Akun Testing

| Deliverable | Lokasi |
|-------------|--------|
| Frontend app (Nuxt 3) | `apps/frontend` |
| Backend app (NestJS) | `apps/backend` |
| README | `README.md` (+ README tiap app) |
| Architecture note | `documentation/Architecture-Note.md` |
| `.env.example` | root + `apps/backend/.env.example` + `apps/frontend/.env.example` |
| Schema / migrations | `apps/backend/src/database/migrations/` + `DB-Schema.md` |
| Seeder | `apps/backend/src/database/seeds/run-seed.ts` |
| Akun testing | tabel di bawah |

**Akun buat testing:**

| Email | Password | Role |
|-------|----------|------|
| admin@klontong.com | admin123 | admin |
| staff@klontong.com | staff123 | staff |

---

## 8. Penutup

Singkatnya, semua yang **wajib** beres, semua **Nice-to-have** dikerjain, plus bonus
upload gambar. Yang sengaja saya tahan dulu (S3/CDN, email verification, audit log
detail, CD/deploy, real-time) ada alasannya di Architecture-Note bagian 9 dan
Production Gaps. Prinsipnya simpel: satu alur yang beneran jalan, rapi, dan gampang
dikembangin itu lebih penting daripada banyak fitur tapi setengah jadi.
