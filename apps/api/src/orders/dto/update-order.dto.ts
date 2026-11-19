import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OrderSource } from '@repo/database';
import {
  normalizePhone,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from '../../common/utils/phone.util.js';
import {
  CUSTOMER_ADDRESS_MAX_LENGTH,
  CUSTOMER_CITY_MAX_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_POSTAL_CODE_MAX_LENGTH,
  emptyStringToNull,
} from '../../customers/dto/create-customer.dto.js';
import {
  CreateOrderItemDto,
  MAX_ORDER_ITEM_LINES,
  ORDER_NOTE_MAX_LENGTH,
  SHIPPING_CARRIER_MAX_LENGTH,
  TRACKING_NUMBER_MAX_LENGTH,
} from './create-order.dto.js';

export class UpdateOrderDto {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH)
  shippingName?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : normalizePhone(trimmed);
  })
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_INVALID_MESSAGE })
  shippingPhone?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(CUSTOMER_ADDRESS_MAX_LENGTH)
  shippingAddress?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(CUSTOMER_CITY_MAX_LENGTH)
  shippingCity?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(CUSTOMER_POSTAL_CODE_MAX_LENGTH)
  shippingPostalCode?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(SHIPPING_CARRIER_MAX_LENGTH)
  shippingCarrier?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(TRACKING_NUMBER_MAX_LENGTH)
  trackingNumber?: string | null;

  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  customerNote?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  internalNote?: string | null;

  /**
   * Replaces the order lines when provided. Quantities are merged per
   * product and only the stock delta is applied.
   */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_ORDER_ITEM_LINES)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
