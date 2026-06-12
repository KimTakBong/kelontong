import 'dotenv/config';
import { randomUUID } from 'crypto';
import dataSource from '../data-source';
import { Category } from '../../categories/entities/category.entity';

// ──────────────────────────────────────────────────────────────────────────
// Bulk product seeder — generates a large dataset (default 1,000,000 rows) to
// exercise scalability (pagination, search, filter, sort) as described in
// Architecture-Note §6. This is a SEEDER, not a schema migration: it streams
// rows in batches via raw multi-row INSERTs so it stays fast and memory-flat.
//
// Usage:
//   npm run seed:bulk            # 1,000,000 products
//   npm run seed:bulk -- 50000   # custom count
//   SEED_PRODUCT_COUNT=200000 npm run seed:bulk
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_COUNT = 1_000_000;

// Rows per INSERT. Postgres caps a statement at 65535 bind params; with 13
// columns that's ~5040 rows max — 2000 keeps us comfortably under while still
// minimizing round-trips.
const BATCH_SIZE = 2000;

const CATEGORIES = ['Snacks', 'Minuman', 'Sembako', 'Kebersihan', 'Bumbu Dapur'];

const NAME_PARTS: Record<string, string[]> = {
  Snacks: ['Ciki', 'Keripik', 'Biskuit', 'Wafer', 'Kacang', 'Coklat'],
  Minuman: ['Teh Kotak', 'Kopi Sachet', 'Air Mineral', 'Susu UHT', 'Jus', 'Soda'],
  Sembako: ['Beras', 'Minyak Goreng', 'Gula Pasir', 'Tepung Terigu', 'Telur', 'Mie Instan'],
  Kebersihan: ['Sabun Mandi', 'Shampo', 'Pasta Gigi', 'Deterjen', 'Pembersih Lantai', 'Tisu'],
  'Bumbu Dapur': ['Garam', 'Kecap Manis', 'Saus Sambal', 'Merica', 'Penyedap Rasa', 'Bumbu Nasi Goreng'],
};

const ADJECTIVES = ['Spesial', 'Premium', 'Ekonomis', 'Jumbo', 'Original', 'Pedas', 'Manis', 'Family Pack'];

// Fallback name pieces for categories that aren't one of the 5 defaults (e.g.
// custom categories created via the UI) so seeding never crashes on lookup.
const GENERIC_PARTS = ['Produk', 'Barang', 'Item', 'Paket', 'Eceran', 'Grosir'];

const COLUMNS = [
  'id',
  'category_id',
  'sku',
  'name',
  'description',
  'weight',
  'width',
  'length',
  'height',
  'image',
  'price',
  'is_active',
  'stock',
] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function resolveCount(): number {
  const fromArg = process.argv[2];
  const fromEnv = process.env.SEED_PRODUCT_COUNT;
  const raw = fromArg ?? fromEnv;
  if (!raw) return DEFAULT_COUNT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Jumlah produk tidak valid: "${raw}"`);
  }
  return n;
}

// Ensure the 5 base categories exist; reuse them if the table is already
// populated (so we don't wipe a real category list).
async function ensureCategories(): Promise<Category[]> {
  const repo = dataSource.getRepository(Category);
  const existing = await repo.find();
  if (existing.length > 0) return existing;
  return repo.save(CATEGORIES.map((name) => repo.create({ name })));
}

async function seed(): Promise<void> {
  const target = resolveCount();
  await dataSource.initialize();

  const categories = await ensureCategories();
  const categoryIds = categories.map((c) => c.id);
  console.log(`🌱 Bulk-seeding ${target.toLocaleString('id-ID')} produk…`);

  // Fresh dataset: clear products only (keep users & categories intact).
  await dataSource.query('TRUNCATE "products" CASCADE');

  const colList = COLUMNS.map((c) => `"${c}"`).join(', ');
  const started = Date.now();
  let inserted = 0;

  while (inserted < target) {
    const rows = Math.min(BATCH_SIZE, target - inserted);
    const placeholders: string[] = [];
    const params: unknown[] = [];

    for (let r = 0; r < rows; r++) {
      const seq = inserted + r + 1;
      const categoryName = categories[seq % categories.length].name;
      const parts = NAME_PARTS[categoryName] ?? GENERIC_PARTS;
      const name = `${pick(parts)} ${pick(ADJECTIVES)} ${seq}`;

      const base = r * COLUMNS.length;
      placeholders.push(
        `(${COLUMNS.map((_, i) => `$${base + i + 1}`).join(', ')})`,
      );
      params.push(
        randomUUID(), // id
        pick(categoryIds), // category_id
        `SKU${String(seq).padStart(10, '0')}`, // sku — deterministic & unique
        name.slice(0, 100), // name (respect length 100)
        `${name} — tersedia di toko klontong kami.`, // description
        randomInt(100, 5000), // weight
        randomInt(2, 40), // width
        randomInt(2, 40), // length
        randomInt(2, 40), // height
        null, // image
        randomInt(1, 100) * 1000, // price
        Math.random() > 0.1, // is_active (~90% active)
        randomInt(0, 500), // stock
      );
    }

    await dataSource.query(
      `INSERT INTO "products" (${colList}) VALUES ${placeholders.join(', ')}`,
      params,
    );

    inserted += rows;

    // Progress every ~50k rows (and at the very end).
    if (inserted % 50_000 === 0 || inserted === target) {
      const pct = ((inserted / target) * 100).toFixed(1);
      const elapsed = ((Date.now() - started) / 1000).toFixed(0);
      console.log(
        `  ${inserted.toLocaleString('id-ID')}/${target.toLocaleString('id-ID')} (${pct}%) — ${elapsed}s`,
      );
    }
  }

  const total = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`✅ Selesai: ${inserted.toLocaleString('id-ID')} produk dalam ${total}s.`);

  await dataSource.destroy();
}

seed().catch(async (err) => {
  console.error('❌ Bulk seeding gagal:', err);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
