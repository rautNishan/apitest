import { DataSource, QueryRunner } from "typeorm";
import { dataSource } from "../../../database/app.data-source";
import { DBConnection } from "../../../database/connection/database.connection";
import {
  ICreateOptions,
  IFindOneOption,
} from "../../../database/interfaces/database.interface";
import { OrdersCreateDto } from "../dtos/orders.create.dto";
import { OrderQueryDto } from "../dtos/orders.query.dto";
import { OrderEntity } from "../entity/orders.entity";
import { OrderService } from "../service/orders.service";
import {
  orderStatsQueue,
} from "../../../jobs/queue/queue";
import { bulkOrderCreateQueue } from "../../../jobs/queue/bulk.order.create.queue";

export class OrderController {
  private _orderService: OrderService;
  private _connection: DataSource;
  constructor() {
    this._orderService = OrderService.getInstance();
    this._connection = DBConnection.getConnection();
  }

  async create(data: OrdersCreateDto, options?: ICreateOptions) {
    const queryRunner: QueryRunner = this._connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const createdData = await this._orderService.create(data, {
        entityManager: queryRunner.manager,
      });
      await queryRunner.commitTransaction();
      await orderStatsQueue.add("order-stats-update", {
        orderId: createdData.id,
      });
      return createdData;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreate(data: OrdersCreateDto[], options?: ICreateOptions) {
  const job = await bulkOrderCreateQueue.add('bulk-create-orders', {
    orders: data,
  });

  return {
    message: 'Bulk order creation queued successfully',
    status: 'queued',
    jobId: job.id,
    orderCount: data.length,
  };
  }


  async getAll(options?: OrderQueryDto) {
    let searchBy = options?.searchBy;

    if (options?.search && (!searchBy || searchBy === "items")) {
      searchBy = "orderItemsTsv";
      options.search = "@@" + options.search;
    }

    const data = await this._orderService.getAllPaginated({
      options: {
        skip: options?.page,
        take: options?.limit,
        select: [
          "id",
          "discountAmount",
          "paymentMethod",
          "deliveredAt",
          "paymentStatus",
          "totalAmount",
          "subtotal",
        ],
      },
      search: options?.search,
      searchBy: searchBy,
      defaultSearchColumns: ["orderItemsTsv"],
      defaultSortColumn: "createdAt",
      withDeleted: options?.withDeleted,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
    });
    console.log("This is data: ", data);

    return data;
  }

  async getOne(
    options: IFindOneOption<OrderEntity>
  ): Promise<OrderEntity | null> {
    const data = await this._orderService.getOne(options);
    return data;
  }

  async getById(id: string) {
    return await this._orderService.getById(id);
  }
}
