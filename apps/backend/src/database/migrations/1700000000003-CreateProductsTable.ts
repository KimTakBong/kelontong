import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1700000000003 implements MigrationInterface {
  name = 'CreateProductsTable1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" SERIAL PRIMARY KEY,
        "category_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "sku" VARCHAR(20) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "weight" INTEGER CHECK ("weight" >= 0),
        "width" NUMERIC(8,2) CHECK ("width" >= 0),
        "length" NUMERIC(8,2) CHECK ("length" >= 0),
        "height" NUMERIC(8,2) CHECK ("height" >= 0),
        "image" VARCHAR(500),
        "price" INTEGER NOT NULL DEFAULT 0 CHECK ("price" >= 0),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "stock" INTEGER NOT NULL DEFAULT 0 CHECK ("stock" >= 0),
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
