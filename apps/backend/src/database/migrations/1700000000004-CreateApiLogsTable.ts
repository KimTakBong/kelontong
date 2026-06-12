import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiLogsTable1700000000004 implements MigrationInterface {
  name = 'CreateApiLogsTable1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_logs" (
        "id" SERIAL PRIMARY KEY,
        "method" VARCHAR(10) NOT NULL,
        "path" VARCHAR(500) NOT NULL,
        "status_code" INTEGER NOT NULL,
        "duration" INTEGER NOT NULL,
        "ip" VARCHAR(100),
        "user_agent" VARCHAR(500),
        "user_id" UUID,
        "request_body" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "api_logs"`);
  }
}
