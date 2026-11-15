import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TaxPricingMode } from '@repo/database';
import {
  MAX_TAX_RATE,
  TAX_ID_MAX_LENGTH,
  TAX_NAME_MAX_LENGTH,
} from '../settings.constants.js';
import { trimNullableString, trimString } from './settings-transforms.js';

export class UpdateTaxSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(TAX_NAME_MAX_LENGTH)
  defaultName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_TAX_RATE)
  defaultRate?: number;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(TAX_ID_MAX_LENGTH)
  taxIdentificationNumber?: string | null;

  @IsOptional()
  @IsEnum(TaxPricingMode)
  pricingMode?: TaxPricingMode;

  @IsOptional()
  @IsBoolean()
  showBreakdownOnInvoice?: boolean;
}
