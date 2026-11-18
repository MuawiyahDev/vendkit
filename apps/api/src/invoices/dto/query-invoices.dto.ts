import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { InvoiceStatus } from '@repo/database';
import {
  INVOICE_MAX_PAGE_SIZE,
  INVOICE_SEARCH_MAX_LENGTH,
} from '../invoices.constants.js';

export const INVOICE_SORT_ORDERS = ['asc', 'desc'] as const;
export type InvoiceSortOrder = (typeof INVOICE_SORT_ORDERS)[number];

export class QueryInvoicesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INVOICE_MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(INVOICE_SEARCH_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsIn(INVOICE_SORT_ORDERS)
  sortOrder?: InvoiceSortOrder;
}
