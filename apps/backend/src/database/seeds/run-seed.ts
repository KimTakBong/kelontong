import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../../products/entities/product.entity';

const CATEGORIES = ['Snacks', 'Minuman', 'Sembako', 'Kebersihan', 'Bumbu Dapur'];

// Realistic-ish product name pieces per category for nicer seed data.
const NAME_PARTS: Record<string, string[]> = {
  Snacks: ['Ciki', 'Keripik', 'Biskuit', 'Wafer', 'Kacang', 'Coklat'],
  Minuman: ['Teh Kotak', 'Kopi Sachet', 'Air Mineral', 'Susu UHT', 'Jus', 'Soda'],
  Sembako: ['Beras', 'Minyak Goreng', 'Gula Pasir', 'Tepung Terigu', 'Telur', 'Mie Instan'],
  Kebersihan: ['Sabun Mandi', 'Shampo', 'Pasta Gigi', 'Deterjen', 'Pembersih Lantai', 'Tisu'],
  'Bumbu Dapur': ['Garam', 'Kecap Manis', 'Saus Sambal', 'Merica', 'Penyedap Rasa', 'Bumbu Nasi Goreng'],
};

const ADJECTIVES = ['Spesial', 'Premium', 'Ekonomis', 'Jumbo', 'Original', 'Pedas', 'Manis', 'Family Pack'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomSku(existing: Set<string>): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = '';
  do {
    sku = '';
    for (let i = 0; i < 6; i++) sku += chars[randomInt(0, chars.length - 1)];
  } while (existing.has(sku));
  existing.add(sku);
  return sku;
}

async function seed(): Promise<void> {
  await dataSource.initialize();
  console.log('🌱 Seeding database…');

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);
  const productRepo = dataSource.getRepository(Product);

  // Idempotent: wipe existing rows so re-running gives a clean dataset.
  await productRepo.query('TRUNCATE "products" CASCADE');
  await productRepo.query('TRUNCATE "categories" CASCADE');
  await userRepo.query('TRUNCATE "users" CASCADE');

  // ── Categories ──────────────────────────────────────
  const categories = await categoryRepo.save(
    CATEGORIES.map((name) => categoryRepo.create({ name })),
  );
  console.log(`✓ ${categories.length} kategori`);

  // ── Users ───────────────────────────────────────────
  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('staff123', 10),
  ]);
  await userRepo.save([
    userRepo.create({
      name: 'Admin Klontong',
      email: 'admin@klontong.com',
      password: adminHash,
      role: 'admin',
    }),
    userRepo.create({
      name: 'Staff Toko',
      email: 'staff@klontong.com',
      password: staffHash,
      role: 'staff',
    }),
  ]);
  console.log('✓ 2 user (admin & staff)');

  // ── Products: ~20 per category, 100 total ───────────
  const usedSkus = new Set<string>();
  const products: Product[] = [];
  const perCategory = 20;

  for (const category of categories) {
    const parts = NAME_PARTS[category.name];
    for (let i = 0; i < perCategory; i++) {
      const name = `${pick(parts)} ${pick(ADJECTIVES)}`;
      products.push(
        productRepo.create({
          categoryId: category.id,
          sku: randomSku(usedSkus),
          name,
          description: `${name} — tersedia di toko klontong kami.`,
          weight: randomInt(100, 5000),
          width: randomInt(2, 40),
          length: randomInt(2, 40),
          height: randomInt(2, 40),
          image: null,
          price: randomInt(1, 100) * 1000,
          stock: randomInt(0, 500),
          // ~10% inactive to exercise the status filter.
          isActive: Math.random() > 0.1,
        }),
      );
    }
  }
  await productRepo.save(products);
  console.log(`✓ ${products.length} produk`);

  await dataSource.destroy();
  console.log('✅ Seeding selesai.');
}

seed().catch((err) => {
  console.error('❌ Seeding gagal:', err);
  process.exit(1);
});
