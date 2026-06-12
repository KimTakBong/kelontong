import { MigrationInterface, QueryRunner } from 'typeorm';

// Converts the SERIAL primary keys (and the products.category_id FK) on
// categories, products, and api_logs to UUID, preserving existing rows and
// the category <-> product relationship.
export class ConvertIdsToUuid1700000000005 implements MigrationInterface {
  name = 'ConvertIdsToUuid1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // New UUID columns, filled with a fresh random UUID per existing row.
    await queryRunner.query(
      `ALTER TABLE "categories" ADD COLUMN "id_new" UUID NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "id_new" UUID NOT NULL DEFAULT gen_random_uuid()`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_logs" ADD COLUMN "id_new" UUID NOT NULL DEFAULT gen_random_uuid()`,
    );

    // Remap products.category_id to the new category UUIDs before dropping
    // the old integer columns.
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "category_id_new" UUID`,
    );
    await queryRunner.query(`
      UPDATE "products" p
      SET "category_id_new" = c."id_new"
      FROM "categories" c
      WHERE p."category_id" = c."id"
    `);
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "category_id_new" SET NOT NULL`,
    );

    // Drop the FK + index tied to the old integer category_id.
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey"`,
    );
    await queryRunner.query(`DROP INDEX "idx_products_category_id"`);

    // Drop old SERIAL primary keys and columns.
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "categories_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "products_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_logs" DROP CONSTRAINT "api_logs_pkey"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "category_id"`,
    );
    await queryRunner.query(`ALTER TABLE "api_logs" DROP COLUMN "id"`);

    // Rename the new UUID columns into place.
    await queryRunner.query(
      `ALTER TABLE "categories" RENAME COLUMN "id_new" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" RENAME COLUMN "id_new" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" RENAME COLUMN "category_id_new" TO "category_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_logs" RENAME COLUMN "id_new" TO "id"`,
    );

    // Recreate primary keys, FK, and index on the new UUID columns.
    await queryRunner.query(`ALTER TABLE "categories" ADD PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "products" ADD PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "api_logs" ADD PRIMARY KEY ("id")`);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "products_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_products_category_id" ON "products" ("category_id")`,
    );

    // Drop the now-orphaned sequences from the old SERIAL columns.
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "categories_id_seq"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "products_id_seq"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "api_logs_id_seq"`);
  }

  public async down(): Promise<void> {
    throw new Error(
      'ConvertIdsToUuid1700000000005 is irreversible: original integer IDs cannot be restored',
    );
  }
}
