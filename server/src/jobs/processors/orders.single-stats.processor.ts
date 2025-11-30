import { Job } from "bullmq";
import { OrderStatus } from "../../modules/orders/constants/enum/orders.enum";
import { OrderStatsEntity } from "../../modules/orders-stats/entity/order-stats.entity";
import { OrderEntity } from "../../modules/orders/entity/orders.entity";
import { dataSource } from "../../database/app.data-source";
import { getRedisClient } from "../../common/redis/redis.connection";

interface OrderStatsJobData {
  orderId: string;
  previousStatus?: OrderStatus;
}

const orderStatsRepository = dataSource.getRepository(OrderStatsEntity);
const orderRepository = dataSource.getRepository(OrderEntity);

export async function updateOrderStats(
  job: Job<OrderStatsJobData>
): Promise<void> {
  const { orderId, previousStatus } = job.data;

  // 1. Fetch the latest order details
  const order = await orderRepository.findOne({ where: { id: orderId } });

  if (!order) {
    console.error(`Order not found for ID: ${orderId}. Skipping stats update.`);
    return;
  }

  const orderDate = new Date(order.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
  const currentStatus = order.status;

  // 2. Find or create the daily stats record
  let stats = await orderStatsRepository.findOne({
    where: { date: orderDate },
  });

  if (!stats) {
    stats = orderStatsRepository.create({ date: orderDate });
    // Initialize base stats
    stats.totalOrders = 0;
    stats.totalRevenue = 0;
    stats.totalDiscount = 0;
    stats.avgOrderValue = 0;
    stats.pendingCount = 0;
    stats.deliveredCount = 0;
    stats.cancelledCount = 0;
  }

  if (previousStatus && previousStatus !== currentStatus) {
    // Decrement count for the old status
    switch (previousStatus) {
      case OrderStatus.PENDING:
        stats.pendingCount--;
        break;
      case OrderStatus.DELIVERED:
        stats.deliveredCount--;
        break;
      case OrderStatus.CANCELLED:
        stats.cancelledCount--;
        break;
      // Add other statuses as needed
    }
  }

  // Always increment count for the current status (or re-increment if only previous was decremented)
  if (!previousStatus || previousStatus !== currentStatus) {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        stats.pendingCount++;
        break;
      case OrderStatus.DELIVERED:
        stats.deliveredCount++;
        break;
      case OrderStatus.CANCELLED:
        stats.cancelledCount++;
        break;
      // Add other statuses as needed
    }
  }

  // --- RE-AGGREGATION (Recommended for robust updates) ---
  const [totalOrders, financialStats] = await orderRepository
    .createQueryBuilder("order")
    .select("COUNT(order.id)", "totalOrders")
    .addSelect("SUM(CAST(order.total_amount AS NUMERIC))", "totalRevenue")
    .addSelect("SUM(CAST(order.discount_amount AS NUMERIC))", "totalDiscount")
    .addSelect(
      `SUM(CASE WHEN order.status = '${OrderStatus.PENDING}' THEN 1 ELSE 0 END)`,
      "pendingCount"
    )
    .addSelect(
      `SUM(CASE WHEN order.status = '${OrderStatus.DELIVERED}' THEN 1 ELSE 0 END)`,
      "deliveredCount"
    )
    .addSelect(
      `SUM(CASE WHEN order.status = '${OrderStatus.CANCELLED}' THEN 1 ELSE 0 END)`,
      "cancelledCount"
    )
    .where("DATE(order.created_at) = :date", { date: orderDate })
    .andWhere("order.deleted_at IS NULL")
    .getRawOne();

  stats.totalOrders = parseInt(totalOrders, 10) || 0;
  stats.totalRevenue = parseFloat(financialStats.totalRevenue || 0);
  stats.totalDiscount = parseFloat(financialStats.totalDiscount || 0);
  stats.pendingCount = parseInt(financialStats.pendingCount, 10) || 0;
  stats.deliveredCount = parseInt(financialStats.deliveredCount, 10) || 0;
  stats.cancelledCount = parseInt(financialStats.cancelledCount, 10) || 0;

  stats.avgOrderValue =
    stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

  await orderStatsRepository.save(stats);
  console.log(`Order stats updated successfully for date: ${orderDate}`);
  const redis = await getRedisClient();

  const keys = await redis.keys("daily_order_stats:*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
}
