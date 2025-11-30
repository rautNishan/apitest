import { QueryRunner } from "typeorm";

export const addOrdersTsvectorTrigger = async (queryRunner: QueryRunner) => {
  await queryRunner.query(`
    CREATE OR REPLACE FUNCTION update_orders_tsvector()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.order_items_tsv := to_tsvector('english', COALESCE(NEW.order_item_text, ''));
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await queryRunner.query(`
    CREATE OR REPLACE TRIGGER trigger_orders_tsvector
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_tsvector();
  `);
};


