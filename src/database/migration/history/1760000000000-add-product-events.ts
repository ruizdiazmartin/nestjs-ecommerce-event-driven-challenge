import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductEvents1760000000000 implements MigrationInterface {
  name = 'AddProductEvents1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD "activatedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_event" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "type" character varying(60) NOT NULL, "payload" jsonb, "occurredAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_product_event_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_event_productId" ON "product_event" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_event_type" ON "product_event" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_event_productId_occurredAt" ON "product_event" ("productId", "occurredAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_event" ADD CONSTRAINT "FK_product_event_productId" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_event" DROP CONSTRAINT "FK_product_event_productId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_event_productId_occurredAt"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_product_event_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_product_event_productId"`,
    );
    await queryRunner.query(`DROP TABLE "product_event"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "activatedAt"`);
  }
}
