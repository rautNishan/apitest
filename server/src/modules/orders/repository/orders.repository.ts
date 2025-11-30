import { Repository } from "typeorm";
import { BaseRepository } from "../../../database/base/repository/base.repository";
import { OrderEntity } from "../entity/orders.entity";

export class OrderRepository extends BaseRepository<OrderEntity> {
  constructor(private readonly repo: Repository<OrderEntity>) {
    super(repo);
  }
}
