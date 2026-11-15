import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '@repo/database';
import {
  DOCUMENT_PREFIX_MAX_LENGTH,
  DOCUMENT_PREFIX_PATTERN,
  ORDER_NOTES_MAX_LENGTH,
} from '../settings.constants.js';
import {
  trimNullableString,
  trimUppercaseString,
} from './settings-transforms.js';

const ALLOWED_DEFAULT_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
] as const;

export class UpdateOrderSettingsDto {
  @IsOptional()
  @Transform(trimUppercaseString)
  @IsString()
  @Matches(DOCUMENT_PREFIX_PATTERN, {
    message:
      'orderNumberPrefix may contain letters, numbers, dots, underscores, slashes and hyphens',
  })
  @MaxLength(DOCUMENT_PREFIX_MAX_LENGTH)
  orderNumberPrefix?: string;

  @IsOptional()
  @IsBoolean()
  automaticNumbering?: boolean;

  @IsOptional()
  @IsIn(ALLOWED_DEFAULT_ORDER_STATUSES)
  defaultStatus?: (typeof ALLOWED_DEFAULT_ORDER_STATUSES)[number];

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ORDER_NOTES_MAX_LENGTH)
  defaultNotes?: string | null;

  @IsOptional()
  @IsBoolean()
  allowEditing?: boolean;

  @IsOptional()
  @IsBoolean()
  requireCustomerInformation?: boolean;
}
