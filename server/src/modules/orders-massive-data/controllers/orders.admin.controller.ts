import { DataSource, QueryRunner } from "typeorm";
import { dataSource } from "../../../database/app.data-source";
import { DBConnection } from "../../../database/connection/database.connection";
import {
  ICreateOptions,
  IFindOneOption,
} from "../../../database/interfaces/database.interface";
import { OrderQueryDto } from "../dtos/orders-massive-data.query.dto";
import { OrdeMassiveEntity } from "../entity/orders-massive-data.entity";
import { orderStatsQueue } from "../../../jobs/queue/queue";
import { OrderMassiveDataService } from "../service/orders-massive-data.service";

export class OrderMassiveDataController {
  private _orderMassiveDataService: OrderMassiveDataService;
  private _connection: DataSource;
  constructor() {
    this._orderMassiveDataService = OrderMassiveDataService.getInstance();
    this._connection = DBConnection.getConnection();
  }
  async getAll(options?: OrderQueryDto) {
    let searchBy = options?.searchBy;

    if (options?.search && (!searchBy || searchBy === "items")) {
      searchBy = "orderItemsTsv";
      options.search = "@@" + options.search;
    }

    const data = await this._orderMassiveDataService.getAllPaginated({
      options: {
        skip: options?.page,
        take: options?.limit,
        select:["id","userId","status"]
      },
      search: options?.search,
      searchBy: searchBy,
      defaultSearchColumns: ["orderItemsTsv"],
      defaultSortColumn: "createdAt",
      withDeleted: options?.withDeleted,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    });
    return data;
  }

  async getOne(
    options: IFindOneOption<OrdeMassiveEntity>
  ): Promise<OrdeMassiveEntity | null> {
    const data = await this._orderMassiveDataService.getOne(options);
    return data;
  }
}
