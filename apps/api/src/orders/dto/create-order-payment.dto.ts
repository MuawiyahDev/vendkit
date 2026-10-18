import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderPaymentStatus, PaymentMethod } from '@repo/database';
import { emptyStringToNull } from '../../customers/dto/create-customer.dto.js';
import { ORDER_NOTE_MAX_LENGTH } from './create-order.dto.js';

export const PAYMENT_REFERENCE_MAX_LENGTH = 100;

export const CREATABLE_PAYMENT_STATUSES = [
  OrderPaymentStatus.PENDING,
  OrderPaymentStatus.COMPLETED,
] as const;

export class CreateOrderPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsIn(CREATABLE_PAYMENT_STATUSES)
  status?: (typeof CREATABLE_PAYMENT_STATUSES)[number];

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @IsNotEmpty()
  @MaxLength(PAYMENT_REFERENCE_MAX_LENGTH)
  reference?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  note?: string | null;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
