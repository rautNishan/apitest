import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
} from "typeorm";

export enum SORT_ORDER_ENUM {
  ASC = 'ASC',
  DESC = 'DESC',
}


//Base Repository Interface
export interface IBaseRepository<T> {
  create(createData: DeepPartial<T>, options?: ICreateOptions): Promise<T>;
  update(data: DeepPartial<T>, options?: IUpdateOptions): Promise<T>;
  getById(id: number, options?: IFindByIdOptions<T>): Promise<T | null>;
  getOne(options?: IFindOneOption<T>): Promise<T | null>;
  getAllPaginated(options?: IFindAllOptions<T>): Promise<IPaginatedData<T>>;
  softDelete(entity: T, options?: IOnlyEntityManager): Promise<T>;
  restore(entity: T, options?: IOnlyEntityManager): Promise<T>;
  hardDelete(entity: T, options?: IOnlyEntityManager): Promise<T>;
}
export interface IPaginationSetting<T = Record<string, any>> {
  sortableColumns?: (keyof T)[] | string[];
  searchableColumns?: (keyof T)[] | string[];
  defaultSearchColumns?: (keyof T)[] | string[];
  defaultSortColumn?: keyof T | string;
  defaultSortOrder?: SORT_ORDER_ENUM.DESC;
  canSkipPagination?: boolean;
}

export interface ICreateOptions {
  listeners?: boolean;
  transaction?: boolean;
  entityManager?: EntityManager;
}

export interface IUpdateOptions {
  entityManager?: EntityManager;
}

export interface IFindByIdOptions<T> {
  entityManager?: EntityManager;
  options?: FindOneOptions<T>;
  withDeleted?: boolean;
}

export interface IFindOneOption<T> {
  entityManager?: EntityManager;
  options?: FindOneOptions<T>;
  withDeleted?: boolean;
}

export interface IFindAllOptions<T> extends IPaginationSetting<T>{
  entityManager?: EntityManager;
  options?: FindManyOptions<T>;
  withDeleted?: boolean;
  sortOrder?: SORT_ORDER_ENUM;
  sortBy?: string;
  search?: string;
  searchBy?: string;
}

export interface ISoftDelete {
  entityManage?: EntityManager;
}

export interface IRestore {
  entityManage?: EntityManager;
}

export interface IOnlyEntityManager {
  entityManage?: EntityManager;
}

export interface IPaginatedData<T> {
  _pagination: {
    pageNumber: number;
    limit: number;
    totalData: number;
  };
  data: T[];
}