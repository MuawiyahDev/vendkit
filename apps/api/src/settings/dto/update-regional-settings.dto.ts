import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsISO31661Alpha2,
  IsISO4217CurrencyCode,
  IsInt,
  IsLocale,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrencyPosition } from '@repo/database';
import {
  MAX_DECIMAL_PRECISION,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_FORMATS,
} from '../settings.constants.js';
import {
  trimNullableString,
  trimString,
  trimUppercaseString,
} from './settings-transforms.js';

export class UpdateRegionalSettingsDto {
  @IsOptional()
  @Transform(trimUppercaseString)
  @IsISO4217CurrencyCode()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  currencySymbol?: string;

  @IsOptional()
  @IsEnum(CurrencyPosition)
  currencyPosition?: CurrencyPosition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_DECIMAL_PRECISION)
  decimalPrecision?: number;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(3)
  thousandSeparator?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(3)
  decimalSeparator?: string | null;

  @IsOptional()
  @Transform(trimUppercaseString)
  @IsISO31661Alpha2()
  @MaxLength(2)
  defaultCountry?: string;

  @IsOptional()
  @Transform(trimString)
  @IsTimeZone()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @Transform(trimString)
  @IsIn(SUPPORTED_DATE_FORMATS)
  dateFormat?: string;

  @IsOptional()
  @Transform(trimString)
  @IsIn(SUPPORTED_TIME_FORMATS)
  timeFormat?: string;

  @IsOptional()
  @Transform(trimString)
  @IsLocale()
  @MaxLength(10)
  language?: string;
}
