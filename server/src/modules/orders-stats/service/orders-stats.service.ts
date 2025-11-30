import { Repository } from "typeorm";
import {
  ICreateOptions,
  IFindAllOptions,
  IFindByIdOptions,
  IFindOneOption,
  IPaginatedData,
} from "../../../database/interfaces/database.interface";
import { OrderStatsRepository } from "../repository/order-stats.repository";
import { OrderStatsEntity } from "../entity/order-stats.entity";
import { DBConnection } from "../../../database/connection/database.connection";

export class OrderStatsService {
  private _orderStatsRepository: OrderStatsRepository;

  private static _orderStatsInstance: OrderStatsService;

  private constructor() {
    const _repo: Repository<OrderStatsEntity> =
      DBConnection.getConnection().getRepository(OrderStatsEntity);
    this._orderStatsRepository = new OrderStatsRepository(_repo);
  }

  public static getInstance(): OrderStatsService {
    if (!OrderStatsService._orderStatsInstance) {
      //If it is static use Class name instead of this keyword
      OrderStatsService._orderStatsInstance = new OrderStatsService();
    }
    return OrderStatsService._orderStatsInstance;
  }


  async getAllPaginated(
    options?: IFindAllOptions<OrderStatsEntity>
  ): Promise<IPaginatedData<OrderStatsEntity>> {
    const data = await this._orderStatsRepository.getAllPaginated(options);
    return data;
  }

  async getOne(
    options: IFindOneOption<OrderStatsEntity>
  ): Promise<OrderStatsEntity | null> {
    const data = await this._orderStatsRepository.getOne(options);
    return data;
  }

  async getAggregatedStats() {
  const result = await this._orderStatsRepository
    .createQueryBuilder('stats')
    .select('SUM(stats.total_orders)', 'totalOrders')
    .addSelect('SUM(stats.total_revenue)', 'totalRevenue')
    .addSelect('SUM(stats.total_discount)', 'totalDiscount')
    .addSelect('AVG(stats.avg_order_value)', 'avgOrderValue')
    .addSelect('SUM(stats.pending_count)', 'pendingCount')
    .addSelect('SUM(stats.delivered_count)', 'deliveredCount')
    .addSelect('SUM(stats.cancelled_count)', 'cancelledCount')
    .addSelect('COUNT(DISTINCT stats.date)', 'totalDays')
    .addSelect('MIN(stats.date)', 'firstOrderDate')
    .addSelect('MAX(stats.date)', 'lastOrderDate')
    .where('stats.deleted_at IS NULL')
    .getRawOne();

  return {
    totalOrders: parseInt(result.totalOrders) || 0,
    totalRevenue: parseFloat(result.totalRevenue) || 0,
    totalDiscount: parseFloat(result.totalDiscount) || 0,
    avgOrderValue: parseFloat(result.avgOrderValue) || 0,
    pendingCount: parseInt(result.pendingCount) || 0,
    deliveredCount: parseInt(result.deliveredCount) || 0,
    cancelledCount: parseInt(result.cancelledCount) || 0,
    totalDays: parseInt(result.totalDays) || 0,
    firstOrderDate: result.firstOrderDate,
    lastOrderDate: result.lastOrderDate,
  };
}
}
