import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1764508651939 implements MigrationInterface {
    name = 'Init1764508651939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "date" date NOT NULL, "total_orders" integer NOT NULL DEFAULT '0', "total_revenue" numeric(12,2) NOT NULL DEFAULT '0', "total_discount" numeric(12,2) NOT NULL DEFAULT '0', "avg_order_value" numeric(12,2) NOT NULL DEFAULT '0', "pending_count" integer NOT NULL DEFAULT '0', "delivered_count" integer NOT NULL DEFAULT '0', "cancelled_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_c53faa38fb037ecefdbbf9f5836" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5abed981af9a87462cb5d59142" ON "order_stats" ("id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d62b70f5708e585c29e7954cb2" ON "order_stats" ("date") `);
        await queryRunner.query(`CREATE INDEX "date_idx_order_stats" ON "order_stats" ("date") `);
        await queryRunner.query(`CREATE TYPE "public"."orders_massive_entity_status_enum" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "orders_massive_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "status" "public"."orders_massive_entity_status_enum" NOT NULL DEFAULT 'pending', "order_items_tsv" tsvector, "order_item_text" character varying(200) NOT NULL, CONSTRAINT "PK_8a5fbf9a0a26df4ef9f7c0253cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7e562e9b5e77fd74f1d749777e" ON "orders_massive_entity" ("id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_e5de1fc2af01eb84faa3046734" ON "orders_massive_entity" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_01601d7514e89743b73fb22471" ON "orders_massive_entity" ("created_at") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "subtotal" numeric(10,2) NOT NULL, "total_amount" numeric(10,2) NOT NULL, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "payment_method" character varying(50), "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'pending', "order_items_tsv" tsvector, "order_item_text" character varying(200) NOT NULL, "delivered_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0c6558969e948f24e400a385f5" ON "orders" ("id") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_a922b820eeef29ac1c6800e826" ON "orders" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "created_at_idx_orders_deleted_at_null" ON "orders" ("created_at") WHERE "deleted_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."created_at_idx_orders_deleted_at_null"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a922b820eeef29ac1c6800e826"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c6558969e948f24e400a385f5"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_payment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01601d7514e89743b73fb22471"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5de1fc2af01eb84faa3046734"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e562e9b5e77fd74f1d749777e"`);
        await queryRunner.query(`DROP TABLE "orders_massive_entity"`);
        await queryRunner.query(`DROP TYPE "public"."orders_massive_entity_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."date_idx_order_stats"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d62b70f5708e585c29e7954cb2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5abed981af9a87462cb5d59142"`);
        await queryRunner.query(`DROP TABLE "order_stats"`);
    }

}
