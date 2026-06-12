# DB Schema — Klontong Admin

**Database:** PostgreSQL  
**ORM:** TypeORM  
**Naming Convention:** snake_case untuk kolom & tabel

---

## ERD (Text)

```
users
  └── api_logs (1 user bisa punya banyak log, nullable karena guest juga dicatat)

categories
  └── products (1 kategori → banyak produk)

api_logs
  (berdiri sendiri, tidak ada FK constraint ke users supaya log tetap ada meski user dihapus)
```

---

## Tabel: users

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| name | VARCHAR(100) | NOT NULL | Nama lengkap user |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email untuk login |
| password | VARCHAR(255) | NOT NULL | Bcrypt hash |
| role | VARCHAR(10) | NOT NULL, DEFAULT 'staff' | 'admin' atau 'staff' |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Status aktif user |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu dibuat |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu diupdate |

**Index:**
- UNIQUE INDEX pada `email`

**SQL:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
```

**TypeORM Entity:**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ 
    type: 'varchar', 
    length: 10, 
    default: 'staff',
    enum: ['admin', 'staff']
  })
  role: 'admin' | 'staff';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## Tabel: categories

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | SERIAL | PK | Auto-increment |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Nama kategori |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu dibuat |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu diupdate |

**SQL:**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_categories_name ON categories(name);
```

**TypeORM Entity:**
```typescript
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  name: string;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## Tabel: products

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | SERIAL | PK | Auto-increment |
| category_id | INTEGER | NOT NULL, FK → categories.id | Relasi ke kategori |
| sku | VARCHAR(20) | NOT NULL, UNIQUE | Stock Keeping Unit |
| name | VARCHAR(100) | NOT NULL | Nama produk |
| description | TEXT | NULLABLE | Deskripsi produk |
| weight | INTEGER | NULLABLE | Berat dalam gram |
| width | NUMERIC(8,2) | NULLABLE | Lebar dalam cm |
| length | NUMERIC(8,2) | NULLABLE | Panjang dalam cm |
| height | NUMERIC(8,2) | NULLABLE | Tinggi dalam cm |
| image | VARCHAR(500) | NULLABLE | URL gambar produk |
| price | INTEGER | NOT NULL, DEFAULT 0 | Harga dalam IDR (tanpa desimal) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Status aktif produk |
| stock | INTEGER | NOT NULL, DEFAULT 0 | Jumlah stok |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu dibuat |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu diupdate |

**Index:**
- UNIQUE INDEX pada `sku`
- INDEX pada `category_id` (foreign key)
- INDEX pada `name` (untuk search ILIKE)
- INDEX pada `is_active`
- INDEX pada `deleted_at` (filter soft delete)
- INDEX pada `created_at` (untuk default sort)

**SQL:**
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  sku VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weight INTEGER CHECK (weight >= 0),
  width NUMERIC(8,2) CHECK (width >= 0),
  length NUMERIC(8,2) CHECK (length >= 0),
  height NUMERIC(8,2) CHECK (height >= 0),
  image VARCHAR(500),
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_created_at ON products(created_at);
```

**TypeORM Entity:**
```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, category => category.products, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ unique: true, length: 20 })
  sku: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'integer', nullable: true })
  weight: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  width: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  length: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  height: number;

  @Column({ length: 500, nullable: true })
  image: string;

  @Column({ type: 'integer', default: 0 })
  price: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

> **Catatan:** `@DeleteDateColumn` di TypeORM otomatis handle soft delete. Saat `softDelete()` dipanggil, TypeORM set `deleted_at = now()`. Query default otomatis exclude row dengan `deleted_at IS NOT NULL` — tidak perlu filter manual.

---

## Relasi Antar Tabel

```
categories (1) ──────< products (many)
  id                    category_id (FK)
```

**ON DELETE RESTRICT:** Kategori tidak bisa dihapus jika masih ada produk yang menggunakannya.


---

## Tabel: api_logs

Menyimpan semua request yang masuk ke API secara otomatis via interceptor. Tidak ada FK constraint ke tabel users supaya log tetap tersimpan meski user yang bersangkutan dihapus.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | SERIAL | PK | Auto-increment |
| method | VARCHAR(10) | NOT NULL | GET, POST, PATCH, DELETE |
| path | VARCHAR(500) | NOT NULL | Path URL yang dipanggil |
| status_code | INTEGER | NOT NULL | HTTP status code response |
| duration | INTEGER | NOT NULL | Waktu response dalam milidetik |
| ip | VARCHAR(100) | NULLABLE | IP address pemanggil |
| user_agent | VARCHAR(500) | NULLABLE | Browser/client info |
| user_id | UUID | NULLABLE | ID user yang login, null kalau guest |
| request_body | JSONB | NULLABLE | Body request POST/PATCH, field sensitif sudah dihapus |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Waktu request masuk |

Tidak ada kolom `updated_at` karena log tidak pernah diupdate setelah dibuat.

**Index:**
- INDEX pada `created_at DESC` untuk query terbaru lebih cepat
- INDEX pada `user_id` untuk filter per user
- INDEX pada `status_code` untuk filter by status
- INDEX pada `path` untuk filter by path

**SQL:**
```sql
CREATE TABLE api_logs (
  id SERIAL PRIMARY KEY,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  status_code INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  ip VARCHAR(100),
  user_agent VARCHAR(500),
  user_id UUID,
  request_body JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_path ON api_logs(path);
```

**TypeORM Entity:**
```typescript
@Entity('api_logs')
export class ApiLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 500 })
  path: string;

  @Column({ name: 'status_code' })
  statusCode: number;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ length: 100, nullable: true })
  ip: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'request_body', type: 'jsonb', nullable: true })
  requestBody: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

Tidak pakai relasi ManyToOne ke User karena sengaja tidak ada FK constraint. Kalau butuh nama user waktu query, join manual atau fetch terpisah.

---

## Migration Files

Urutan migration yang dibuat:

```
1. CreateUsersTable
2. CreateCategoriesTable
3. CreateProductsTable
4. CreateApiLogsTable
```

Semua migration ada di: `src/database/migrations/`

**Run:**
```bash
npm run migration:run
```

**Rollback:**
```bash
npm run migration:revert
```

---

## Seeder Data

### Categories (5 data)
```
1. Snacks
2. Minuman
3. Sembako
4. Kebersihan
5. Bumbu Dapur
```

### Users (2 data)
```
admin@klontong.com  | admin123  | role: admin
staff@klontong.com  | staff123  | role: staff
```

### Products (100 data)
Tersebar merata (~20 produk per kategori) dengan data random:
- SKU: 6 karakter alphanumeric uppercase
- Nama: kombinasi nama produk realistis (beras, minyak, sabun, dll)
- Harga: random antara Rp 1.000 – Rp 100.000
- Stok: random antara 0 – 500
- Berat: random antara 100 – 5000 gram
- isActive: 90% true, 10% false (simulasi produk nonaktif)

---

## Skalabilitas — Pertimbangan Index

Untuk pertumbuhan dari 100 ke 100.000+ produk:

| Kebutuhan | Solusi |
|-----------|--------|
| Search nama/SKU cepat | PostgreSQL `tsvector` full-text search atau partial index |
| Filter kategori + status | Composite index `(category_id, is_active, deleted_at)` |
| Pagination performa | Cursor-based pagination (ganti offset) |
| Query berat | Read replica PostgreSQL |
| Cache list produk | Redis dengan TTL 5 menit |
