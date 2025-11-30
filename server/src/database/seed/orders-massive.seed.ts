import { DataSource } from "typeorm";
import { dataSource } from "../app.data-source";

export async function seedMassiveOrdersEntity(dataSource: DataSource, count: number = 1_000_000) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    console.log(`Inserting ${count} rows into orders_massive_entity...`);

    await queryRunner.startTransaction();

    await queryRunner.query(
      `
      INSERT INTO orders_massive_entity (
        id,
        created_at,
        updated_at,
        deleted_at,
        user_id,
        status,
        order_item_text
      )
      SELECT
        gen_random_uuid(),
        NOW() - (random() * INTERVAL '365 days'),
        NOW(),
        CASE WHEN random() < 0.05 THEN NOW() ELSE NULL END,
        gen_random_uuid(),
        (ARRAY['pending','processing','shipped','delivered','cancelled','refunded'])[floor(random() * 6 + 1)]::orders_massive_entity_status_enum,
        
        -- 2-4 random items for order_item_text
        (
          (ARRAY['Laptop','Phone','Tablet','Monitor','Keyboard','Mouse',
                 'Headphones','Speaker','Webcam','Microphone','Desk','Chair',
                 'Backpack','Charger','Cable','Adapter','Battery','Case',
                 'Screen Protector','Stand','Hub','Router','Switch','Printer',
                 'Scanner','Camera','Lens','Tripod','Light','Gimbal']::text[])
          [floor(random() * 30 + 1)::int]
          || ', ' ||
          (ARRAY['Laptop','Phone','Tablet','Monitor','Keyboard','Mouse',
                 'Headphones','Speaker','Webcam','Microphone','Desk','Chair',
                 'Backpack','Charger','Cable','Adapter','Battery','Case',
                 'Screen Protector','Stand','Hub','Router','Switch','Printer',
                 'Scanner','Camera','Lens','Tripod','Light','Gimbal']::text[])
          [floor(random() * 30 + 1)::int]
          || ', ' ||
          (ARRAY['Laptop','Phone','Tablet','Monitor','Keyboard','Mouse',
                 'Headphones','Speaker','Webcam','Microphone','Desk','Chair',
                 'Backpack','Charger','Cable','Adapter','Battery','Case',
                 'Screen Protector','Stand','Hub','Router','Switch','Printer',
                 'Scanner','Camera','Lens','Tripod','Light','Gimbal']::text[])
          [floor(random() * 30 + 1)::int]
          ||
          CASE 
            WHEN random() < 0.5 THEN
              ', ' || 
              (ARRAY['Laptop','Phone','Tablet','Monitor','Keyboard','Mouse',
                     'Headphones','Speaker','Webcam','Microphone','Desk','Chair',
                     'Backpack','Charger','Cable','Adapter','Battery','Case',
                     'Screen Protector','Stand','Hub','Router','Switch','Printer',
                     'Scanner','Camera','Lens','Tripod','Light','Gimbal']::text[])
              [floor(random() * 30 + 1)::int]
            ELSE ''
          END
        )
      FROM generate_series(1, $1)
      `,
      [count]
    );

    console.log(`Inserted ${count} rows successfully.`);

    // Fill tsvector where needed
    console.log(`Updating missing order_items_tsv...`);
    await queryRunner.query(`
      UPDATE orders_massive_entity
      SET order_items_tsv = to_tsvector('english', order_item_text)
      WHERE order_items_tsv IS NULL
    `);

    await queryRunner.commitTransaction();

    console.log("TSV update complete.");

  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error("Error seeding massive entity:", err);
    throw err;
  } finally {
    await queryRunner.release();
  }
}

seedMassiveOrdersEntity(dataSource, 1000000)
  .then(() => {
    console.log("Massive seeding finished!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Massive seeding failed:", err);
    process.exit(1);
  });