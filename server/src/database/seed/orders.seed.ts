import { DataSource } from "typeorm";
import { dataSource } from "../app.data-source";

export async function seedOrders(dataSource: DataSource, count: number = 10000) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    // -----------------------------------------------------
    // 1. SEED ORDERS
    // -----------------------------------------------------
    await queryRunner.startTransaction();

    console.log(`Inserting ${count} random orders...`);

    // --- INSERT ORDERS WITH order_item_text ---
    await queryRunner.query(`
      INSERT INTO orders (
        id, created_at, updated_at, deleted_at, user_id, status, subtotal,
        total_amount, discount_amount, payment_method, payment_status, 
        delivered_at, order_item_text
      )
      SELECT
        gen_random_uuid(),
        NOW() - (random() * INTERVAL '365 days'),
        NOW() - (random() * INTERVAL '365 days'),
        CASE WHEN random() < 0.1 THEN NOW() ELSE NULL END,
        gen_random_uuid(),
        (ARRAY['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])[floor(random() * 6 + 1)]::orders_status_enum,
        (random() * 1000 + 50)::decimal(10,2),
        (random() * 1200 + 60)::decimal(10,2),
        (random() * 100)::decimal(10,2),
        (ARRAY['credit_card', 'debit_card', 'paypal', 'stripe', 'cash', 'bank_transfer', NULL]::varchar[])[floor(random() * 7 + 1)]::varchar(50),
        (ARRAY['pending', 'paid', 'failed', 'refunded'])[floor(random() * 4 + 1)]::orders_payment_status_enum,
        CASE 
          WHEN random() < 0.3 THEN NOW() - (random() * INTERVAL '180 days')
          ELSE NULL 
        END,
        -- Generate order_item_text with 2-4 random items
        (ARRAY['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
               'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Desk', 'Chair',
               'Backpack', 'Charger', 'Cable', 'Adapter', 'Battery', 'Case',
               'Screen Protector', 'Stand', 'Hub', 'Router', 'Switch', 'Printer',
               'Scanner', 'Camera', 'Lens', 'Tripod', 'Light', 'Gimbal']::text[])[floor(random() * 30 + 1)::int] || ', ' ||
        (ARRAY['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
               'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Desk', 'Chair',
               'Backpack', 'Charger', 'Cable', 'Adapter', 'Battery', 'Case',
               'Screen Protector', 'Stand', 'Hub', 'Router', 'Switch', 'Printer',
               'Scanner', 'Camera', 'Lens', 'Tripod', 'Light', 'Gimbal']::text[])[floor(random() * 30 + 1)::int] || ', ' ||
        (ARRAY['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
               'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Desk', 'Chair',
               'Backpack', 'Charger', 'Cable', 'Adapter', 'Battery', 'Case',
               'Screen Protector', 'Stand', 'Hub', 'Router', 'Switch', 'Printer',
               'Scanner', 'Camera', 'Lens', 'Tripod', 'Light', 'Gimbal']::text[])[floor(random() * 30 + 1)::int] ||
        -- Sometimes add a 4th item
        CASE 
          WHEN random() < 0.5 THEN ', ' || (ARRAY['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 
               'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Desk', 'Chair',
               'Backpack', 'Charger', 'Cable', 'Adapter', 'Battery', 'Case',
               'Screen Protector', 'Stand', 'Hub', 'Router', 'Switch', 'Printer',
               'Scanner', 'Camera', 'Lens', 'Tripod', 'Light', 'Gimbal']::text[])[floor(random() * 30 + 1)::int]
          ELSE ''
        END
      FROM generate_series(1, $1)
    `, [count]);

    console.log(`Successfully inserted ${count} orders with order_item_text`);

    // The trigger will automatically populate order_items_tsv from order_item_text
    // But if the trigger wasn't active during insert, we can manually update:
    await queryRunner.query(`
      UPDATE orders
      SET order_items_tsv = to_tsvector('english', COALESCE(order_item_text, ''))
      WHERE order_items_tsv IS NULL AND order_item_text IS NOT NULL
    `);

    console.log('Successfully updated order_items_tsv from order_item_text');
    await queryRunner.commitTransaction();

    // -----------------------------------------------------
    // 2. SEED ORDER STATS
    // -----------------------------------------------------
    await queryRunner.startTransaction();
    console.log('\nAggregating and inserting daily order statistics...');

    await queryRunner.query(`
      INSERT INTO order_stats (
        id, 
        created_at, 
        updated_at, 
        date, 
        total_orders, 
        total_revenue, 
        total_discount, 
        avg_order_value, 
        pending_count, 
        delivered_count, 
        cancelled_count
      )
      SELECT
        gen_random_uuid(),
        NOW(),
        NOW(),
        date(o.created_at) AS date,
        COUNT(o.id) AS total_orders,
        SUM(CAST(o.total_amount AS NUMERIC)) AS total_revenue,
        SUM(CAST(o.discount_amount AS NUMERIC)) AS total_discount,
        (SUM(CAST(o.total_amount AS NUMERIC)) / COUNT(o.id)) AS avg_order_value,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_count,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
      FROM orders o
      WHERE o.deleted_at IS NULL
      GROUP BY date(o.created_at)
      HAVING date(o.created_at) < CURRENT_DATE
      ON CONFLICT (date) DO UPDATE
      SET
          total_orders = EXCLUDED.total_orders,
          total_revenue = EXCLUDED.total_revenue,
          total_discount = EXCLUDED.total_discount,
          avg_order_value = EXCLUDED.avg_order_value,
          pending_count = EXCLUDED.pending_count,
          delivered_count = EXCLUDED.delivered_count,
          cancelled_count = EXCLUDED.cancelled_count,
          updated_at = NOW();
    `);

    await queryRunner.commitTransaction();
    
    const statsCount = await queryRunner.query(`SELECT COUNT(*) FROM order_stats`);
    console.log(`Successfully inserted/updated ${statsCount[0].count} daily stats records.`);

    // -----------------------------------------------------
    // 3. LOG SEEDING STATISTICS
    // -----------------------------------------------------
    const stats = await queryRunner.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_method IS NOT NULL THEN 1 END) as orders_with_payment_method,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as soft_deleted_orders,
        COUNT(CASE WHEN order_item_text IS NOT NULL THEN 1 END) as orders_with_items,
        COUNT(CASE WHEN order_items_tsv IS NOT NULL THEN 1 END) as orders_with_tsv,
        AVG(pg_column_size(t.*)) as avg_row_size_bytes,
        FLOOR((8192 - 24) / AVG(pg_column_size(t.*))) as rows_per_8kb_page
      FROM orders as t
    `);

    console.log('\n=== Seeding Statistics ===');
    console.log(`Total orders: ${stats[0].total_orders}`);
    console.log(`Orders with payment method: ${stats[0].orders_with_payment_method}`);
    console.log(`Delivered orders: ${stats[0].delivered_orders}`);
    console.log(`Soft deleted orders: ${stats[0].soft_deleted_orders}`);
    console.log(`Orders with item text: ${stats[0].orders_with_items}`);
    console.log(`Orders with tsvector: ${stats[0].orders_with_tsv}`);
    console.log(`Average row size: ${Math.round(stats[0].avg_row_size_bytes)} bytes`);
    console.log(`Rows per 8KB page: ${stats[0].rows_per_8kb_page}`);
    
    const verifyStats = await queryRunner.query(`SELECT COUNT(*) as count FROM order_stats`);
    console.log(`\n=== Order Stats Verification ===`);
    console.log(`Total order_stats records: ${verifyStats[0].count}`);

    // Sample some order_item_text to verify
    const sampleOrders = await queryRunner.query(`
      SELECT id, order_item_text, order_items_tsv IS NOT NULL as has_tsv
      FROM orders 
      WHERE deleted_at IS NULL
      LIMIT 5
    `);
    console.log(`\n=== Sample Orders ===`);
    sampleOrders.forEach((order: any, idx: number) => {
      console.log(`${idx + 1}. ${order.order_item_text} (TSV: ${order.has_tsv ? '✓' : '✗'})`);
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

seedOrders(dataSource, 10000).then(() => {
  console.log("seed complete");
  process.exit(0);
}).catch(error => {
  console.error("Seeding failed:", error);
  process.exit(1);
});