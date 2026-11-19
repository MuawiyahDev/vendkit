import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
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
  CUSTOMER_NOTES_MAX_LENGTH,
  CUSTOMER_POSTAL_CODE_MAX_LENGTH,
  emptyStringToNull,
} from '../../customers/dto/create-customer.dto.js';

export const MAX_ORDER_AMOUNT_DECIMAL_PLACES = 2;
export const MAX_ORDER_ITEM_QUANTITY = 100000;
export const MAX_ORDER_ITEM_LINES = 100;
export const ORDER_NOTE_MAX_LENGTH = CUSTOMER_NOTES_MAX_LENGTH;
export const ORDER_NUMBER_MAX_LENGTH = 50;
export const ORDER_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9._/-]*$/;
export const SHIPPING_CARRIER_MAX_LENGTH = 100;
export const TRACKING_NUMBER_MAX_LENGTH = 100;

export class CreateOrderItemDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_ITEM_QUANTITY)
  quantity!: number;
}

export class CreateOrderDto {
  /**
   * Existing customer to attach the order to. When omitted, the order is a
   * walk-in/guest order and `guestName` becomes required.
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ValidateIf((dto: CreateOrderDto) => dto.customerId === undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH)
  guestName?: string;

  /**
   * Guest phone. Optional in general, but required when `saveCustomer` is
   * set because a saved customer must have one (enforced in the service).
   */
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
  guestPhone?: string | null;

  /**
   * Walk-in orders only: also persist the guest details as a customer so
   * they show up in the customers list and future orders.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
  @IsBoolean()
  saveCustomer?: boolean;

  /**
   * Only accepted when automatic order numbering is disabled in Settings.
   * Automatic numbering rejects client-supplied order numbers.
   */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(ORDER_NUMBER_PATTERN, {
    message:
      'orderNumber may contain letters, numbers, dots, underscores, slashes and hyphens',
  })
  @MaxLength(ORDER_NUMBER_MAX_LENGTH)
  orderNumber?: string;

  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_ORDER_ITEM_LINES)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: MAX_ORDER_AMOUNT_DECIMAL_PLACES })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: MAX_ORDER_AMOUNT_DECIMAL_PLACES })
  @Min(0)
  shippingFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: MAX_ORDER_AMOUNT_DECIMAL_PLACES })
  @Min(0)
  taxAmount?: number;

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
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  customerNote?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  internalNote?: string | null;
}
