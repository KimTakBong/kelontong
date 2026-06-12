# Architecture Note — Klontong Admin

Author: Alfan Rlyanto
Stack: Nuxt 3 + NestJS + PostgreSQL

---

## 1. Kenapa PostgreSQL?

Data produk di sini saling berhubungan — satu produk pasti punya kategori, dan nanti mungkin nyambung juga ke supplier atau gudang. Dengan PostgreSQL, hubungan ini dijaga langsung oleh database lewat foreign key, bukan cuma dijaga di kode (yang lebih gampang ada bug).

Query yang dibutuhkan juga cukup terstruktur: pagination, sorting beberapa kolom, filter gabungan (kategori + status + search), dan SKU yang harus unik. Hal-hal kayak gini lebih pas dan lebih cepat dikerjakan pakai SQL dibanding MongoDB.

PostgreSQL juga punya CHECK constraint, jadi harga dan stok dijamin tidak bisa minus walau ada bug di aplikasi. MongoDB tidak punya fitur ini secara bawaan.

MongoDB baru lebih cocok kalau bentuk data produk beda-beda tiap toko (misal tiap toko punya field sendiri). Tapi itu bukan kasus di sini, jadi PostgreSQL lebih tepat.

---

## 2. Struktur Backend (NestJS)

Pakai struktur modular bawaan NestJS. Tiap bagian bisnis jadi satu module sendiri:

```
auth/        — login, register, hak akses
users/       — kelola user
products/    — CRUD produk, pagination, filter
categories/  — kelola kategori
api-logs/    — interceptor dan query log API
database/    — migrations, seeders, config TypeORM
common/      — barang bersama: interceptors, filters, guards, pipes
```

Beberapa keputusan yang sengaja diambil:

- **Controller cuma urus request dan response.** Logika bisnis taruh di Service, query database di Repository. Tujuannya simpel: kalau ada bug lebih gampang dicari, dan kalau mau test Service tidak perlu nyalain server HTTP.
- **Semua input dicek dulu lewat DTO** pakai class-validator sebelum masuk ke Service. ValidationPipe dipasang sekali di main.ts, jadi tidak perlu ditulis ulang di tiap controller.
- **Bentuk response dibungkus otomatis** lewat interceptor global, jadi formatnya selalu sama. Controller tidak perlu bungkus sendiri.
- **Pakai session-based auth** karena ini tool admin internal, bukan API publik. Untungnya: tidak ada token yang bisa dicuri dari localStorage, dan server bisa matiin session kapan saja. Konsekuensinya stateful — kalau nanti mau scaling ke banyak server, session perlu disimpan di Redis biar dipakai bareng.

---

## 3. Struktur Frontend (Nuxt 3)

SSR dimatikan karena ini admin internal: tidak butuh SEO, dan tidak ada crawler yang perlu load cepat. Mode SPA bikin setup dan deploy lebih simpel.

Ada beberapa layer yang sengaja dipisah:

- **Services (`/services`)** — semua panggilan HTTP ada di sini. Komponen dan composable tidak boleh pakai axios langsung, harus lewat service. Jadi kalau API berubah, cukup ubah di satu tempat.
- **Composables (`/composables`)** — logika yang bisa dipakai ulang antar halaman. Contohnya `useProducts` yang ngurus sinkron filter ke URL, debounce search, dan ambil data. Halaman jadi tipis karena tinggal pakai composable.
- **Pinia stores** — cuma buat state yang perlu dipakai bareng antar komponen, seperti user yang login dan filter produk yang aktif. Tidak semua state masuk store; kalau cukup state lokal, pakai `ref` biasa di composable atau halaman.
- **Middleware (`auth.ts`, `admin.ts`)** — jalan sebelum halaman dirender buat jaga route. Lebih aman dibanding cek di `mounted()` yang kadang sempat render dulu baru redirect.

---

## 4. API Log

Semua request yang masuk dicatat otomatis ke tabel `api_logs` lewat interceptor NestJS yang dipasang global. Interceptor-nya jalan setelah response dikirim, jadi tidak nambah waktu tunggu.

Yang dicatat: method, path, status code, lama response, IP, user agent, user ID kalau lagi login, dan isi request buat POST/PATCH (field sensitif seperti password otomatis dibuang sebelum disimpan).

Sengaja tidak pakai foreign key dari `api_logs` ke `users`, supaya log tetap ada walau user-nya nanti dihapus. Kalau butuh nama user pas query, tinggal join manual.

Buat sekarang datanya masih sedikit, jadi simpan log di PostgreSQL sudah cukup. Kalau nanti traffic ramai dan tabel makin besar, opsinya: bagi tabel per bulan, tambah aturan hapus log lama, atau pindah ke tool logging khusus seperti ELK.

---

## 5. API Contract

Semua endpoint pakai aturan yang sama biar frontend tidak perlu nebak format response:

- Response selalu `{ data }` untuk satu objek, dan `{ data, meta }` untuk list yang pakai pagination. Error selalu `{ error: { code, message, details? } }`.
- HTTP status code dipakai sesuai artinya: 201 buat create, 409 buat bentrok seperti SKU dobel, 403 buat akses ditolak. Soft delete pakai endpoint DELETE, bukan PATCH isActive, biar maksudnya lebih jelas.
- Aturan ini juga ada di Swagger yang otomatis dibikin dari decorator NestJS, bisa dibuka di `/api/docs` saat development.

---

## 6. Dari 100 ke 100.000 Produk

**Di database:** langkah pertama tambah composite index di kolom yang sering dipakai barengan buat filter: `(category_id, is_active, deleted_at)`. Buat search nama dan SKU, ganti ILIKE dengan full-text search PostgreSQL (`tsvector`), karena ILIKE tidak bisa pakai index. Pagination juga diganti dari offset-based ke cursor-based biar tetap cepat walau data sudah banyak.

**Di aplikasi:** tambah Redis buat cache list produk dan kategori, TTL sekitar 5 menit. Cache dihapus tiap ada create, update, atau delete produk.

**Di infrastruktur:** bisa tambah read replica PostgreSQL buat nampung query GET yang biasanya lebih banyak dari write. Kalau backend perlu di-scale ke banyak server, session harus pindah ke Redis biar tidak hilang waktu request masuk ke server yang beda.

---

## 7. Rencana RBAC yang Lebih Detail

Sekarang RBAC masih sederhana: dua role (admin dan staff) yang dicek lewat guard di NestJS. Kalau nanti butuh kontrol lebih detail, ini arahnya:

Tambah dua tabel baru:

```sql
permissions (id, name, description)
  contoh nama: products:create, products:delete, users:manage

role_permissions (role, permission_id)
```

Guard diubah dari cek role jadi cek permission:

```typescript
@RequirePermission('products:delete')
@Delete(':id')
archive() { ... }
```

Di frontend, daftar permission dikirim dari `GET /auth/me` lalu disimpan di store. Tombol dan menu ditampilkan berdasarkan permission, bukan role langsung.

---

## 8. Rencana Audit Log

API log yang sudah ada mencatat semua request masuk, tapi belum mencatat perubahan data secara detail (nilai sebelum dan sesudah). Kalau nanti butuh audit trail yang lengkap, ini bentuknya:

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(20),     -- CREATE, UPDATE, DELETE
  entity VARCHAR(50),     -- products, users, categories
  entity_id VARCHAR(50),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

Cara bikinnya lewat AuditInterceptor yang nangkap semua request yang mengubah data (POST, PATCH, DELETE), lalu catat perubahannya ke tabel ini setelah response sukses. Strukturnya sudah dipikirkan dari awal, jadi nanti tinggal nambah tanpa ubah-ubah besar.

---

## 9. Yang Sengaja Tidak Dibangun

| Fitur | Alasan |
|-------|--------|
| Object storage / CDN untuk gambar | Upload gambar **sudah** ada (disimpan lokal di `/uploads`), tapi S3 + CDN buat produksi di luar scope |
| Email verification | Admin internal, tidak penting-penting amat |
| Forgot password | Di luar scope |
| Audit log detail (old/new value) | API log sudah cukup buat scope ini; audit log penuh butuh waktu ekstra |
| Unit dan E2E test | Fokus dulu ke alur utama yang jalan |
| CD / deployment pipeline | CI (lint/typecheck/test/build) sudah ada lewat GitHub Actions; tahap deploy belum |
| Real-time update | Tidak dibutuhkan buat admin sederhana |