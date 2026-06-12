import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ApiLog } from '../api-logs/entities/api-log.entity';

// Single source of truth for the DB connection. Reused by both the Nest app
// (via TypeOrmModule) and the TypeORM CLI for migrations.
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'klontong_admin',
  entities: [User, Category, Product, ApiLog],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // Never auto-sync: schema changes go through explicit migrations only.
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
};

// Default export consumed by the TypeORM CLI (`-d src/database/data-source.ts`).
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
