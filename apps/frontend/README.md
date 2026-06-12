# Klontong Admin — Frontend (Nuxt 3)

Admin internal untuk mengelola katalog produk toko klontong. Dibangun dengan
Nuxt 3 (SPA), Pinia, dan service layer berbasis axios.

## Setup

```bash
npm install
cp .env.example .env   # sesuaikan NUXT_PUBLIC_API_BASE_URL bila perlu
npm run dev            # http://localhost:3000
```

Backend NestJS harus berjalan di `http://localhost:3001/api` (lihat `.env`).

## Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Build produksi |
| `npm run preview` | Preview hasil build |
| `npm run typecheck` | Type-check dengan vue-tsc |

## Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `NUXT_PUBLIC_API_BASE_URL` | `http://localhost:3001/api` | Base URL backend |

## Struktur

```
types/         Tipe domain (Product, User, envelope API)
services/      HTTP layer — satu-satunya tempat memanggil axios
  api.ts         Instance axios + normalisasi error + redirect 401
  *.service.ts   Pemetaan 1:1 ke endpoint backend
stores/        Pinia — state yang di-share (auth, products)
composables/   Logic reusable (useProducts: sync URL + debounce search, dll)
components/
  ui/            Komponen dasar (BaseButton, BaseInput, BasePagination, ...)
  product/       Komponen domain (ProductTable, ProductForm, ...)
middleware/    Route guard (auth, admin)
layouts/       default (app shell) & auth (login/register)
pages/         Routing berbasis file
plugins/       auth.client.ts — restore session saat startup
```

## Keputusan Arsitektur Utama

- **SPA (ssr: false)** — admin internal, tidak butuh SEO. Setup & deploy lebih sederhana.
- **Service layer** — komponen/composable tidak pernah memanggil axios langsung.
  Bila kontrak API berubah, cukup ubah di satu tempat.
- **Session-based auth** — axios memakai `withCredentials: true`; cookie `connect.sid`
  dikirim otomatis. Interceptor 401 membersihkan store & redirect ke login.
- **Filter di URL** — `useProducts` menyinkronkan search/filter/sort/pagination ke
  query params, jadi state persist saat refresh dan bisa dibagikan.
- **Guard via middleware**, bukan cek di `mounted()`, supaya halaman terproteksi
  tidak sempat ter-render sebelum redirect.

Lihat `documentation/Architecture-Note.md` untuk pembahasan lengkap.
