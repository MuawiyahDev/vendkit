import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderPaymentStatusDto } from './dto/update-order-payment-status.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Permissions('order:create')
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Permissions('order:read')
  @Get()
  findAll(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(query);
  }

  @Permissions('order:read')
  @Get('number/:orderNumber')
  findByNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Permissions('order:read')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Permissions('order:update')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, dto);
  }

  @Permissions('order:update')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Permissions('order:create')
  @Post(':id/payments')
  createPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOrderPaymentDto,
  ) {
    return this.ordersService.createPayment(id, dto);
  }

  @Permissions('order:read')
  @Get(':id/payments')
  listPayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.listPayments(id);
  }

  @Permissions('order:update')
  @Patch(':id/payments/:paymentId/status')
  updatePaymentStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: UpdateOrderPaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentId, dto);
  }

  @Permissions('order:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.remove(id);
  }
}
