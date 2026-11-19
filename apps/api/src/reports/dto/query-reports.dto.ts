import { IsOptional, Matches } from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryReportsDto {
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from must use YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to must use YYYY-MM-DD' })
  to?: string;
}
