import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  INVOICE_NUMBER_MAX_LENGTH,
  INVOICE_NUMBER_PATTERN,
} from '../invoices.constants.js';

export class CreateInvoiceDto {
  /**
   * Required only when automatic numbering is disabled in settings. When
   * automatic numbering is on, any supplied value is ignored.
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(INVOICE_NUMBER_MAX_LENGTH)
  @Matches(INVOICE_NUMBER_PATTERN, {
    message:
      'Invoice number may only contain letters, numbers, dots, dashes, underscores, or slashes',
  })
  invoiceNumber?: string;
}
