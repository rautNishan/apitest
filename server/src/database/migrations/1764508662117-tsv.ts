import { MigrationInterface, QueryRunner } from "typeorm";

export class Tsv1764508662117 implements MigrationInterface {

     public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS order_items_fts_tsv_idx 
            ON orders 
            USING GIN (order_items_tsv)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."order_items_fts_tsv_idx"`
    );
  }

}
