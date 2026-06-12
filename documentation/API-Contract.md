# API Contract — Klontong Admin

**Base URL:** `http://localhost:3001/api`  
**Format:** JSON (Content-Type: application/json)  
**Auth:** Session-based (cookie `connect.sid`)  
**Semua request yang butuh auth harus include `withCredentials: true`**

---

## Response Envelope

### Sukses — Single Object
```json
{
  "data": { ...object }
}
```

### Sukses — List dengan Pagination
```json
{
  "data": [ ...array ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": [
      { "field": "sku", "message": "SKU sudah digunakan" }
    ]
  }
}
```

---

## HTTP Status Codes

| Code | Kondisi |
|------|---------|
| 200 | OK — GET, PATCH, DELETE berhasil |
| 201 | Created — POST berhasil |
| 400 | Bad Request — validasi gagal |
| 401 | Unauthorized — belum login / session expired |
| 403 | Forbidden — role tidak punya akses |
| 404 | Not Found — resource tidak ditemukan |
| 409 | Conflict — data duplikat (misal SKU sudah ada) |
| 500 | Internal Server Error |

---

## Auth Endpoints

### POST /auth/register
Daftarkan user baru. Role default: staff.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Validation:**
- `name`: required, string, max 100
- `email`: required, valid email, unique
- `password`: required, min 6 char
- `confirmPassword`: required, harus sama dengan password

**Response 201:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response 409:**
```json
{
  "error": {
    "code": 409,
    "message": "Email sudah terdaftar"
  }
}
```

---

### POST /auth/login
Login dan buat session. Cookie `connect.sid` di-set otomatis.

**Request:**
```json
{
  "email": "admin@klontong.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin Klontong",
    "email": "admin@klontong.com",
    "role": "admin",
    "isActive": true
  }
}
```

**Response 401:**
```json
{
  "error": {
    "code": 401,
    "message": "Email atau password salah"
  }
}
```

---

### POST /auth/logout
Hapus session. Tidak butuh request body.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET /auth/me
Ambil data user dari session aktif.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin Klontong",
    "email": "admin@klontong.com",
    "role": "admin",
    "isActive": true
  }
}
```

**Response 401:**
```json
{
  "error": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

---

## Category Endpoints

### GET /categories
Ambil semua kategori. Dipakai untuk dropdown filter & form produk.

**Auth:** Required

**Response 200:**
```json
{
  "data": [
    { "id": 1, "name": "Snacks" },
    { "id": 2, "name": "Minuman" },
    { "id": 3, "name": "Sembako" },
    { "id": 4, "name": "Kebersihan" },
    { "id": 5, "name": "Bumbu Dapur" }
  ]
}
```

---

### POST /categories
Tambah kategori baru.

**Auth:** Required — Admin only

**Request:**
```json
{
  "name": "Alat Tulis"
}
```

**Validation:**
- `name`: required, string, max 100, unique

**Response 201:**
```json
{
  "data": {
    "id": 6,
    "name": "Alat Tulis",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Product Endpoints

### GET /products
Ambil list produk dengan pagination, search, filter, dan sorting.

**Auth:** Required

**Query Parameters:**

| Param | Type | Default | Deskripsi |
|-------|------|---------|-----------|
| page | integer | 1 | Halaman saat ini |
| limit | integer | 20 | Jumlah per halaman (max 100) |
| search | string | - | Cari berdasarkan nama atau SKU (case-insensitive) |
| categoryId | integer | - | Filter berdasarkan kategori |
| isActive | boolean | - | Filter berdasarkan status (true/false) |
| sortBy | string | createdAt | Field untuk sorting: name, price, stock, createdAt |
| sortOrder | string | desc | Arah sort: asc, desc |

**Contoh Request:**
```
GET /api/products?page=1&limit=20&search=ciki&categoryId=1&isActive=true&sortBy=name&sortOrder=asc
```

**Response 200:**
```json
{
  "data": [
    {
      "id": 86,
      "categoryId": 1,
      "categoryName": "Snacks",
      "sku": "MHZVTK",
      "name": "Ciki Ciki",
      "description": "A popular snack sold by our store",
      "weight": 500,
      "width": 5,
      "length": 5,
      "height": 5,
      "image": "https://example.com/image.jpg",
      "price": 30000,
      "isActive": true,
      "stock": 120,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### GET /products/:id
Ambil detail satu produk berdasarkan ID.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "id": 86,
    "categoryId": 1,
    "categoryName": "Snacks",
    "sku": "MHZVTK",
    "name": "Ciki Ciki",
    "description": "A popular snack sold by our store",
    "weight": 500,
    "width": 5,
    "length": 5,
    "height": 5,
    "image": "https://example.com/image.jpg",
    "price": 30000,
    "isActive": true,
    "stock": 120,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response 404:**
```json
{
  "error": {
    "code": 404,
    "message": "Produk tidak ditemukan"
  }
}
```

---

### POST /products
Tambah produk baru.

**Auth:** Required — Admin & Staff

**Request:**
```json
{
  "categoryId": 1,
  "sku": "MHZVTK",
  "name": "Ciki Ciki",
  "description": "A popular snack sold by our store",
  "weight": 500,
  "width": 5,
  "length": 5,
  "height": 5,
  "image": "https://example.com/image.jpg",
  "price": 30000,
  "stock": 120
}
```

**Validation:**

| Field | Rule |
|-------|------|
| categoryId | Required, integer, must exist |
| sku | Required, string, max 20, alphanumeric uppercase, unique |
| name | Required, string, min 2, max 100 |
| description | Optional, string, max 1000 |
| weight | Optional, integer, min 0 |
| width | Optional, number, min 0 |
| length | Optional, number, min 0 |
| height | Optional, number, min 0 |
| image | Optional, valid URL |
| price | Required, integer, min 0 |
| stock | Required, integer, min 0 |

**Response 201:**
```json
{
  "data": {
    "id": 101,
    "categoryId": 1,
    "categoryName": "Snacks",
    "sku": "MHZVTK",
    "name": "Ciki Ciki",
    "description": "A popular snack sold by our store",
    "weight": 500,
    "width": 5,
    "length": 5,
    "height": 5,
    "image": "https://example.com/image.jpg",
    "price": 30000,
    "isActive": true,
    "stock": 120,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response 400 (validasi gagal):**
```json
{
  "error": {
    "code": 400,
    "message": "Validation failed",
    "details": [
      { "field": "sku", "message": "SKU hanya boleh huruf kapital dan angka" },
      { "field": "price", "message": "Harga harus berupa angka positif" }
    ]
  }
}
```

**Response 409 (SKU duplikat):**
```json
{
  "error": {
    "code": 409,
    "message": "SKU sudah digunakan"
  }
}
```

---

### PATCH /products/:id
Update data produk. Semua field bersifat optional (partial update).

**Auth:** Required — Admin & Staff

**Request:** (semua field optional)
```json
{
  "name": "Ciki Ciki Pedas",
  "price": 35000,
  "stock": 80,
  "isActive": true
}
```

**Response 200:** object produk lengkap (sama dengan GET /products/:id)

**Response 404:** produk tidak ditemukan  
**Response 409:** SKU baru sudah dipakai produk lain

---

### DELETE /products/:id
Soft delete / arsip produk. Set `deletedAt = now()`, tidak dihapus dari DB.

**Auth:** Required — Admin only

**Response 200:**
```json
{
  "data": {
    "message": "Produk berhasil diarsipkan"
  }
}
```

**Response 403:**
```json
{
  "error": {
    "code": 403,
    "message": "Hanya admin yang dapat mengarsipkan produk"
  }
}
```

---

## User Endpoints (Admin Only)

### GET /users
Ambil semua user terdaftar.

**Auth:** Required — Admin only

**Response 200:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin Klontong",
      "email": "admin@klontong.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Staff Toko",
      "email": "staff@klontong.com",
      "role": "staff",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

---

### PATCH /users/:id
Update role atau status aktif user.

**Auth:** Required — Admin only

**Request:**
```json
{
  "role": "admin",
  "isActive": false
}
```

**Validation:**
- `role`: optional, enum: admin | staff
- `isActive`: optional, boolean

**Response 200:**
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Staff Toko",
    "email": "staff@klontong.com",
    "role": "admin",
    "isActive": false
  }
}
```

---

## Log Endpoints (Admin Only)

Semua endpoint di sini hanya bisa diakses oleh admin. Dipakai untuk lihat history request yang masuk ke API.

### GET /logs

Ambil list API log dengan pagination dan filter.

Auth: Required, Admin only

Query params yang tersedia:

| Param | Tipe | Default | Keterangan |
|-------|------|---------|------------|
| page | integer | 1 | Halaman aktif |
| limit | integer | 20 | Jumlah per halaman, max 100 |
| path | string | kosong | Filter partial path, contoh: /products |
| statusCode | integer | kosong | Filter exact status code, contoh: 404 |
| userId | uuid | kosong | Filter by user tertentu |
| startDate | string | kosong | Format ISO 8601, contoh: 2025-01-01T00:00:00Z |
| endDate | string | kosong | Format ISO 8601, contoh: 2025-01-31T23:59:59Z |

Contoh request:
```
GET /api/logs?page=1&limit=20&statusCode=500&startDate=2025-01-01T00:00:00Z
```

Response 200:
```json
{
  "data": [
    {
      "id": 1,
      "method": "POST",
      "path": "/api/auth/login",
      "statusCode": 200,
      "duration": 134,
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0 ...",
      "userId": null,
      "requestBody": null,
      "createdAt": "2025-01-01T08:00:00.000Z"
    },
    {
      "id": 2,
      "method": "PATCH",
      "path": "/api/products/86",
      "statusCode": 200,
      "duration": 89,
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0 ...",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "requestBody": { "price": 35000 },
      "createdAt": "2025-01-01T08:05:22.000Z"
    }
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

Catatan: field `requestBody` hanya terisi untuk request POST dan PATCH. Field sensitif seperti password sudah otomatis dihapus sebelum disimpan.

Response 403 kalau diakses oleh role staff:
```json
{
  "error": {
    "code": 403,
    "message": "Hanya admin yang dapat mengakses log"
  }
}
```

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@klontong.com | admin123 | admin |
| staff@klontong.com | staff123 | staff |

---

## CORS Config

Backend di-setup untuk accept request dari `http://localhost:3000` dengan credentials:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
})
```
