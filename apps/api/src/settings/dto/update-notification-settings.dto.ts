import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  BUSINESS_EMAIL_MAX_LENGTH,
  NOTIFICATION_SENDER_MAX_LENGTH,
} from '../settings.constants.js';
import { trimNullableString, trimString } from './settings-transforms.js';

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @Transform(trimNullableString)
  @IsEmail()
  @MaxLength(BUSINESS_EMAIL_MAX_LENGTH)
  businessNotificationEmail?: string | null;

  @IsOptional()
  @IsBoolean()
  orderConfirmationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  invoiceEnabled?: boolean;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(NOTIFICATION_SENDER_MAX_LENGTH)
  senderName?: string;

  @IsOptional()
  @Transform(trimNullableString)
  @IsEmail()
  @MaxLength(BUSINESS_EMAIL_MAX_LENGTH)
  replyToEmail?: string | null;
}
