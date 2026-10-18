import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
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
  CUSTOMER_POSTAL_CODE_MAX_LENGTH,
  emptyStringToNull,
} from '../../customers/dto/create-customer.dto.js';
import { ORDER_NOTE_MAX_LENGTH } from './create-order.dto.js';

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
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  customerNote?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(ORDER_NOTE_MAX_LENGTH)
  internalNote?: string | null;
}
