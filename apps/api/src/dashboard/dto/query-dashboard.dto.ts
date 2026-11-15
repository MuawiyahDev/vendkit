import { IsIn, IsOptional, Matches } from 'class-validator';
import {
  DASHBOARD_PRESETS,
  type DashboardPreset,
} from '../dashboard.constants.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class QueryDashboardDto {
  @IsOptional()
  @IsIn(DASHBOARD_PRESETS)
  preset?: DashboardPreset;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'from must use YYYY-MM-DD',
  })
  from?: string;

  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, {
    message: 'to must use YYYY-MM-DD',
  })
  to?: string;
}
