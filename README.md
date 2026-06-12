# Klontong Admin

Sistem manajemen produk internal untuk toko klontong. Staf toko (non-teknis)
mengelola katalog produk; admin mengelola produk, kategori, dan user.

**Stack:** Nuxt 3 + Pinia (frontend) · NestJS + TypeORM (backend) · PostgreSQL ·
session-based auth.

> Dokumen perancangan lengkap ada di [`documentation/`](./documentation):
> PRD, API Contract, DB Schema, dan **Architecture Note** (alasan PostgreSQL,
> struktur backend/frontend, desain API, skalabilitas 100→100.000 produk,
> rencana RBAC & audit logging, dan yang sengaja tidak dibangun).

---

## Struktur Project

```
/apps
  /frontend        Nuxt 3 (SPA) — pages, components, composables, services, stores
  /backend         NestJS — auth, users, products, categories, api-logs
/documentation     PRD, API Contract, Architecture Note, DB Schema
docker-compose.yml PostgreSQL + pgAdmin untuk development
.env.example       env untuk docker-compose
README.md
```

Detail tiap app ada di README masing-masing:
[apps/frontend/README.md](./apps/frontend/README.md) ·
[apps/backend/README.md](./apps/backend/README.md).

---

## Setup
Prasyarat: Node.js 20+, dan PostgreSQL (lewat Docker atau instalasi lokal).

### 1. Database

**Opsi A — Docker:**
```bash
cp .env.example .env
docker compose up -d         # postgres di :5432, pgAdmin di :5050
```
Database `klontong_admin` otomatis dibuat oleh container.

**Opsi B — PostgreSQL lokal:**
```bash
createdb klontong_admin
# atau: psql -U postgres -c "CREATE DATABASE klontong_admin"
```

### 2. Backend

```bash
cd apps/backend
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

### 3. Frontend

```bash
cd apps/frontend
npm install
cp .env.example .env
npm run dev
```

Buka http://localhost:3000 dan login dengan akun di bawah.

---

## Environment Variables

**Backend** (`apps/backend/.env`) — lihat detail di README backend:

| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | 3001 | Port API |
| `NODE_ENV` | development | `production` → secure cookie |
| `FRONTEND_URL` | http://localhost:3000 | Origin CORS (credentials) |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` | localhost 5432 postgres postgres123 klontong_admin | Koneksi DB |
| `SESSION_SECRET` | — | **Wajib random kuat di production** |
| `SESSION_MAX_AGE` | 86400000 | Umur session (ms) |

**Frontend** (`apps/frontend/.env`):

| Variable | Default |
|----------|---------|
| `NUXT_PUBLIC_API_BASE_URL` | http://localhost:3001/api |

---

## Migration, Seeder, Test

```bash
# di apps/backend
npm run migration:run
npm run migration:revert
npm run seed
npm run seed:bulk
npm run seed:bulk -- 50000
npm test

# di apps/frontend
npm run typecheck
```

---

## Akun Testing

| Email | Password | Role | Akses |
|-------|----------|------|-------|
| admin@klontong.com | admin123 | admin | Penuh: produk, kategori, user, arsip, log |
| staff@klontong.com | staff123 | staff | Lihat & edit produk |

---

## Keputusan Arsitektur Utama

- **PostgreSQL**, bukan MongoDB — data relasional (produk → kategori), butuh
  constraint (SKU unique, harga/stok ≥ 0 via CHECK), dan query filter/sort/
  pagination yang lebih natural di SQL.
- **Session-based auth** (cookie `connect.sid`), bukan JWT — ini admin internal,
  bukan API publik. Tidak ada token yang bisa dicuri dari localStorage, dan
  server bisa invalidate session kapan saja.
- **Backend modular** (Controller → Service → Repository), validasi via DTO,
  response envelope & error format konsisten lewat interceptor/filter global.
- **Frontend SPA** dengan service layer (semua HTTP lewat `/services`), composable
  (`useProducts` sync filter ke URL + debounce), dan route middleware untuk guard.
- **API log** otomatis lewat interceptor global (catat method/path/status/durasi/
  user, scrub password) — fondasi untuk audit logging penuh nanti.

Pembahasan penuh: [`documentation/Architecture-Note.md`](./documentation/Architecture-Note.md).

---

## Fitur

- **Auth**: register (default staff), login, logout, protected routes.
- **Produk**: list (server-side pagination, search nama/SKU debounced, filter
  kategori + status, sorting kolom), detail, create, edit, soft delete (arsip).
  Upload gambar (disimpan lokal di backend), loading skeleton, empty state,
  error+retry, image fallback.
- **Kategori**: list (dropdown filter & form), create (admin).
- **User** (admin): list, ubah role & status.
- **API log** (admin): query log request dengan filter & pagination.
- **Swagger** di `/api/docs`, **role support** admin/staff, **search persist di URL**.

---

## Production Gaps


### Security
- **CSRF**: auth berbasis cookie session rawan CSRF. Production perlu CSRF token
  (mis. `csurf`/double-submit) dan `SameSite=strict`.
- **Rate limiting**: endpoint auth (`/auth/login`) belum dibatasi — rawan brute
  force. Tambahkan `@nestjs/throttler` atau rate limit di gateway/Nginx.
- **HTTPS & secure cookie**: `secure: true` sudah aktif saat `NODE_ENV=production`.
- **Secret management**: `SESSION_SECRET` & kredensial DB masih dari `.env`.
  Production sebaiknya pakai vault/secret manager, bukan file.
- **Input sanitization / XSS**: validasi sudah ketat via DTO; untuk konten yang
  dirender perlu sanitization tambahan bila ada field rich-text.
- **Security headers**: tambahkan `helmet`.

### Performance
- **Search pakai ILIKE** — tidak bisa pakai index pada skala besar. Ganti ke
  PostgreSQL full-text (`tsvector`) atau Elasticsearch di 100.000+ produk.
- **Pagination offset-based** — makin dalam halaman makin lambat. Ganti ke
  cursor-based untuk dataset besar.
- **Belum ada caching** — list produk/kategori bisa di-cache di Redis (TTL ~5 menit,
  invalidate saat mutasi).
- **Composite index** `(category_id, is_active, deleted_at)` untuk filter kombinasi.
- **Connection pooling** masih default TypeORM; perlu tuning eksplisit.

### Logging / Observability
- API log disimpan di PostgreSQL — cukup untuk sekarang. Skala besar: partisi
  tabel per bulan + retention policy, atau pindah ke ELK/Loki.
- Belum ada **structured logging** (Pino/Winston), **health check** endpoint,
  atau **APM** (Datadog/New Relic/OpenTelemetry).

### Deployment
- `docker-compose.yml` hanya untuk **development** (DB saja). Belum ada Dockerfile
  produksi untuk app, manifest Kubernetes, atau konfigurasi multi-stage build.
- **CI** sudah ada.
- **CD/deploy** belum ada.

### Testing
- Unit test minimal (contoh `AuthService`). Belum ada coverage menyeluruh untuk
  Service/Controller, **integration test** (Supertest), maupun **E2E** frontend
  (Playwright/Cypress) dan **load testing**.

### Data Migration
- Migration TypeORM tersedia & berurutan, tapi belum ada **strategi rollback
  bertahap** untuk perubahan destruktif (mis. drop kolom) atau **backup/restore**
  otomatis. Production perlu backup terjadwal + uji restore.

---

## Yang Sengaja Tidak Dibangun

Object storage/CDN untuk gambar (upload gambar sudah ada, disimpan lokal di
`/uploads`; S3 + CDN di luar scope), email verification, forgot password,
audit log detail old/new value (API log sudah jadi fondasinya), CD/deploy
(CI sudah ada), dan real-time update. Alasan lengkap di Architecture Note §9. Prinsipnya: **satu
vertical slice yang berjalan & bisa di-extend** lebih baik daripada banyak fitur
setengah jadi.
