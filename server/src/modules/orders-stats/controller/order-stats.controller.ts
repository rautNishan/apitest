import { PAGINATION } from "../../../common/constants/pagination.constant";
import { getRedisClient } from "../../../common/redis/redis.connection";
import { SORT_ORDER_ENUM } from "../../../database/interfaces/database.interface";
import { OrderQueryDto } from "../../orders/dtos/orders.query.dto";
import { OrderStatsService } from "../service/orders-stats.service";

export class OrderStatsController {
  private statsService = OrderStatsService.getInstance();

  async getAll(options?: OrderQueryDto) {
    try {
      const redis = await getRedisClient();
      const cacheKey = `daily_order_stats:page=${options?.page || PAGINATION.DEFAULT_PAGE_NUMBER}:limit=${options?.limit || PAGINATION.DEFAULT_LIMIT}`;

      // 1️⃣ Check cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // 2️⃣ Fetch paginated stats from DB
      const stats = await this.statsService.getAllPaginated({
        options: {
          skip: options?.page,
          take: options?.limit,
          select: [
            "date",
            "totalOrders",
            "totalRevenue",
            "totalDiscount",
            "avgOrderValue",
            "pendingCount",
            "deliveredCount",
            "cancelledCount",
          ],
        },
      });

      await redis.set(cacheKey, JSON.stringify(stats), "EX", 300);

      return stats;
    } catch (err) {
      return err;
    }
  }

  async getAggregatedStats() {
    try {
      const redis = await getRedisClient();
      const cacheKey = "aggregated_order_stats";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const stats = await this.statsService.getAggregatedStats();

      await redis.set(cacheKey, JSON.stringify(stats), "EX", 300);

      return stats;
    } catch (err) {
      console.error("Error fetching aggregated stats:", err);
      throw err;
    }
  }
}
