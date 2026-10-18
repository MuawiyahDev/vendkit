import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  type Order,
} from '@repo/database';
import {
  isPhoneLike,
  normalizePhone,
} from '../common/utils/phone.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderPaymentStatusDto } from './dto/update-order-payment-status.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import {
  DEFAULT_CURRENCY,
  DEFAULT_PAGE_SIZE,
  MAX_ORDER_NUMBER_ATTEMPTS,
  ORDER_DETAIL_INCLUDE,
  ORDER_SUMMARY_INCLUDE,
} from './orders.constants.js';
import {
  toOrderResponse,
  toOrderSummaryResponse,
  toPaymentResponse,
} from './orders.mapper.js';
import type {
  OrderPaymentResponse,
  OrderResponse,
  OrderWithRelations,
  PaginatedOrders,
  TransactionClient,
} from './orders.types.js';
import {
  buildOrderOrderBy,
  canTransitionOrderStatus,
  canTransitionPaymentStatus,
  derivePaymentStatus,
  generateOrderNumber,
  isUniqueConstraintViolation,
  mapOrderKnownErrors,
  mergeItemQuantities,
  parseDateBoundary,
} from './orders.utils.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto): Promise<OrderResponse> {
    await this.ensureCustomerExists(dto.customerId);

    const quantities = mergeItemQuantities(dto.items);
    const productIds = [...quantities.keys()];

    const discountAmount = new Prisma.Decimal(dto.discountAmount ?? 0);
    const shippingFee = new Prisma.Decimal(dto.shippingFee ?? 0);
    const taxAmount = new Prisma.Decimal(dto.taxAmount ?? 0);

    for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = generateOrderNumber();

      try {
        const order = await this.prisma.client.$transaction(async (tx) => {
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
              isActive: true,
            },
          });
          const productById = new Map(products.map((p) => [p.id, p]));

          for (const productId of productIds) {
            if (!productById.has(productId)) {
              throw new NotFoundException('One or more products not found');
            }
          }

          for (const product of products) {
            if (!product.isActive) {
              throw new BadRequestException(
                `Product "${product.name}" is not available for sale`,
              );
            }
          }

          const lines = productIds.map((productId) => {
            const product = productById.get(productId);
            if (!product) {
              throw new NotFoundException('One or more products not found');
            }

            const quantity = quantities.get(productId) ?? 0;
            const lineTotal = product.sellingPrice.mul(quantity);

            return {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              unitPrice: product.sellingPrice,
              quantity,
              lineTotal,
            };
          });

          let subtotal = new Prisma.Decimal(0);
          for (const line of lines) {
            subtotal = subtotal.add(line.lineTotal);
          }

          if (discountAmount.gt(subtotal)) {
            throw new BadRequestException(
              'Order discount cannot exceed the subtotal',
            );
          }

          const totalAmount = subtotal
            .minus(discountAmount)
            .plus(shippingFee)
            .plus(taxAmount);

          for (const line of lines) {
            const deducted = await tx.product.updateMany({
              where: {
                id: line.productId,
                isActive: true,
                stockQuantity: { gte: line.quantity },
              },
              data: { stockQuantity: { decrement: line.quantity } },
            });

            if (deducted.count === 0) {
              throw new ConflictException(
                `Insufficient stock for product "${line.productName}"`,
              );
            }
          }

          const customer = await tx.customer.findUnique({
            where: { id: dto.customerId },
            select: {
              name: true,
              phone: true,
              address: true,
              city: true,
              postalCode: true,
            },
          });

          if (!customer) {
            throw new NotFoundException('Customer not found');
          }

          return tx.order.create({
            data: {
              orderNumber,
              customerId: dto.customerId,
              status: OrderStatus.PENDING,
              paymentStatus: PaymentStatus.UNPAID,
              currency: DEFAULT_CURRENCY,
              subtotal,
              discountAmount,
              shippingFee,
              taxAmount,
              totalAmount,
              amountPaid: new Prisma.Decimal(0),
              stockDeducted: true,
              shippingName: dto.shippingName ?? customer.name,
              shippingPhone: dto.shippingPhone ?? customer.phone,
              shippingAddress: dto.shippingAddress ?? customer.address,
              shippingCity: dto.shippingCity ?? customer.city,
              shippingPostalCode:
                dto.shippingPostalCode ?? customer.postalCode,
              customerNote: dto.customerNote ?? null,
              internalNote: dto.internalNote ?? null,
              items: {
                create: lines.map((line) => ({
                  productId: line.productId,
                  productName: line.productName,
                  sku: line.sku,
                  unitPrice: line.unitPrice,
                  quantity: line.quantity,
                  lineTotal: line.lineTotal,
                })),
              },
            },
            include: ORDER_DETAIL_INCLUDE,
          });
        });

        return toOrderResponse(order);
      } catch (error) {
        if (
          isUniqueConstraintViolation(error) &&
          attempt < MAX_ORDER_NUMBER_ATTEMPTS
        ) {
          continue;
        }

        throw mapOrderKnownErrors(error);
      }
    }

    throw new ConflictException(
      'Unable to generate a unique order number; please try again',
    );
  }

  async findAll(query: QueryOrdersDto): Promise<PaginatedOrders> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const search = query.search || undefined;

    if (
      query.dateFrom !== undefined &&
      query.dateTo !== undefined &&
      parseDateBoundary(query.dateFrom, false).getTime() >
        parseDateBoundary(query.dateTo, true).getTime()
    ) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    const conditions: Prisma.OrderWhereInput[] = [];

    if (search) {
      const searchConditions: Prisma.OrderWhereInput[] = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];

      if (isPhoneLike(search)) {
        const phoneTerm = normalizePhone(search);

        if (phoneTerm) {
          searchConditions.push({
            customer: { phone: { contains: phoneTerm } },
          });
        }
      }

      conditions.push({ OR: searchConditions });
    }

    if (query.status) {
      conditions.push({ status: query.status });
    }

    if (query.paymentStatus) {
      conditions.push({ paymentStatus: query.paymentStatus });
    }

    if (query.customerId) {
      conditions.push({ customerId: query.customerId });
    }

    if (query.dateFrom !== undefined || query.dateTo !== undefined) {
      conditions.push({
        createdAt: {
          ...(query.dateFrom !== undefined
            ? { gte: parseDateBoundary(query.dateFrom, false) }
            : {}),
          ...(query.dateTo !== undefined
            ? { lte: parseDateBoundary(query.dateTo, true) }
            : {}),
        },
      });
    }

    const where: Prisma.OrderWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.client.order.findMany({
        where,
        include: ORDER_SUMMARY_INCLUDE,
        orderBy: buildOrderOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.order.count({ where }),
    ]);

    return {
      data: data.map((order) => toOrderSummaryResponse(order)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<OrderResponse> {
    const order = await this.prisma.client.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return toOrderResponse(order);
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderResponse> {
    const order = await this.prisma.client.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return toOrderResponse(order);
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderResponse> {
    const existing = await this.prisma.client.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Cancelled orders cannot be modified');
    }

    const data: Prisma.OrderUpdateInput = {};

    if (dto.customerId !== undefined) {
      await this.ensureCustomerExists(dto.customerId);
      data.customer = { connect: { id: dto.customerId } };
    }

    if (dto.shippingName !== undefined) {
      data.shippingName = dto.shippingName;
    }

    if (dto.shippingPhone !== undefined) {
      data.shippingPhone = dto.shippingPhone;
    }

    if (dto.shippingAddress !== undefined) {
      data.shippingAddress = dto.shippingAddress;
    }

    if (dto.shippingCity !== undefined) {
      data.shippingCity = dto.shippingCity;
    }

    if (dto.shippingPostalCode !== undefined) {
      data.shippingPostalCode = dto.shippingPostalCode;
    }

    if (dto.customerNote !== undefined) {
      data.customerNote = dto.customerNote;
    }

    if (dto.internalNote !== undefined) {
      data.internalNote = dto.internalNote;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.client.order.update({
        where: { id },
        data,
        include: ORDER_DETAIL_INCLUDE,
      });

      return toOrderResponse(updated);
    } catch (error) {
      throw mapOrderKnownErrors(error);
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: { id: true, status: true, stockDeducted: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!canTransitionOrderStatus(order.status, dto.status)) {
        throw new BadRequestException(
          `Cannot change order status from ${order.status} to ${dto.status}`,
        );
      }

      if (
        dto.cancellationReason !== undefined &&
        dto.cancellationReason !== null &&
        dto.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'A cancellation reason can only be provided when cancelling an order',
        );
      }

      const updateData: Prisma.OrderUpdateInput = { status: dto.status };

      if (dto.status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = dto.cancellationReason ?? null;
      }

      let updated: OrderWithRelations;

      try {
        updated = await tx.order.update({
          where: { id, status: order.status },
          data: updateData,
          include: ORDER_DETAIL_INCLUDE,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new ConflictException(
            'Order was modified by another request; please try again',
          );
        }

        throw error;
      }

      if (dto.status === OrderStatus.CANCELLED && order.stockDeducted) {
        await this.restoreStockOnce(tx, id);
      }

      return toOrderResponse(updated);
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: { id: true, status: true, stockDeducted: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.CANCELLED
      ) {
        throw new ConflictException(
          'Only pending or cancelled orders can be deleted; cancel the order first',
        );
      }

      const paymentRecords = await tx.orderPayment.count({
        where: { orderId: id },
      });

      if (paymentRecords > 0) {
        throw new ConflictException(
          'Orders with recorded payments cannot be deleted',
        );
      }

      if (order.stockDeducted) {
        await this.restoreStockOnce(tx, id);
      }

      await tx.orderPayment.deleteMany({ where: { orderId: id } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
  }

  async createPayment(
    orderId: string,
    dto: CreateOrderPaymentDto,
  ): Promise<OrderPaymentResponse> {
    const amount = new Prisma.Decimal(dto.amount);
    const status = dto.status ?? OrderPaymentStatus.COMPLETED;

    if (amount.lte(0)) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    return this.prisma.client.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, orderId);

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictException(
          'Payments cannot be recorded for a cancelled order',
        );
      }

      const newPaidAmount = order.amountPaid.add(amount);

      if (newPaidAmount.gt(order.totalAmount)) {
        throw new ConflictException(
          'Payment amount exceeds the outstanding balance of the order',
        );
      }

      if (dto.reference) {
        const duplicate = await tx.orderPayment.findUnique({
          where: {
            orderId_reference: { orderId, reference: dto.reference },
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new ConflictException(
            'A payment with this reference already exists for the order',
          );
        }
      }

      let paidAt: Date | null = null;

      if (dto.paidAt !== undefined) {
        paidAt = new Date(dto.paidAt);
      } else if (status === OrderPaymentStatus.COMPLETED) {
        paidAt = new Date();
      }

      const payment = await tx.orderPayment.create({
        data: {
          orderId,
          amount,
          method: dto.method,
          status,
          reference: dto.reference ?? null,
          note: dto.note ?? null,
          paidAt,
        },
      });

      await this.applyPaymentTotals(tx, orderId);

      return toPaymentResponse(payment);
    });
  }

  async listPayments(orderId: string): Promise<OrderPaymentResponse[]> {
    const order = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payments = await this.prisma.client.orderPayment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return payments.map((payment) => toPaymentResponse(payment));
  }

  async updatePaymentStatus(
    orderId: string,
    paymentId: string,
    dto: UpdateOrderPaymentStatusDto,
  ): Promise<OrderPaymentResponse> {
    return this.prisma.client.$transaction(async (tx) => {
      await this.lockOrder(tx, orderId);

      const payment = await tx.orderPayment.findFirst({
        where: { id: paymentId, orderId },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (!canTransitionPaymentStatus(payment.status, dto.status)) {
        throw new BadRequestException(
          `Cannot change payment status from ${payment.status} to ${dto.status}`,
        );
      }

      const updated = await tx.orderPayment.update({
        where: { id: payment.id },
        data: {
          status: dto.status,
          ...(dto.status === OrderPaymentStatus.COMPLETED && !payment.paidAt
            ? { paidAt: new Date() }
            : {}),
        },
      });

      await this.applyPaymentTotals(tx, orderId);

      return toPaymentResponse(updated);
    });
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
  }

  private async lockOrder(
    tx: TransactionClient,
    orderId: string,
  ): Promise<Order> {
    const existing = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    // A no-op write acquires the order row lock so concurrent payment
    // operations serialize and cannot oversell the outstanding balance.
    return tx.order.update({
      where: { id: orderId },
      data: { amountPaid: { increment: 0 } },
    });
  }

  private async restoreStockOnce(
    tx: TransactionClient,
    orderId: string,
  ): Promise<void> {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, stockDeducted: true },
      data: { stockDeducted: false },
    });

    if (claimed.count === 0) {
      return;
    }

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  }

  private async applyPaymentTotals(
    tx: TransactionClient,
    orderId: string,
  ): Promise<void> {
    const aggregate = await tx.orderPayment.aggregate({
      where: { orderId, status: OrderPaymentStatus.COMPLETED },
      _sum: { amount: true },
    });

    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const amountPaid = aggregate._sum.amount ?? new Prisma.Decimal(0);
    const paymentStatus = derivePaymentStatus(order.totalAmount, amountPaid);

    await tx.order.update({
      where: { id: orderId },
      data: { amountPaid, paymentStatus },
    });
  }
}
