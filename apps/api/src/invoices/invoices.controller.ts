import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { User } from '@repo/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { CancelInvoiceDto } from './dto/cancel-invoice.dto.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { QueryInvoicesDto } from './dto/query-invoices.dto.js';
import { InvoicesService } from './invoices.service.js';

@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Permissions('invoice:read')
  @Get('invoices')
  findAll(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.findAll(query);
  }

  @Permissions('invoice:read')
  @Get('invoices/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Permissions('invoice:read')
  @Get('orders/:orderId/invoice')
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.invoicesService.findByOrder(orderId);
  }

  @Permissions('invoice:create')
  @Post('orders/:orderId/invoice')
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: User,
  ) {
    return this.invoicesService.createForOrder(orderId, dto, user);
  }

  @Permissions('invoice:update')
  @Post('invoices/:id/issue')
  @HttpCode(HttpStatus.OK)
  issue(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.invoicesService.issue(id, user);
  }

  @Permissions('invoice:update')
  @Post('invoices/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.invoicesService.cancel(id, dto);
  }
}
