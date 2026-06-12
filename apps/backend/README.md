# Klontong Admin — Backend (NestJS)

REST API untuk manajemen produk toko klontong. NestJS + TypeORM + PostgreSQL,
auth berbasis session (Passport local).

## Setup

```bash
npm install
cp .env.example .env        # sesuaikan kredensial DB
npm run migration:run       # buat skema
npm run seed                # isi 5 kategori, 2 user, 100 produk
npm run start:dev           # http://localhost:3001/api
```

> Database `klontong_admin` harus sudah ada sebelum migration. Lihat README root
> untuk cara membuatnya (docker-compose atau manual).

## Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run start:dev` | Dev server (watch) |
| `npm run build` / `npm run start:prod` | Build & jalankan hasil build |
| `npm run migration:run` / `migration:revert` | Apply / rollback migration |
| `npm run seed` | Seed data (idempotent — truncate lalu isi ulang) |
| `npm test` | Unit test (Jest) |
| `npm run typecheck` | `tsc --noEmit` |

## Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | 3001 | Port server |
| `NODE_ENV` | development | `production` mengaktifkan secure cookie |
| `FRONTEND_URL` | http://localhost:3000 | Origin yang diizinkan CORS (credentials) |
| `DB_HOST` / `DB_PORT` | localhost / 5432 | Koneksi PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | postgres / postgres123 | Kredensial DB |
| `DB_NAME` | klontong_admin | Nama database |
| `SESSION_SECRET` | — | **Wajib kuat di production** |
| `SESSION_MAX_AGE` | 86400000 | Umur cookie session (ms) |

## Struktur

```
src/
  auth/          login/register/logout/me, passport local, session serializer
  users/         manajemen user (admin only)
  products/      CRUD + pagination/filter/search/sort + soft delete
  categories/    list + create kategori
  api-logs/      interceptor pencatat request + endpoint query log (admin)
  common/        guards, decorators, interceptor envelope, exception filter, DTO
  database/      data-source, migrations/, seeds/
  main.ts        bootstrap: session, passport, CORS, validation, Swagger
  app.module.ts  wiring + global guards/interceptors/filter
```

## Pola Arsitektur

- **Controller → Service → Repository.** Controller hanya I/O HTTP; logic di Service.
- **Validasi via DTO + class-validator**, `ValidationPipe` global di `main.ts`.
  Error divalidasi jadi `{ error: { code, message, details[] } }`.
- **Response envelope otomatis** lewat `ResponseInterceptor` global: `{ data }`
  untuk objek, `{ data, meta }` untuk list. Controller tidak wrap manual.
- **RBAC** lewat global `AuthenticatedGuard` + `RolesGuard` dengan `@Roles('admin')`
  dan `@Public()` untuk opt-out (login/register).
- **API log** lewat interceptor global yang menulis setelah response terkirim
  (pakai `finalize`), jadi tidak menambah latency. Password discrub sebelum disimpan.

Detail keputusan: lihat `documentation/Architecture-Note.md`.

## Swagger

Tersedia di `http://localhost:3001/api/docs` saat server berjalan.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@klontong.com | admin123 | admin |
| staff@klontong.com | staff123 | staff |
