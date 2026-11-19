import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { User } from '@repo/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { QueryInventoryDto } from './dto/query-inventory.dto.js';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto.js';
import { UpdateInventorySettingsDto } from './dto/update-inventory-settings.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Permissions('inventory:read')
  @Get('overview')
  getOverview() {
    return this.inventoryService.getOverview();
  }

  @Permissions('inventory:read')
  @Get('export')
  exportCsv(@Query() query: QueryInventoryDto) {
    return this.inventoryService.exportCsv(query);
  }

  @Permissions('inventory:read')
  @Get('movements')
  listMovements(@Query() query: QueryStockMovementsDto) {
    return this.inventoryService.listMovements(query);
  }

  @Permissions('inventory:read')
  @Get()
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Permissions('inventory:read')
  @Get('products/:productId')
  findOne(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.findOne(productId);
  }

  @Permissions('inventory:update')
  @Patch('products/:productId/settings')
  updateSettings(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateInventorySettingsDto,
  ) {
    return this.inventoryService.updateSettings(productId, dto);
  }

  @Permissions('inventory:update')
  @Post('products/:productId/adjustments')
  adjustStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: User,
  ) {
    return this.inventoryService.adjustStock(productId, dto, user);
  }
}
