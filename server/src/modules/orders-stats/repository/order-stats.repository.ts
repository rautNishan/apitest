import { Repository } from "typeorm";
import { BaseRepository } from "../../../database/base/repository/base.repository";
import { OrderStatsEntity } from "../entity/order-stats.entity";

export class OrderStatsRepository extends BaseRepository<OrderStatsEntity> {
  constructor(private readonly repo: Repository<OrderStatsEntity>) {
    super(repo);
  }
}
