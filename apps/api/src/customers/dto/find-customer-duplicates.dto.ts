import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import {
  normalizePhone,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from '../../common/utils/phone.util.js';

export class FindCustomerDuplicatesDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizePhone(value) : value,
  )
  @IsString()
  @Matches(PHONE_PATTERN, { message: PHONE_INVALID_MESSAGE })
  phone!: string;

  /** Ignore this customer, usually the record currently being edited. */
  @IsOptional()
  @IsUUID()
  excludeId?: string;
}
