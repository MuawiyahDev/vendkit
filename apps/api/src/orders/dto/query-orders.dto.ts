import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderStatus, PaymentStatus } from '@repo/database';

export const MAX_PAGE_SIZE = 100;

export const ORDER_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'orderNumber',
  'totalAmount',
] as const;

export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

export const ORDER_SORT_ORDERS = ['asc', 'desc'] as const;

export type OrderSortOrder = (typeof ORDER_SORT_ORDERS)[number];

const ORDER_STATUS_VALUES = Object.values(OrderStatus);

const PAYMENT_STATUS_VALUES = Object.values(PaymentStatus);

export class QueryOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(ORDER_STATUS_VALUES)
  status?: OrderStatus;

  @IsOptional()
  @IsIn(PAYMENT_STATUS_VALUES)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(ORDER_SORT_FIELDS)
  sortBy?: OrderSortField;

  @IsOptional()
  @IsIn(ORDER_SORT_ORDERS)
  sortOrder?: OrderSortOrder;
}
