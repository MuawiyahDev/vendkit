import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { QueryReportsDto } from './dto/query-reports.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Permissions('order:read', 'customer:read')
  @Get()
  getReport(@Query() query: QueryReportsDto) {
    return this.reportsService.getReport(query);
  }
}
