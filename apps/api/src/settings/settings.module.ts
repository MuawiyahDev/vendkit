import { Module } from '@nestjs/common';
import { InvoiceNumberingService } from './invoice-numbering.service.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, InvoiceNumberingService],
  exports: [SettingsService, InvoiceNumberingService],
})
export class SettingsModule {}
