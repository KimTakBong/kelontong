import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1700000000002 implements MigrationInterface {
  name = 'CreateCategoriesTable1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_categories_name" ON "categories" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
