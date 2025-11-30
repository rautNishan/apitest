import { Repository } from "typeorm";
import { OrdeMassiveEntity } from "../entity/orders-massive-data.entity";
import { DBConnection } from "../../../database/connection/database.connection";
import { OrderMassiveDataRepository } from "../repository/orders-massive-data.repository";
import {
  ICreateOptions,
  IFindAllOptions,
  IFindByIdOptions,
  IFindOneOption,
  IPaginatedData,
} from "../../../database/interfaces/database.interface";

export class OrderMassiveDataService {
  private _orderMassiveRepository: OrderMassiveDataRepository;

  private static _orderInstance: OrderMassiveDataService;

  private constructor() {
    const _repo: Repository<OrdeMassiveEntity> =
      DBConnection.getConnection().getRepository(OrdeMassiveEntity);
    this._orderMassiveRepository = new OrderMassiveDataRepository(_repo);
  }

  public static getInstance(): OrderMassiveDataService {
    if (!OrderMassiveDataService._orderInstance) {
      //If it is static use Class name instead of this keyword
      OrderMassiveDataService._orderInstance = new OrderMassiveDataService();
    }
    return OrderMassiveDataService._orderInstance;
  }


  async getById(
    id: number,
    options?: IFindByIdOptions<OrdeMassiveEntity>
  ): Promise<OrdeMassiveEntity | null> {
    const data = await this._orderMassiveRepository.getById(id, options);
    return data;
  }

  async getAllPaginated(
    options?: IFindAllOptions<OrdeMassiveEntity>
  ): Promise<IPaginatedData<OrdeMassiveEntity>> {
    const data = await this._orderMassiveRepository.getAllPaginated(options);
    return data;
  }

  async getOne(
    options: IFindOneOption<OrdeMassiveEntity>
  ): Promise<OrdeMassiveEntity | null> {
    const data = await this._orderMassiveRepository.getOne(options);
    return data;
  }
}
