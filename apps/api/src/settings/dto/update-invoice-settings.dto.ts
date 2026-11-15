import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrencyDisplayFormat,
  InvoiceDefaultStatus,
} from '@repo/database';
import {
  normalizePhone,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from '../../common/utils/phone.util.js';
import {
  ADDRESS_CITY_MAX_LENGTH,
  ADDRESS_COUNTRY_MAX_LENGTH,
  ADDRESS_LINE_MAX_LENGTH,
  ADDRESS_POSTAL_CODE_MAX_LENGTH,
  ADDRESS_STATE_MAX_LENGTH,
  BUSINESS_EMAIL_MAX_LENGTH,
  BUSINESS_PHONE_MAX_LENGTH,
  DOCUMENT_PREFIX_MAX_LENGTH,
  DOCUMENT_PREFIX_PATTERN,
  INVOICE_ADDITIONAL_INFO_MAX_LENGTH,
  INVOICE_FOOTER_MAX_LENGTH,
  INVOICE_NOTES_MAX_LENGTH,
  INVOICE_NUMBER_FORMAT_MAX_LENGTH,
  INVOICE_NUMBER_FORMAT_PATTERN,
  INVOICE_PAYMENT_TERMS_MAX_LENGTH,
  MAX_DUE_PERIOD_DAYS,
  MAX_SEQUENCE_VALUE,
} from '../settings.constants.js';
import {
  trimNullableString,
  trimString,
  trimUppercaseString,
} from './settings-transforms.js';

function normalizeOptionalPhone({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : normalizePhone(trimmed);
}

export class UpdateInvoiceSettingsDto {
  @IsOptional()
  @IsBoolean()
  useBusinessProfile?: boolean;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(200)
  displayName?: string | null;

  @IsOptional()
  @IsUUID()
  logoImageId?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsEmail()
  @MaxLength(BUSINESS_EMAIL_MAX_LENGTH)
  email?: string | null;

  @IsOptional()
  @Transform(normalizeOptionalPhone)
  @Matches(PHONE_PATTERN, { message: PHONE_INVALID_MESSAGE })
  @MaxLength(BUSINESS_PHONE_MAX_LENGTH)
  phone?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_LINE_MAX_LENGTH)
  addressLine1?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_LINE_MAX_LENGTH)
  addressLine2?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_CITY_MAX_LENGTH)
  city?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_STATE_MAX_LENGTH)
  state?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_POSTAL_CODE_MAX_LENGTH)
  postalCode?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(ADDRESS_COUNTRY_MAX_LENGTH)
  country?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(100)
  taxRegistrationNumber?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(INVOICE_ADDITIONAL_INFO_MAX_LENGTH)
  additionalInfo?: string | null;

  @IsOptional()
  @Transform(trimUppercaseString)
  @IsString()
  @Matches(DOCUMENT_PREFIX_PATTERN, {
    message:
      'numberPrefix may contain letters, numbers, dots, underscores, slashes and hyphens',
  })
  @MaxLength(DOCUMENT_PREFIX_MAX_LENGTH)
  numberPrefix?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @Matches(INVOICE_NUMBER_FORMAT_PATTERN, {
    message:
      'numberFormat must contain {sequence} and may only use {prefix}, {year}, {month} and {sequence}',
  })
  @MaxLength(INVOICE_NUMBER_FORMAT_MAX_LENGTH)
  numberFormat?: string;

  @IsOptional()
  @IsBoolean()
  yearBasedNumbering?: boolean;

  @IsOptional()
  @IsBoolean()
  automaticNumbering?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SEQUENCE_VALUE)
  startingSequence?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_DUE_PERIOD_DAYS)
  duePeriodDays?: number;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(INVOICE_PAYMENT_TERMS_MAX_LENGTH)
  paymentTerms?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(INVOICE_NOTES_MAX_LENGTH)
  notes?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(INVOICE_FOOTER_MAX_LENGTH)
  footerText?: string | null;

  @IsOptional()
  @IsEnum(CurrencyDisplayFormat)
  currencyDisplayFormat?: CurrencyDisplayFormat;

  @IsOptional()
  @IsBoolean()
  showSku?: boolean;

  @IsOptional()
  @IsBoolean()
  showTaxBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  showDiscountBreakdown?: boolean;

  @IsOptional()
  @IsEnum(InvoiceDefaultStatus)
  defaultStatus?: InvoiceDefaultStatus;

  @IsOptional()
  @IsBoolean()
  allowEditingAfterIssue?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCancellation?: boolean;
}
