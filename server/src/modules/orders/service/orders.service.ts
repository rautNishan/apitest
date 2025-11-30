import { Repository } from "typeorm";
import { OrderEntity, OrderEntityName } from "../entity/orders.entity";
import { DBConnection } from "../../../database/connection/database.connection";
import { OrderRepository } from "../repository/orders.repository";
import { OrdersCreateDto } from "../dtos/orders.create.dto";
import {
  ICreateOptions,
  IFindAllOptions,
  IFindByIdOptions,
  IFindOneOption,
  IPaginatedData,
} from "../../../database/interfaces/database.interface";
import { orderStatsQueue } from "../../../jobs/queue/queue";
import { OrderStatus, PaymentStatus } from "../constants/enum/orders.enum";
import { getRedisClient } from "../../../common/redis/redis.connection";

export class OrderService {
  private _orderRepository: OrderRepository;

  private static _orderInstance: OrderService;

  private constructor() {
    const _repo: Repository<OrderEntity> =
      DBConnection.getConnection().getRepository(OrderEntity);
    this._orderRepository = new OrderRepository(_repo);
  }

  public static getInstance(): OrderService {
    if (!OrderService._orderInstance) {
      //If it is static use Class name instead of this keyword
      OrderService._orderInstance = new OrderService();
    }
    return OrderService._orderInstance;
  }

  async create(
    createDto: OrdersCreateDto,
    options?: ICreateOptions
  ): Promise<OrderEntity> {

    const data=await this._orderRepository.create(createDto)
    // Add job to stats queue
    await orderStatsQueue.add('order-stats-update', { orderId: data.id });

    return data;
  }

  async bulkCreate(createData: OrdersCreateDto[], options?: ICreateOptions): Promise<OrderEntity[]> {
    if (!createData || createData.length === 0) return [];
    return await this._orderRepository.bulkCreate(createData,options)
  }

  async getById(
    id: number | string,
    options?: IFindByIdOptions<OrderEntity>
  ): Promise<OrderEntity | null> {
     try {
      const order = await this._orderRepository.getById(id,options);
      return order
    } catch (error) {
      return error
    }
  }

  async getAllPaginated(
    options?: IFindAllOptions<OrderEntity>
  ): Promise<IPaginatedData<OrderEntity>> {
    const data = await this._orderRepository.getAllPaginated(options);
    return data;
  }

  async getOne(
    options: IFindOneOption<OrderEntity>
  ): Promise<OrderEntity | null> {
    const data = await this._orderRepository.getOne(options);
    return data;
  }
}
