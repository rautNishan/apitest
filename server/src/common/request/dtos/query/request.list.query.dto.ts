import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { SORT_ORDER_ENUM } from "../../../../database/interfaces/database.interface";

export class RequestListQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  page?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === "true" ? true : false))
  withDeleted?: boolean;

  @IsOptional()
  @IsString()
  sortBy: string;

  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsEnum(SORT_ORDER_ENUM)
  sortOrder: SORT_ORDER_ENUM;

  @IsOptional()
  @IsString()
  searchBy: string;
}
