import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1700000000001 implements MigrationInterface {
  name = 'CreateUsersTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // pgcrypto provides gen_random_uuid().
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK ("role" IN ('admin', 'staff')),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
