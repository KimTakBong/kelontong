import { MigrationInterface, QueryRunner } from 'typeorm';

// Cosmetic only: ConvertIdsToUuid left "id" (and products.category_id) as the
// last column since Postgres can't reorder columns in-place. Rebuild each
// table with "id" first by copying rows into a freshly-ordered table.
export class ReorderIdColumnFirst1700000000006 implements MigrationInterface {
  name = 'ReorderIdColumnFirst1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey"`,
    );
    await queryRunner.query(`DROP INDEX "idx_products_category_id"`);

    // --- categories ---
    await queryRunner.query(`
      CREATE TABLE "categories_new" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "categories_pkey_new" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "categories_new" ("id", "name", "created_at", "updated_at")
      SELECT "id", "name", "created_at", "updated_at" FROM "categories"
    `);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `ALTER TABLE "categories_new" RENAME TO "categories"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" RENAME CONSTRAINT "categories_pkey_new" TO "categories_pkey"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_categories_name" ON "categories" ("name")`,
    );

    // --- products ---
    await queryRunner.query(`
      CREATE TABLE "products_new" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "category_id" UUID NOT NULL,
        "sku" VARCHAR(20) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "weight" INTEGER,
        "width" NUMERIC(8,2),
        "length" NUMERIC(8,2),
        "height" NUMERIC(8,2),
        "image" VARCHAR(500),
        "price" INTEGER NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "stock" INTEGER NOT NULL DEFAULT 0,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "products_pkey_new" PRIMARY KEY ("id"),
        CONSTRAINT "products_weight_check" CHECK ("weight" >= 0),
        CONSTRAINT "products_width_check" CHECK ("width" >= 0),
        CONSTRAINT "products_length_check" CHECK ("length" >= 0),
        CONSTRAINT "products_height_check" CHECK ("height" >= 0),
        CONSTRAINT "products_price_check" CHECK ("price" >= 0),
        CONSTRAINT "products_stock_check" CHECK ("stock" >= 0)
      )
    `);
    await queryRunner.query(`
      INSERT INTO "products_new" (
        "id", "category_id", "sku", "name", "description", "weight", "width",
        "length", "height", "image", "price", "is_active", "stock",
        "deleted_at", "created_at", "updated_at"
      )
      SELECT
        "id", "category_id", "sku", "name", "description", "weight", "width",
        "length", "height", "image", "price", "is_active", "stock",
        "deleted_at", "created_at", "updated_at"
      FROM "products"
    `);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `ALTER TABLE "products_new" RENAME TO "products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" RENAME CONSTRAINT "products_pkey_new" TO "products_pkey"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_products_sku" ON "products" ("sku")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_category_id" ON "products" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_name" ON "products" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_is_active" ON "products" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_deleted_at" ON "products" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_created_at" ON "products" ("created_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "products_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT
    `);

    // --- api_logs ---
    await queryRunner.query(`
      CREATE TABLE "api_logs_new" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "method" VARCHAR(10) NOT NULL,
        "path" VARCHAR(500) NOT NULL,
        "status_code" INTEGER NOT NULL,
        "duration" INTEGER NOT NULL,
        "ip" VARCHAR(100),
        "user_agent" VARCHAR(500),
        "user_id" UUID,
        "request_body" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "api_logs_pkey_new" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "api_logs_new" (
        "id", "method", "path", "status_code", "duration", "ip", "user_agent",
        "user_id", "request_body", "created_at"
      )
      SELECT
        "id", "method", "path", "status_code", "duration", "ip", "user_agent",
        "user_id", "request_body", "created_at"
      FROM "api_logs"
    `);
    await queryRunner.query(`DROP TABLE "api_logs"`);
    await queryRunner.query(
      `ALTER TABLE "api_logs_new" RENAME TO "api_logs"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_logs" RENAME CONSTRAINT "api_logs_pkey_new" TO "api_logs_pkey"`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_api_logs_created_at" ON "api_logs" ("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_logs_user_id" ON "api_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_logs_status_code" ON "api_logs" ("status_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_api_logs_path" ON "api_logs" ("path")`,
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'ReorderIdColumnFirst1700000000006 is cosmetic-only and not reversible',
    );
  }
}
