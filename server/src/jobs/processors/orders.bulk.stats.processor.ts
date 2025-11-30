import { Job } from "bullmq";
import { OrderStatus } from "../../modules/orders/constants/enum/orders.enum";
import { OrderStatsEntity } from "../../modules/orders-stats/entity/order-stats.entity";
import { OrderEntity } from "../../modules/orders/entity/orders.entity";
import { dataSource } from "../../database/app.data-source";
import { getRedisClient } from "../../common/redis/redis.connection";

interface BulkOrderStatsJobData {
  orderIds: string[];
}

const orderStatsRepository = dataSource.getRepository(OrderStatsEntity);
const orderRepository = dataSource.getRepository(OrderEntity);

export async function updateBulkOrderStats(
  job: Job<BulkOrderStatsJobData>
): Promise<void> {
  const { orderIds } = job.data;
  
  console.log(`Processing bulk order stats for ${orderIds.length} orders`);
  
  // Extract unique dates from createdAt timestamps
  const affectedDates = await orderRepository
    .createQueryBuilder("o") 
    .select("DISTINCT DATE(o.created_at)", "date")  // ✅ Extract date from created_at
    .where("o.id IN (:...orderIds)", { orderIds })  
    .andWhere("o.deleted_at IS NULL")
    .getRawMany();

  console.log(`Found ${affectedDates.length} unique dates to update`);

  // Recalculate stats for each affected date
  for (const { date } of affectedDates) {
    await recalculateDailyStats(date);
  }

  // Clear cache
  const redis = await getRedisClient();
  await redis.del("aggregated_order_stats");

  console.log(`Bulk order stats updated for ${affectedDates.length} dates`);
}

async function recalculateDailyStats(date: string): Promise<void> {
  // Aggregate stats for all orders on this date
  const aggregatedStats = await orderRepository
    .createQueryBuilder("o") 
    .select("COUNT(o.id)", "totalOrders")
    .addSelect("SUM(CAST(o.total_amount AS NUMERIC))", "totalRevenue")
    .addSelect("SUM(CAST(o.discount_amount AS NUMERIC))", "totalDiscount")
    .addSelect(
      `SUM(CASE WHEN o.status = '${OrderStatus.PENDING}' THEN 1 ELSE 0 END)`,
      "pendingCount"
    )
    .addSelect(
      `SUM(CASE WHEN o.status = '${OrderStatus.DELIVERED}' THEN 1 ELSE 0 END)`,
      "deliveredCount"
    )
    .addSelect(
      `SUM(CASE WHEN o.status = '${OrderStatus.CANCELLED}' THEN 1 ELSE 0 END)`,
      "cancelledCount"
    )
    .where("DATE(o.created_at) = :date", { date }) 
    .andWhere("o.deleted_at IS NULL")  
    .getRawOne();

  const totalOrders = parseInt(aggregatedStats.totalOrders, 10) || 0;
  const totalRevenue = parseFloat(aggregatedStats.totalRevenue || 0);
  const totalDiscount = parseFloat(aggregatedStats.totalDiscount || 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Upsert into order_stats table
  await orderStatsRepository
    .createQueryBuilder()
    .insert()
    .into(OrderStatsEntity)
    .values({
      date,
      totalOrders,
      totalRevenue,
      totalDiscount,
      avgOrderValue,
      pendingCount: parseInt(aggregatedStats.pendingCount, 10) || 0,
      deliveredCount: parseInt(aggregatedStats.deliveredCount, 10) || 0,
      cancelledCount: parseInt(aggregatedStats.cancelledCount, 10) || 0,
    })
    .orUpdate(
      [
        "total_orders",
        "total_revenue",
        "total_discount",
        "avg_order_value",
        "pending_count",
        "delivered_count",
        "cancelled_count",
        "updated_at"
      ],
      ["date"]
    )
    .execute();

  console.log(`Stats recalculated for date: ${date}`);
}