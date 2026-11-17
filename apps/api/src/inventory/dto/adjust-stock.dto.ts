import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementReason } from '@repo/database';
import type { AdjustmentMode } from '../inventory.utils.js';

export const STOCK_ADJUSTMENT_MODES = [
  'increase',
  'decrease',
  'set',
] as const;

export const STOCK_NOTE_MAX_LENGTH = 500;

export class AdjustStockDto {
  @IsIn(STOCK_ADJUSTMENT_MODES)
  mode!: AdjustmentMode;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsEnum(StockMovementReason)
  reason!: StockMovementReason;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(STOCK_NOTE_MAX_LENGTH)
  note?: string;

  /**
   * Optional related order. Used for customer returns and to give the
   * movement history context without exposing internal ids to the user.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(50)
  orderNumber?: string;

  /**
   * Client-generated key so a retried request never applies the same stock
   * change twice.
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID()
  idempotencyKey?: string;
}
