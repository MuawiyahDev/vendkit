import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@repo/database';
import { emptyStringToNull } from '../../customers/dto/create-customer.dto.js';

export const CANCELLATION_REASON_MAX_LENGTH = 500;

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(CANCELLATION_REASON_MAX_LENGTH)
  cancellationReason?: string | null;
}
