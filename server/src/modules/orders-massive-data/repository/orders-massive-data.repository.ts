import { Repository } from "typeorm";
import { BaseRepository } from "../../../database/base/repository/base.repository";
import { OrdeMassiveEntity } from "../entity/orders-massive-data.entity";

export class OrderMassiveDataRepository extends BaseRepository<OrdeMassiveEntity> {
  constructor(private readonly repo: Repository<OrdeMassiveEntity>) {
    super(repo);
  }
}
