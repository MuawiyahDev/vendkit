import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { QueryDashboardDto } from './dto/query-dashboard.dto.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Permissions('order:read', 'product:read', 'customer:read', 'setting:read')
  @Get()
  getDashboard(@Query() query: QueryDashboardDto) {
    return this.dashboardService.getDashboard(query);
  }
}
