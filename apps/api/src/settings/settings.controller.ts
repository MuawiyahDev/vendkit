import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { UpdateInvoiceSettingsDto } from './dto/update-invoice-settings.dto.js';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';
import { UpdateOrderSettingsDto } from './dto/update-order-settings.dto.js';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto.js';
import { UpdateRegionalSettingsDto } from './dto/update-regional-settings.dto.js';
import { UpdateShippingSettingsDto } from './dto/update-shipping-settings.dto.js';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto.js';
import { SettingsCategory } from './settings.constants.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Permissions('setting:read')
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Permissions('setting:read')
  @Get(':category')
  getCategory(
    @Param('category', new ParseEnumPipe(SettingsCategory))
    category: SettingsCategory,
  ) {
    return this.settingsService.getCategory(category);
  }

  @Permissions('setting:update')
  @Patch('business-profile')
  updateBusinessProfile(@Body() dto: UpdateBusinessProfileDto) {
    return this.settingsService.updateBusinessProfile(dto);
  }

  @Permissions('setting:update')
  @Patch('invoice')
  updateInvoice(@Body() dto: UpdateInvoiceSettingsDto) {
    return this.settingsService.updateInvoiceSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('regional')
  updateRegional(@Body() dto: UpdateRegionalSettingsDto) {
    return this.settingsService.updateRegionalSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('tax')
  updateTax(@Body() dto: UpdateTaxSettingsDto) {
    return this.settingsService.updateTaxSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('order')
  updateOrder(@Body() dto: UpdateOrderSettingsDto) {
    return this.settingsService.updateOrderSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('payment')
  updatePayment(@Body() dto: UpdatePaymentSettingsDto) {
    return this.settingsService.updatePaymentSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('shipping')
  updateShipping(@Body() dto: UpdateShippingSettingsDto) {
    return this.settingsService.updateShippingSettings(dto);
  }

  @Permissions('setting:update')
  @Patch('notification')
  updateNotification(@Body() dto: UpdateNotificationSettingsDto) {
    return this.settingsService.updateNotificationSettings(dto);
  }

  @Permissions('setting:update')
  @HttpCode(HttpStatus.OK)
  @Post(':category/reset')
  resetCategory(
    @Param('category', new ParseEnumPipe(SettingsCategory))
    category: SettingsCategory,
  ) {
    return this.settingsService.resetCategory(category);
  }
}
