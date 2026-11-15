import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
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
  BUSINESS_DESCRIPTION_MAX_LENGTH,
  BUSINESS_EMAIL_MAX_LENGTH,
  BUSINESS_LEGAL_NAME_MAX_LENGTH,
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_PHONE_MAX_LENGTH,
  BUSINESS_REGISTRATION_MAX_LENGTH,
  BUSINESS_TAX_ID_MAX_LENGTH,
  BUSINESS_WEBSITE_MAX_LENGTH,
} from '../settings.constants.js';
import { trimNullableString, trimString } from './settings-transforms.js';

function normalizeOptionalPhone({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : normalizePhone(trimmed);
}

export class UpdateBusinessProfileDto {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(BUSINESS_NAME_MAX_LENGTH)
  businessName?: string;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(BUSINESS_LEGAL_NAME_MAX_LENGTH)
  legalName?: string | null;

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
  @Transform(normalizeOptionalPhone)
  @Matches(PHONE_PATTERN, { message: PHONE_INVALID_MESSAGE })
  @MaxLength(BUSINESS_PHONE_MAX_LENGTH)
  alternativePhone?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(BUSINESS_WEBSITE_MAX_LENGTH)
  website?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(BUSINESS_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(BUSINESS_REGISTRATION_MAX_LENGTH)
  registrationNumber?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(BUSINESS_TAX_ID_MAX_LENGTH)
  taxIdentificationNumber?: string | null;

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
}
