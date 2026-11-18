import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { emptyStringToNull } from '../../customers/dto/create-customer.dto.js';
import { INVOICE_CANCELLATION_REASON_MAX_LENGTH } from '../invoices.constants.js';

export class CancelInvoiceDto {
  @IsOptional()
  @Transform(emptyStringToNull)
  @IsString()
  @MaxLength(INVOICE_CANCELLATION_REASON_MAX_LENGTH)
  cancellationReason?: string | null;
}
