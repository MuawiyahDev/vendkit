import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsUUID()
  customerId!: string;

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
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  customerNote?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  internalNote?: string | null;
}
