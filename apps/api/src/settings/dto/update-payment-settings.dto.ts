import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '@repo/database';
import {
  PAYMENT_BANK_FIELD_MAX_LENGTH,
  PAYMENT_INSTRUCTIONS_MAX_LENGTH,
  PAYMENT_REFERENCE_MAX_LENGTH,
  PAYMENT_TERMS_MAX_LENGTH,
} from '../settings.constants.js';
import { trimNullableString } from './settings-transforms.js';

export class UpdatePaymentSettingsDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(PaymentMethod, { each: true })
  enabledMethods?: PaymentMethod[];

  @IsOptional()
  @IsEnum(PaymentMethod)
  defaultMethod?: PaymentMethod;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_BANK_FIELD_MAX_LENGTH)
  bankAccountName?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_BANK_FIELD_MAX_LENGTH)
  bankName?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_REFERENCE_MAX_LENGTH)
  accountNumber?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_BANK_FIELD_MAX_LENGTH)
  branchName?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_REFERENCE_MAX_LENGTH)
  routingNumber?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_INSTRUCTIONS_MAX_LENGTH)
  paymentInstructions?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(PAYMENT_TERMS_MAX_LENGTH)
  defaultPaymentTerms?: string | null;
}
