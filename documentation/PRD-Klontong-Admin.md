# PRD — Klontong Admin System

**Version:** 1.0  
**Author:** Alfan Rlyanto  
**Stack:** Nuxt 3 + NestJS + PostgreSQL  
**Target:** Take-home test Lead Full-Stack Engineer

---

## 1. Overview

Klontong Admin adalah sistem manajemen produk internal untuk toko kelontong yang ingin modernisasi operasionalnya. Sistem ini digunakan oleh staf toko (non-teknis) untuk mengelola katalog produk penjualan online.

Sistem terdiri dari dua aplikasi terpisah:
- **Frontend** — Nuxt 3 (SSR/SPA hybrid)
- **Backend** — NestJS REST API

---

## 2. Goals

- Staf toko dapat mengelola produk (tambah, edit, arsip) dengan mudah
- Admin dapat mengelola user dan akses
- Sistem siap dikembangkan ke skala lebih besar (dari 100 ke 100.000+ produk)
- Kode bersih, terstruktur, dan mudah di-handoff ke engineer lain

---

## 3. Non-Goals (Sengaja Tidak Dibangun)

- Payment / checkout system
- Customer-facing storefront
- Real-time inventory sync dengan kasir fisik
- Push notification
- Mobile app (hanya responsive web)

---

## 4. User Roles

| Role  | Akses |
|-------|-------|
| Admin | Full access: kelola produk, kategori, dan user |
| Staff | Bisa lihat & edit produk, tidak bisa kelola user |

---

## 5. Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Frontend | Nuxt 3 | Requirement wajib |
| State Management | Pinia | Requirement wajib |
| Backend | NestJS | Requirement wajib |
| Database | PostgreSQL | Relational, cocok untuk data produk terstruktur dengan relasi kategori |
| ORM | TypeORM | Native support NestJS, support migrations |
| Auth | Session-based (express-session + Passport.js local strategy) | Lebih simpel untuk admin internal, tidak butuh stateless JWT |
| Containerization | Docker + docker-compose | Kemudahan setup & reproducibility |
| API Docs | Swagger / OpenAPI | Nice to have, nilai tambah |

### Alasan PostgreSQL vs MongoDB

PostgreSQL dipilih karena:
- Data produk bersifat relasional (produk → kategori)
- Perlu constraint seperti SKU unique
- Query kompleks (filter, sort, pagination) lebih optimal dengan SQL
- Lebih mudah untuk audit log dan data integrity

MongoDB lebih cocok jika skema produk sangat dinamis/bervariasi antar toko, yang tidak sesuai dengan kasus ini.

---

## 6. Arsitektur Sistem

```
/apps
  /frontend        ← Nuxt 3
  /backend         ← NestJS
README.md
.env.example
docker-compose.yml
```

### Backend Structure (NestJS)

```
/backend/src
  /auth            ← login, register, session, guards
  /users           ← user management (admin only)
  /products        ← CRUD produk + pagination + filter
  /categories      ← CRUD kategori
  /uploads         ← upload gambar produk (disimpan lokal)
  /api-logs        ← interceptor + query log request API (admin)
  /common          ← decorators, guards, interceptors, pipes
  /database        ← TypeORM config, migrations, seeders
  main.ts
  app.module.ts
```

### Frontend Structure (Nuxt 3)

```
/frontend
  /pages
    /auth          ← login.vue, register.vue
    /products      ← index.vue, [id].vue, create.vue, [id]/edit.vue
    /users         ← index.vue (admin only)
  /components
    /product       ← ProductCard, ProductForm, ProductTable
    /ui            ← BaseButton, BaseInput, BasePagination, etc.
  /composables     ← useProducts, useAuth, useCategories
  /stores          ← auth.ts, products.ts
  /services        ← api.ts (axios wrapper), product.service.ts
  /middleware      ← auth.ts (route guard)
```

---

## 7. API Contract

### Base URL
```
http://localhost:3001/api
```

### Auth

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /auth/register | Register user baru | Public |
| POST | /auth/login | Login | Public |
| POST | /auth/logout | Logout | Required |
| GET | /auth/me | Get current user | Required |

### Products

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /products | List produk (pagination, filter, sort, search) | Required |
| GET | /products/:id | Detail produk | Required |
| POST | /products | Buat produk baru | Admin/Staff |
| PATCH | /products/:id | Edit produk | Admin/Staff |
| DELETE | /products/:id | Soft delete (archive) produk | Admin |
| PATCH | /products/:id/restore | Pulihkan produk yang diarsipkan | Admin |
| DELETE | /products/:id/permanent | Hapus permanen (harus sudah diarsipkan) | Admin |

**Query params GET /products:**
```
?page=1&limit=20&search=ciki&categoryId=2&isActive=true&sortBy=name&sortOrder=asc
```

**Response envelope:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Uploads

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | /uploads/image | Upload gambar produk (multipart `file`), simpan lokal | Required |

Response: `{ "data": { "url": "http://localhost:3001/uploads/<file>", "filename": "<file>" } }`.
File dilayani statis di `/uploads/<filename>`. Maks 5MB, format JPG/PNG/WEBP/GIF.

### Categories

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /categories | List semua kategori | Required |
| POST | /categories | Buat kategori | Admin |
| PATCH | /categories/:id | Ubah nama kategori | Admin |
| DELETE | /categories/:id | Hapus kategori | Admin |

### Users (Admin only)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /users | List semua user | Admin |
| POST | /users | Buat user baru | Admin |
| PATCH | /users/:id | Update user (role & status aktif) | Admin |
| DELETE | /users/:id | Hapus user | Admin |

### API Logs (Admin only)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | /logs | List log request API (pagination + filter) | Admin |

Semua request yang masuk dicatat otomatis ke tabel `api_logs` lewat interceptor
global (method, path, status, durasi, IP, user, request body; field sensitif seperti
password dihapus dulu sebelum disimpan). Ini sekaligus jadi fondasi untuk audit
logging penuh nanti (lihat bagian 15).

---

## 8. Data Model

### User
```
id          UUID (PK)
email       VARCHAR UNIQUE NOT NULL
password    VARCHAR (bcrypt hashed)
name        VARCHAR
role        ENUM('admin', 'staff') DEFAULT 'staff'
isActive    BOOLEAN DEFAULT true
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### Category
```
id          SERIAL (PK)
name        VARCHAR UNIQUE NOT NULL
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### Product
```
id            SERIAL (PK)
categoryId    FK → categories.id
sku           VARCHAR(20) UNIQUE NOT NULL
name          VARCHAR NOT NULL
description   TEXT
weight        INTEGER (gram)
width         FLOAT (cm)
length        FLOAT (cm)
height        FLOAT (cm)
image         VARCHAR (URL)
price         INTEGER (IDR, no decimal)
isActive      BOOLEAN DEFAULT true
stock         INTEGER DEFAULT 0
deletedAt     TIMESTAMP NULL (soft delete)
createdAt     TIMESTAMP
updatedAt     TIMESTAMP
```

---

## 9. Fitur — Detail Per Halaman

### 9.1 Auth Pages

**Login (/auth/login)**
- Form: email + password
- Redirect ke /products setelah berhasil
- Error message jika gagal

**Register (/auth/register)**
- Form: name, email, password, confirm password
- Default role: staff
- Redirect ke login setelah berhasil

### 9.2 Product List (/products)

- Tabel produk dengan kolom: SKU, Nama, Kategori, Harga, Stok, Status, Aksi
- Server-side pagination (default 20 per halaman)
- Search bar (nama atau SKU) — debounced 400ms
- Filter: kategori (dropdown), status aktif (toggle/select)
- Sorting: klik header kolom (nama, harga, stok)
- Loading skeleton saat fetch
- Empty state dengan ilustrasi jika tidak ada produk
- Error state dengan tombol retry
- Tombol "Tambah Produk" (admin & staff)
- Tombol "Arsip" dan "Edit" per row (admin & staff)
- Search state persist di URL query params

### 9.3 Product Detail (/products/:id)

- Tampilkan semua field produk
- Tombol Edit dan Arsip
- Image dengan fallback jika URL error

### 9.4 Create Product (/products/create)

- Form lengkap semua field
- Validasi frontend (required, format, range)
- SKU bisa di-generate otomatis atau manual
- Upload gambar dari file (disimpan lokal di backend, preview langsung)
- Submit → redirect ke list dengan notifikasi sukses

### 9.5 Edit Product (/products/:id/edit)

- Pre-filled form dari data existing
- Optimistic UI update (opsional)
- Submit → redirect ke detail atau list

### 9.6 Soft Delete / Archive

- Konfirmasi dialog sebelum arsip
- Produk yang diarsip masih bisa dilihat dengan filter "isActive: false"
- Tidak dihapus dari database (deletedAt diset)

---

## 10. Validation Rules (Backend)

| Field | Rule |
|-------|------|
| sku | Required, unique, max 20 char, alphanumeric |
| name | Required, min 2, max 100 char |
| price | Required, integer, min 0 |
| stock | Required, integer, min 0 |
| weight | Optional, integer, min 0 |
| categoryId | Required, must exist |
| image | Optional, valid URL format |

---

## 11. Seeder

- 5 kategori: Snacks, Minuman, Sembako, Kebersihan, Bumbu Dapur
- 100 produk tersebar di 5 kategori
- 2 user default:
  - `admin@klontong.com` / `admin123` — role: admin
  - `staff@klontong.com` / `staff123` — role: staff
- Seeder bulk terpisah (`npm run seed:bulk`, default 1.000.000 produk) untuk uji
  skala pagination/search/filter pada dataset besar

---

## 12. Trade-off Karena Batas Waktu

| Yang Dikompromikan | Penjelasan |
|-------------------|------------|
| Unit test minimal | Hanya contoh 1-2 test, bukan full coverage |
| Image upload | Upload file langsung, disimpan lokal di backend (`/uploads`). Belum pakai object storage / CDN (S3), lihat bagian 13 |
| Audit log | Tidak diimplementasi, hanya didokumentasikan caranya |
| Email verification | Register langsung aktif, tidak perlu verifikasi email |
| Refresh token | Session sederhana tanpa refresh mechanism |
| Rate limiting | Tidak diimplementasi di assignment ini |

---

## 13. Skalabilitas (100 → 100.000 Produk)

- Tambah index di kolom `name`, `sku`, `categoryId`, `deletedAt`
- Implementasi full-text search (PostgreSQL `tsvector` atau Elasticsearch)
- Pagination cursor-based menggantikan offset untuk performa lebih baik
- Redis caching untuk list produk dan kategori
- CDN + object storage (S3) untuk gambar produk
- Read replica PostgreSQL untuk query berat

---

## 14. RBAC — Rencana Pengembangan

Saat ini RBAC sederhana: admin vs staff via guard di NestJS.

Pengembangan selanjutnya:
- Tabel `permissions` dan `role_permissions` di DB
- Guard berbasis permission string (misal: `products:delete`)
- Middleware frontend cek permission dari session/store

---

## 15. Audit Logging — Rencana

- API log (level request, lihat bagian 7) sudah diimplementasi dan jadi fondasinya
- Audit log detail (nilai lama/baru per entity) belum diimplementasi karena batas waktu:
  - Tabel `audit_logs`: userId, action, entity, entityId, oldValue, newValue, createdAt
  - NestJS interceptor yang otomatis log setiap mutasi (POST/PATCH/DELETE)

---

## 16. Production Gaps

### Security
- Password hashing sudah pakai bcrypt
- Session secret harus strong random string di production
- HTTPS wajib di production (tidak dihandle di level app)
- CSRF protection perlu ditambahkan untuk session-based auth
- Input sanitization untuk mencegah XSS
- Rate limiting pada endpoint auth

### Performance
- Tidak ada caching layer (Redis)
- Gambar diupload & disimpan lokal di backend (`/uploads`), belum pakai object storage / CDN (S3)
- Tidak ada connection pooling config eksplisit (TypeORM default)

### Logging / Observability
- Request logging sudah ada (semua request dicatat ke tabel `api_logs` via interceptor global)
- Belum ada structured logging app-level (Winston/Pino)
- Tidak ada APM (Datadog, New Relic)
- Tidak ada health check endpoint

### Deployment
- Docker compose hanya untuk development
- Belum ada Kubernetes / cloud deployment config
- CI sudah ada (GitHub Actions: lint, typecheck, test, build untuk backend & frontend); tahap CD / deploy belum ada
- Secret management belum pakai vault

### Testing
- Unit test minimal
- Tidak ada E2E test (Cypress/Playwright)
- Tidak ada load testing

### Data Migration
- Migration TypeORM ada, tapi belum ada rollback strategy
- Tidak ada data backup strategy