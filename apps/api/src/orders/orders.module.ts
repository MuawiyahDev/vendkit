import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { OrdersController } from './orders.controller.js';
import { OrderEventsService } from './order-events.service.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [SettingsModule, InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsService],
  exports: [OrdersService, OrderEventsService],
})
export class OrdersModule {}
