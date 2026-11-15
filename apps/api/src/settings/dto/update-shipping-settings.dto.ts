import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_SHIPPING_CHARGE,
  SHIPPING_INSTRUCTIONS_MAX_LENGTH,
  SHIPPING_METHOD_MAX_LENGTH,
} from '../settings.constants.js';
import { trimNullableString } from './settings-transforms.js';

export class UpdateShippingSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_SHIPPING_CHARGE)
  defaultCharge?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_SHIPPING_CHARGE)
  freeShippingThreshold?: number | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(SHIPPING_INSTRUCTIONS_MAX_LENGTH)
  deliveryInstructions?: string | null;

  @IsOptional()
  @Transform(trimNullableString)
  @IsString()
  @MaxLength(SHIPPING_METHOD_MAX_LENGTH)
  defaultDeliveryMethod?: string | null;
}
