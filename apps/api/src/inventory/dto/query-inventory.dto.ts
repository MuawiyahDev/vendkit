import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  INVENTORY_MAX_PAGE_SIZE,
  INVENTORY_SORT_FIELDS,
  INVENTORY_STATUSES,
  SORT_ORDERS,
  type InventorySortField,
  type InventoryStatus,
  type SortOrder,
} from '../inventory.constants.js';

export class QueryInventoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INVENTORY_MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(INVENTORY_STATUSES)
  status?: InventoryStatus;

  @IsOptional()
  @IsIn(INVENTORY_SORT_FIELDS)
  sortBy?: InventorySortField;

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;
}
