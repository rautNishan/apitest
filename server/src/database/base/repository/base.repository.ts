import { DeepPartial, Like, Repository } from "typeorm";
import { DataBaseBaseEntity } from "../entity/base.entity";
import {
  IBaseRepository,
  ICreateOptions,
  IFindAllOptions,
  IFindByIdOptions,
  IFindOneOption,
  IOnlyEntityManager,
  IPaginatedData,
  IUpdateOptions,
  SORT_ORDER_ENUM,
} from "../../interfaces/database.interface";
import { PAGINATION } from "../../../common/constants/pagination.constant";

export class BaseRepository<
  T extends DataBaseBaseEntity,
> implements IBaseRepository<T> {
  private _repo: Repository<T>;

  constructor(repo: Repository<T>) {
    this._repo = repo;
  }

  async create(
    createData: DeepPartial<T>,
    options?: ICreateOptions
  ): Promise<T> {
    let entityInstance: T;

    if (options?.entityManager) {
      //Since this create new entity instance so first we will create new entity instance
      entityInstance = options.entityManager.create(
        this._repo.target, //This is Entity like
        createData
      );
      //Pass this instance to save method which will insert the instance
      return await options.entityManager.save(entityInstance);
    }
    entityInstance = this._repo.create(createData);
    return await this._repo.save(entityInstance);
  }

  async bulkCreate(
    createData: DeepPartial<T>[],
    options?: ICreateOptions
  ): Promise<T[]> {
    if (options?.entityManager) {
      const entityInstances = options.entityManager.create(
        this._repo.target,
        createData
      );
      return await options.entityManager.save(entityInstances);
    }

    const entityInstances = this._repo.create(createData);
    return await this._repo.save(entityInstances);
  }

  async update(
    updateData: DeepPartial<T>,
    options?: IUpdateOptions
  ): Promise<T> {
    if (options?.entityManager) {
      return await options.entityManager.save(this._repo.target, updateData);
    }
    return await this._repo.save(updateData);
  }

  async getById(id: number | string, options?: IFindByIdOptions<T>): Promise<T | null> {
    const find: any = {
      ...options?.options,
      where: { id },
    };

    if (options?.withDeleted) {
      find.withDeleted = true;
    }

    if (options?.entityManager) {
      return await options.entityManager.findOne(this._repo.target, find);
    }

    return await this._repo.findOne(find);
  }

  async getOne(options?: IFindOneOption<T>): Promise<T | null> {
    const find: any = {};

    if (options?.withDeleted) {
      find.withDeleted = true;
    }

    if (options?.options?.where) {
      find.where = options.options.where;
    }

    if (options?.entityManager) {
      return await options.entityManager.findOne(this._repo.target, find);
    }

    return this._repo.findOne(find);
  }
  async getAllPaginated(
    options?: IFindAllOptions<T> | undefined
  ): Promise<IPaginatedData<T>> {
    //Page Number
    const pageNumber = options?.options?.skip ?? PAGINATION.DEFAULT_PAGE_NUMBER;

    //Limit
    const limit = options?.options?.take ?? PAGINATION.DEFAULT_LIMIT;

    delete options?.options?.take;
    delete options?.options?.skip;

    const findOptions: any = {
      skip: (pageNumber - 1) * limit,
      take: limit,
      ...options?.options,
    };

    // Default Sorting
    if (options?.defaultSortColumn) {
      findOptions.order = {
        [options.defaultSortColumn]:
          findOptions.sortOrder ??
          options.defaultSortOrder ??
          SORT_ORDER_ENUM.DESC,
      };
    }

    if (
      options?.sortBy &&
      options?.sortableColumns &&
      options?.sortableColumns?.includes(options?.sortBy as keyof T & string)
    ) {
      // Apply sorting based on specified column and order.
      findOptions.order = {
        [options.sortBy]: options.sortOrder,
      };
    }

    if (options?.withDeleted && options.withDeleted) {
      findOptions.withDeleted = true;
    }

    // Handle Full-Text Search
    if (options?.search && options?.searchBy) {
      const isFullTextSearch = options.search.startsWith("@@");
      const searchTerm = isFullTextSearch
        ? options.search.substring(2).trim()
        : options.search;

      if (isFullTextSearch) {
        console.log("fulltext");

        // Full-text search using tsvector
        const queryBuilder = this._repo.createQueryBuilder("entity");

        // Apply base find options
        queryBuilder.skip(findOptions.skip).take(findOptions.take);

        if (findOptions.withDeleted) {
          queryBuilder.withDeleted();
        }

        queryBuilder.andWhere(
          `entity.${options.searchBy} @@ to_tsquery('english', :searchTerm)`,
          { searchTerm: `${searchTerm}:*` }
        );
        // Apply sorting
        if (findOptions.order) {
          Object.entries(findOptions.order).forEach(([key, value]) => {
            queryBuilder.addOrderBy(`entity.${key}`, value as "ASC" | "DESC");
          });
        }

        // Apply relations if specified
        if (findOptions.relations) {
          const relations = Array.isArray(findOptions.relations)
            ? findOptions.relations
            : Object.keys(findOptions.relations);
          relations.forEach((relation: string) => {
            queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
          });
        }

        if (findOptions.where) {
          queryBuilder.andWhere(findOptions.where);
        }

        const [data, count] = await queryBuilder.getManyAndCount();

        return {
          _pagination: {
            pageNumber: pageNumber,
            limit: limit,
            totalData: count,
          },
          data: data,
        };
      } else {
        if (!findOptions.where) {
          findOptions.where = {};
        }
        findOptions.where[options.searchBy] = Like(`%${searchTerm}%`);
      }
    }

    // Execute standard query
    if (options?.entityManager) {
      const count = await options.entityManager.count(
        this._repo.target,
        findOptions
      );
      const data = await options.entityManager.find(
        this._repo.target,
        findOptions
      );
      return {
        _pagination: {
          pageNumber: pageNumber,
          limit: limit,
          totalData: count,
        },
        data: data,
      };
    }

    const data = await this._repo.find(findOptions);
    const count = await this._repo.count(findOptions);
    return {
      _pagination: {
        pageNumber: pageNumber,
        limit: limit,
        totalData: count,
      },
      data: data,
    };
  }

  async softDelete(entity: T, options?: IOnlyEntityManager): Promise<T> {
    entity.deletedAt = new Date();

    if (options?.entityManage) {
      return await options.entityManage.save(this._repo.target, entity);
    }
    return await this._repo.save(entity);
  }

  async restore(entity: T, options?: IOnlyEntityManager): Promise<T> {
    entity.deletedAt = null;
    if (options?.entityManage) {
      return await options.entityManage.save(this._repo.target, entity);
    }
    return await this._repo.save(entity);
  }

  async hardDelete(entity: T, options?: IOnlyEntityManager): Promise<T> {
    if (options?.entityManage) {
      return await options.entityManage.remove(entity);
    }
    return await this._repo.remove(entity);
  }

  createQueryBuilder(alias: string) {
    return this._repo.createQueryBuilder(alias);
  }
}
