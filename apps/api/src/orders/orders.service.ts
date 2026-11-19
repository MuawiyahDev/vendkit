import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderEventType,
  OrderPaymentStatus,
  OrderSource,
  OrderStatus,
  PaymentStatus,
  Prisma,
  StockMovementReason,
  StockMovementType,
  type Order,
  type User,
} from '@repo/database';
import {
  isPhoneLike,
  normalizePhone,
} from '../common/utils/phone.util.js';
import {
  buildCsvFileName,
  MAX_CSV_EXPORT_ROWS,
  toCsv,
} from '../common/utils/csv.util.js';
import type { CsvExportResponse } from '../common/types/csv-export.types.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { calculateShippingCharge } from '../settings/settings.utils.js';
import { OrderEventsService } from './order-events.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto.js';
import { CreateOrderReturnDto } from './dto/create-order-return.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderPaymentStatusDto } from './dto/update-order-payment-status.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import {
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
  formatOrderSource,
  generateOrderNumber,
  isUniqueConstraintViolation,
  mapOrderKnownErrors,
  mergeItemQuantities,
  parseDateBoundary,
} from './orders.utils.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly inventory: InventoryService,
    private readonly events: OrderEventsService,
  ) {}

  async create(
    dto: CreateOrderDto,
    actor: User | null = null,
  ): Promise<OrderResponse> {
    const settings = await this.settings.getOrderRuntimeConfig();

    if (settings.requireCustomerInformation && !dto.customerId) {
      throw new BadRequestException(
        'A saved customer is required by the current order settings',
      );
    }

    if (!settings.automaticNumbering && !dto.orderNumber) {
      throw new BadRequestException(
        'An order number is required when automatic order numbering is disabled',
      );
    }

    if (settings.automaticNumbering && dto.orderNumber != null) {
      throw new BadRequestException(
        'Order numbers are generated automatically by the current settings',
      );
    }

    if (dto.customerId) {
      await this.ensureCustomerExists(dto.customerId);
    }

    const quantities = mergeItemQuantities(dto.items);
    const productIds = [...quantities.keys()];

    const discountAmount = new Prisma.Decimal(dto.discountAmount ?? 0);
    const taxAmount = new Prisma.Decimal(dto.taxAmount ?? 0);

    for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = settings.automaticNumbering
        ? generateOrderNumber(settings.orderNumberPrefix)
        : (dto.orderNumber as string);

      try {
        const order = await this.prisma.client.$transaction(async (tx) => {
          await this.inventory.lockProducts(tx, productIds);

          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
              isActive: true,
              stockQuantity: true,
              trackInventory: true,
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
              trackedInventory: product.trackInventory,
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

          const shippingFee = calculateShippingCharge({
            requestedCharge:
              dto.shippingFee == null
                ? undefined
                : new Prisma.Decimal(dto.shippingFee),
            enabled: settings.shippingEnabled,
            defaultCharge: settings.defaultShippingCharge,
            freeShippingThreshold: settings.freeShippingThreshold,
            subtotal,
          });

          const totalAmount = subtotal
            .minus(discountAmount)
            .plus(shippingFee)
            .plus(taxAmount);

          const customerId = dto.customerId ?? null;

          let shippingDefaults: {
            name: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            postalCode: string | null;
          } = {
            name: null,
            phone: null,
            address: null,
            city: null,
            postalCode: null,
          };

          if (customerId !== null) {
            const customer = await tx.customer.findUnique({
              where: { id: customerId },
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

            shippingDefaults = customer;
          }

          const stockDeducted = lines.some(
            (line) => line.trackedInventory,
          );

          const stockChanges: Array<{
            product: { id: string; name: string; sku: string | null };
            previousQuantity: number;
            newQuantity: number;
            quantity: number;
          }> = [];

          // Stock is validated and deducted when an order is placed. The row
          // locks taken above keep quantities accurate under concurrency.
          for (const line of lines) {
            if (!line.trackedInventory) {
              continue;
            }

            const product = productById.get(line.productId);
            if (!product) {
              throw new NotFoundException('One or more products not found');
            }

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

            stockChanges.push({
              product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
              },
              previousQuantity: product.stockQuantity,
              newQuantity: product.stockQuantity - line.quantity,
              quantity: line.quantity,
            });
          }

          const created = await tx.order.create({
            data: {
              orderNumber,
              customerId,
              status: settings.defaultStatus,
              paymentStatus: PaymentStatus.UNPAID,
              source: dto.source ?? OrderSource.OTHER,
              currency: settings.currency,
              subtotal,
              discountAmount,
              shippingFee,
              taxAmount,
              totalAmount,
              amountPaid: new Prisma.Decimal(0),
              stockDeducted,
              shippingName: dto.shippingName ?? shippingDefaults.name,
              shippingPhone: dto.shippingPhone ?? shippingDefaults.phone,
              shippingAddress:
                dto.shippingAddress ?? shippingDefaults.address,
              shippingCity: dto.shippingCity ?? shippingDefaults.city,
              shippingPostalCode:
                dto.shippingPostalCode ?? shippingDefaults.postalCode,
              shippingCarrier: dto.shippingCarrier ?? null,
              trackingNumber: dto.trackingNumber ?? null,
              customerNote: dto.customerNote ?? settings.defaultNotes,
              internalNote: dto.internalNote ?? null,
              items: {
                create: lines.map((line) => ({
                  productId: line.productId,
                  productName: line.productName,
                  sku: line.sku,
                  unitPrice: line.unitPrice,
                  quantity: line.quantity,
                  lineTotal: line.lineTotal,
                  trackedInventory: line.trackedInventory,
                })),
              },
            },
            include: ORDER_DETAIL_INCLUDE,
          });

          for (const change of stockChanges) {
            await this.inventory.recordMovement(tx, {
              product: change.product,
              type: StockMovementType.ORDER_PLACED,
              reason: StockMovementReason.SALE,
              previousQuantity: change.previousQuantity,
              quantityChange: -change.quantity,
              newQuantity: change.newQuantity,
              orderId: created.id,
              orderNumber: created.orderNumber,
              userId: actor?.id ?? null,
              userName: actor?.name ?? actor?.email ?? null,
            });
          }

          await this.events.record(tx, {
            orderId: created.id,
            type: OrderEventType.ORDER_CREATED,
            message: `Order created from ${formatOrderSource(created.source)}`,
            metadata: {
              source: created.source,
              totalAmount: created.totalAmount.toString(),
              itemCount: created.items.length,
            },
            actor,
          });

          return created;
        });

        return toOrderResponse(order);
      } catch (error) {
        if (
          settings.automaticNumbering &&
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
    const where = this.buildWhere(query);

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

  async exportCsv(query: QueryOrdersDto): Promise<CsvExportResponse> {
    const where = this.buildWhere(query);
    const total = await this.prisma.client.order.count({ where });

    if (total > MAX_CSV_EXPORT_ROWS) {
      throw new BadRequestException(
        `This export contains ${total.toLocaleString()} orders. Narrow the filters to ${MAX_CSV_EXPORT_ROWS.toLocaleString()} orders or fewer.`,
      );
    }

    const orders = await this.prisma.client.order.findMany({
      where,
      include: ORDER_SUMMARY_INCLUDE,
      orderBy: buildOrderOrderBy(query),
      take: MAX_CSV_EXPORT_ROWS,
    });

    const rows: unknown[][] = [
      [
        'Order number',
        'Created at',
        'Customer',
        'Phone',
        'Channel',
        'Status',
        'Payment status',
        'Items',
        'Subtotal',
        'Discount',
        'Shipping',
        'Tax',
        'Total',
        'Paid',
        'Outstanding',
        'Carrier',
        'Tracking number',
      ],
    ];

    for (const order of orders) {
      const items = order.items
        .map((item) => `${item.quantity}x ${item.productName}`)
        .join('; ');

      rows.push([
        order.orderNumber,
        order.createdAt.toISOString(),
        order.customer?.name ?? order.shippingName ?? 'Walk-in',
        order.customer?.phone ?? order.shippingPhone ?? '',
        formatOrderSource(order.source),
        order.status,
        order.paymentStatus,
        items,
        order.subtotal.toString(),
        order.discountAmount.toString(),
        order.shippingFee.toString(),
        order.taxAmount.toString(),
        order.totalAmount.toString(),
        order.amountPaid.toString(),
        order.totalAmount.minus(order.amountPaid).toString(),
        order.shippingCarrier ?? '',
        order.trackingNumber ?? '',
      ]);
    }

    return {
      fileName: buildCsvFileName('orders'),
      content: toCsv(rows),
    };
  }

  private buildWhere(query: QueryOrdersDto): Prisma.OrderWhereInput {
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

    if (query.source) {
      conditions.push({ source: query.source });
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

    return conditions.length > 0 ? { AND: conditions } : {};
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

  async update(
    id: string,
    dto: UpdateOrderDto,
    actor: User | null = null,
  ): Promise<OrderResponse> {
    await this.assertOrderEditableWithInvoice(id);

    if (dto.items !== undefined) {
      return this.updateWithItems(id, dto, actor);
    }

    const existing = await this.prisma.client.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        customerId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Cancelled orders cannot be modified');
    }

    const settings = await this.settings.getOrderRuntimeConfig();

    if (!settings.allowEditing) {
      throw new ConflictException('Order editing is disabled in settings');
    }

    const data: Prisma.OrderUpdateInput = {};
    const changedFields: string[] = [];

    if (dto.customerId !== undefined) {
      if (dto.customerId) {
        await this.ensureCustomerExists(dto.customerId);
        data.customer = { connect: { id: dto.customerId } };
      } else {
        data.customer = { disconnect: true };
      }
      changedFields.push('customer');
    }

    const metadata = this.buildMetadataUpdate(dto);
    Object.assign(data, metadata.data);
    changedFields.push(...metadata.changedFields);

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.client.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id },
          data,
          include: ORDER_DETAIL_INCLUDE,
        });

        await this.events.record(tx, {
          orderId: id,
          type: OrderEventType.DETAILS_UPDATED,
          message: `Order details updated: ${changedFields.join(', ')}`,
          metadata: { fields: changedFields },
          actor,
        });

        return order;
      });

      return toOrderResponse(updated);
    } catch (error) {
      throw mapOrderKnownErrors(error);
    }
  }

  /**
   * Replaces order lines and applies only the stock delta. Existing lines
   * keep their captured unit price; new lines use the current selling price.
   * All product rows are locked so concurrent orders cannot oversell.
   */
  private async updateWithItems(
    id: string,
    dto: UpdateOrderDto,
    actor: User | null,
  ): Promise<OrderResponse> {
    const settings = await this.settings.getOrderRuntimeConfig();

    if (!settings.allowEditing) {
      throw new ConflictException('Order editing is disabled in settings');
    }

    const quantities = mergeItemQuantities(dto.items ?? []);

    if (dto.customerId) {
      await this.ensureCustomerExists(dto.customerId);
    }

    return this.prisma.client.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, id);

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictException('Cancelled orders cannot be modified');
      }

      const existingItems = await tx.orderItem.findMany({
        where: { orderId: id },
      });
      const existingById = new Map(
        existingItems.map((item) => [item.productId, item]),
      );

      const returnedGroups = await tx.stockMovement.groupBy({
        by: ['productId'],
        where: {
          orderId: id,
          type: StockMovementType.RETURN,
        },
        _sum: { quantityChange: true },
      });
      const returnedByProduct = new Map(
        returnedGroups
          .filter((group) => group.productId !== null)
          .map((group) => [
            group.productId as string,
            group._sum.quantityChange ?? 0,
          ]),
      );

      const productIds = [
        ...new Set([...existingById.keys(), ...quantities.keys()]),
      ];

      await this.inventory.lockProducts(tx, productIds);

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          sku: true,
          sellingPrice: true,
          isActive: true,
          stockQuantity: true,
          trackInventory: true,
        },
      });
      const productById = new Map(products.map((product) => [product.id, product]));

      const lines: Array<{
        productId: string;
        productName: string;
        sku: string | null;
        unitPrice: Prisma.Decimal;
        quantity: number;
        lineTotal: Prisma.Decimal;
        trackedInventory: boolean;
      }> = [];

      for (const productId of productIds) {
        const product = productById.get(productId);
        const existingItem = existingById.get(productId);
        const newQuantity = quantities.get(productId) ?? 0;
        const oldQuantity = existingItem?.quantity ?? 0;

        if (newQuantity === 0 && oldQuantity === 0) {
          continue;
        }

        if (!product) {
          throw new NotFoundException('One or more products not found');
        }

        if (!existingItem && !product.isActive) {
          throw new BadRequestException(
            `Product "${product.name}" is not available for sale`,
          );
        }

        const oldTracked = Boolean(
          existingItem?.trackedInventory && order.stockDeducted,
        );
        const returnedQuantity = returnedByProduct.get(productId) ?? 0;

        if (returnedQuantity > newQuantity) {
          throw new BadRequestException(
            `Cannot reduce "${existingItem?.productName ?? product.name}" below the ${returnedQuantity} units already returned`,
          );
        }

        // The stock currently deducted for this line is the ordered
        // quantity minus anything already returned. Only the difference
        // between that and the new target is applied.
        const currentDeducted = oldTracked
          ? Math.max(oldQuantity - returnedQuantity, 0)
          : 0;
        const targetDeducted = existingItem
          ? oldTracked
            ? Math.max(newQuantity - returnedQuantity, 0)
            : 0
          : product.trackInventory
            ? newQuantity
            : 0;
        const stockDelta = targetDeducted - currentDeducted;

        if (stockDelta > 0) {
          if (product.stockQuantity < stockDelta) {
            throw new ConflictException(
              `Insufficient stock for product "${existingItem?.productName ?? product.name}"`,
            );
          }

          const newStock = product.stockQuantity - stockDelta;
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: newStock },
          });
          await this.inventory.recordMovement(tx, {
            product,
            type: StockMovementType.ORDER_UPDATED,
            reason: StockMovementReason.ORDER_EDITED,
            previousQuantity: product.stockQuantity,
            quantityChange: -stockDelta,
            newQuantity: newStock,
            note: 'Order quantity increased',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: actor?.id ?? null,
            userName: actor?.name ?? actor?.email ?? null,
          });
          product.stockQuantity = newStock;
        } else if (stockDelta < 0) {
          const newStock = product.stockQuantity - stockDelta;
          await tx.product.update({
            where: { id: product.id },
            data: { stockQuantity: newStock },
          });
          await this.inventory.recordMovement(tx, {
            product,
            type: StockMovementType.ORDER_UPDATED,
            reason: StockMovementReason.ORDER_EDITED,
            previousQuantity: product.stockQuantity,
            quantityChange: -stockDelta,
            newQuantity: newStock,
            note: 'Order quantity decreased',
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: actor?.id ?? null,
            userName: actor?.name ?? actor?.email ?? null,
          });
          product.stockQuantity = newStock;
        }

        if (newQuantity === 0) {
          continue;
        }

        const unitPrice = existingItem?.unitPrice ?? product.sellingPrice;
        const trackedInventory = existingItem
          ? oldTracked
          : product.trackInventory;

        lines.push({
          productId: product.id,
          productName: existingItem?.productName ?? product.name,
          sku: existingItem?.sku ?? product.sku,
          unitPrice,
          quantity: newQuantity,
          lineTotal: unitPrice.mul(newQuantity),
          trackedInventory,
        });
      }

      const subtotal = lines.reduce(
        (sum, line) => sum.add(line.lineTotal),
        new Prisma.Decimal(0),
      );

      if (order.discountAmount.gt(subtotal)) {
        throw new BadRequestException(
          'Order discount cannot exceed the new subtotal',
        );
      }

      const totalAmount = subtotal
        .minus(order.discountAmount)
        .plus(order.shippingFee)
        .plus(order.taxAmount);

      const metadata = this.buildMetadataUpdate(dto);
      const changedFields = [...metadata.changedFields];

      if (dto.customerId !== undefined) {
        metadata.data.customer = dto.customerId
          ? { connect: { id: dto.customerId } }
          : { disconnect: true };
        changedFields.push('customer');
      }

      await tx.orderItem.deleteMany({ where: { orderId: id } });

      const updated = await tx.order.update({
        where: { id },
        data: {
          ...metadata.data,
          subtotal,
          totalAmount,
          stockDeducted: lines.some((line) => line.trackedInventory),
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              sku: line.sku,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              trackedInventory: line.trackedInventory,
            })),
          },
        },
        include: ORDER_DETAIL_INCLUDE,
      });

      await this.events.record(tx, {
        orderId: id,
        type: OrderEventType.ITEMS_UPDATED,
        message:
          changedFields.length > 0
            ? `Order items and ${changedFields.join(', ')} updated (${lines.length} line${lines.length === 1 ? '' : 's'})`
            : `Order items updated (${lines.length} line${lines.length === 1 ? '' : 's'})`,
        metadata: {
          itemCount: lines.length,
          fields: changedFields,
          totalAmount: totalAmount.toString(),
        },
        actor,
      });

      return toOrderResponse(updated);
    });
  }

  async recordReturn(
    id: string,
    dto: CreateOrderReturnDto,
    actor: User | null = null,
  ): Promise<OrderResponse> {
    const quantities = mergeItemQuantities(dto.items);

    return this.prisma.client.$transaction(async (tx) => {
      const order = await this.lockOrder(tx, id);

      if (order.status === OrderStatus.CANCELLED) {
        throw new ConflictException(
          'A cancelled order already released its stock and cannot accept returns',
        );
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: id, productId: { in: [...quantities.keys()] } },
      });
      const itemByProduct = new Map(items.map((item) => [item.productId, item]));

      for (const productId of quantities.keys()) {
        if (!itemByProduct.has(productId)) {
          throw new BadRequestException(
            'A returned product is not part of this order',
          );
        }
      }

      await this.inventory.lockProducts(tx, [...quantities.keys()]);

      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] } },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          trackInventory: true,
        },
      });
      const productById = new Map(products.map((product) => [product.id, product]));

      for (const [productId, quantity] of quantities) {
        const orderItem = itemByProduct.get(productId);
        const product = productById.get(productId);

        if (!orderItem || !product) {
          throw new BadRequestException(
            'A returned product is no longer available',
          );
        }

        const priorReturns = await tx.stockMovement.aggregate({
          where: {
            orderId: order.id,
            productId,
            type: StockMovementType.RETURN,
          },
          _sum: { quantityChange: true },
        });
        const alreadyReturned = priorReturns._sum.quantityChange ?? 0;
        const remaining = orderItem.quantity - alreadyReturned;

        if (quantity > remaining) {
          throw new BadRequestException(
            `Only ${Math.max(remaining, 0)} units of "${orderItem.productName}" remain returnable`,
          );
        }

        if (!orderItem.trackedInventory || !product.trackInventory) {
          continue;
        }

        const newStock = product.stockQuantity + quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newStock },
        });

        await this.inventory.recordMovement(tx, {
          product,
          type: StockMovementType.RETURN,
          reason: StockMovementReason.CUSTOMER_RETURN,
          previousQuantity: product.stockQuantity,
          quantityChange: quantity,
          newQuantity: newStock,
          note: dto.note ?? null,
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: actor?.id ?? null,
          userName: actor?.name ?? actor?.email ?? null,
        });
      }

      const updated = await tx.order.findUnique({
        where: { id },
        include: ORDER_DETAIL_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Order not found');
      }

      const returnedUnits = [...quantities.values()].reduce(
        (sum, quantity) => sum + quantity,
        0,
      );

      await this.events.record(tx, {
        orderId: order.id,
        type: OrderEventType.RETURN_RECORDED,
        message: `Return recorded for ${returnedUnits} unit${returnedUnits === 1 ? '' : 's'}`,
        metadata: {
          items: [...quantities.entries()].map(([productId, quantity]) => ({
            productId,
            quantity,
          })),
          note: dto.note ?? null,
        },
        actor,
      });

      return toOrderResponse(updated);
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor: User | null = null,
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
        await this.restoreStockOnce(tx, {
          order: {
            id: updated.id,
            orderNumber: updated.orderNumber,
          },
          type: StockMovementType.ORDER_CANCELLED,
          reason: StockMovementReason.ORDER_CANCELLED,
          note: dto.cancellationReason
            ? `Order cancelled: ${dto.cancellationReason}`
            : 'Order cancelled',
          actor,
        });
      }

      await this.events.record(tx, {
        orderId: updated.id,
        type: OrderEventType.STATUS_CHANGED,
        message: `Status changed from ${order.status} to ${dto.status}`,
        metadata: {
          from: order.status,
          to: dto.status,
          cancellationReason: dto.cancellationReason ?? null,
        },
        actor,
      });

      return toOrderResponse(updated);
    });
  }

  async remove(id: string, actor: User | null = null): Promise<void> {
    await this.prisma.client.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          stockDeducted: true,
        },
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

      const issuedInvoice = await tx.invoice.findUnique({
        where: { orderId: id },
        select: { status: true, invoiceNumber: true },
      });

      if (issuedInvoice?.status === 'ISSUED') {
        throw new ConflictException(
          `Order cannot be deleted because invoice ${issuedInvoice.invoiceNumber} is issued. Cancel the invoice first.`,
        );
      }

      if (order.stockDeducted) {
        await this.restoreStockOnce(tx, {
          order: { id: order.id, orderNumber: order.orderNumber },
          type: StockMovementType.ORDER_DELETED,
          reason: StockMovementReason.ORDER_DELETED,
          note: 'Order deleted before fulfilment',
          actor,
        });
      }

      await tx.orderPayment.deleteMany({ where: { orderId: id } });
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });
  }

  async createPayment(
    orderId: string,
    dto: CreateOrderPaymentDto,
    actor: User | null = null,
  ): Promise<OrderPaymentResponse> {
    const amount = new Prisma.Decimal(dto.amount);
    const status = dto.status ?? OrderPaymentStatus.COMPLETED;

    if (amount.lte(0)) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (!(await this.settings.isPaymentMethodEnabled(dto.method))) {
      throw new BadRequestException(
        `Payment method ${dto.method} is disabled in settings`,
      );
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

      await this.events.record(tx, {
        orderId,
        type: OrderEventType.PAYMENT_RECORDED,
        message: `Payment of ${amount.toString()} ${order.currency} recorded via ${dto.method}`,
        metadata: {
          paymentId: payment.id,
          amount: amount.toString(),
          method: dto.method,
          status,
          reference: dto.reference ?? null,
        },
        actor,
      });

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
    actor: User | null = null,
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

      await this.events.record(tx, {
        orderId,
        type: OrderEventType.PAYMENT_STATUS_CHANGED,
        message: `Payment status changed from ${payment.status} to ${dto.status}`,
        metadata: {
          paymentId: payment.id,
          from: payment.status,
          to: dto.status,
        },
        actor,
      });

      return toPaymentResponse(updated);
    });
  }

  private buildMetadataUpdate(dto: UpdateOrderDto): {
    data: Prisma.OrderUpdateInput;
    changedFields: string[];
  } {
    const data: Prisma.OrderUpdateInput = {};
    const changedFields: string[] = [];

    if (dto.shippingName !== undefined) {
      data.shippingName = dto.shippingName;
      changedFields.push('shipping name');
    }

    if (dto.shippingPhone !== undefined) {
      data.shippingPhone = dto.shippingPhone;
      changedFields.push('shipping phone');
    }

    if (dto.shippingAddress !== undefined) {
      data.shippingAddress = dto.shippingAddress;
      changedFields.push('shipping address');
    }

    if (dto.shippingCity !== undefined) {
      data.shippingCity = dto.shippingCity;
      changedFields.push('shipping city');
    }

    if (dto.shippingPostalCode !== undefined) {
      data.shippingPostalCode = dto.shippingPostalCode;
      changedFields.push('postal code');
    }

    if (dto.shippingCarrier !== undefined) {
      data.shippingCarrier = dto.shippingCarrier;
      changedFields.push('carrier');
    }

    if (dto.trackingNumber !== undefined) {
      data.trackingNumber = dto.trackingNumber;
      changedFields.push('tracking number');
    }

    if (dto.source !== undefined) {
      data.source = dto.source;
      changedFields.push('source');
    }

    if (dto.customerNote !== undefined) {
      data.customerNote = dto.customerNote;
      changedFields.push('customer note');
    }

    if (dto.internalNote !== undefined) {
      data.internalNote = dto.internalNote;
      changedFields.push('internal note');
    }

    return { data, changedFields };
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

  /**
   * An issued invoice is a document the buyer already has. Unless the invoice
   * settings explicitly allow edits after issue, changing the order would make
   * the stored invoice disagree with the order it references.
   */
  private async assertOrderEditableWithInvoice(orderId: string): Promise<void> {
    const invoice = await this.prisma.client.invoice.findUnique({
      where: { orderId },
      select: { status: true, invoiceNumber: true },
    });

    if (invoice?.status !== 'ISSUED') {
      return;
    }

    const invoiceSettings = await this.settings.getInvoiceSettings();

    if (!invoiceSettings.allowEditingAfterIssue) {
      throw new ConflictException(
        `Invoice ${invoice.invoiceNumber} is already issued. Cancel it or enable "Allow editing after issue" before changing this order.`,
      );
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
    input: {
      order: { id: string; orderNumber: string };
      type: StockMovementType;
      reason: StockMovementReason;
      note: string;
      actor: User | null;
    },
  ): Promise<void> {
    // Claiming the flag atomically guarantees stock is released at most once
    // even if retries or concurrent requests reach this point.
    const claimed = await tx.order.updateMany({
      where: { id: input.order.id, stockDeducted: true },
      data: { stockDeducted: false },
    });

    if (claimed.count === 0) {
      return;
    }

    const items = await tx.orderItem.findMany({
      where: { orderId: input.order.id },
      select: {
        productId: true,
        quantity: true,
        trackedInventory: true,
      },
    });
    const returnedGroups = await tx.stockMovement.groupBy({
      by: ['productId'],
      where: {
        orderId: input.order.id,
        type: StockMovementType.RETURN,
      },
      _sum: { quantityChange: true },
    });
    const returnedByProduct = new Map(
      returnedGroups
        .filter((group) => group.productId !== null)
        .map((group) => [
          group.productId as string,
          group._sum.quantityChange ?? 0,
        ]),
    );

    const trackedItems = items
      .filter((item) => item.trackedInventory)
      .map((item) => ({
        ...item,
        remaining: item.quantity - (returnedByProduct.get(item.productId) ?? 0),
      }))
      .filter((item) => item.remaining > 0);

    if (trackedItems.length === 0) {
      return;
    }

    await this.inventory.lockProducts(
      tx,
      trackedItems.map((item) => item.productId),
    );

    const products = await tx.product.findMany({
      where: { id: { in: trackedItems.map((item) => item.productId) } },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
      },
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of trackedItems) {
      const product = productById.get(item.productId);

      if (!product) {
        throw new NotFoundException(
          'A product on this order no longer exists; stock cannot be released',
        );
      }

      const newStock = product.stockQuantity + item.remaining;

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: newStock },
      });

      await this.inventory.recordMovement(tx, {
        product,
        type: input.type,
        reason: input.reason,
        previousQuantity: product.stockQuantity,
        quantityChange: item.remaining,
        newQuantity: newStock,
        note: input.note,
        orderId: input.order.id,
        orderNumber: input.order.orderNumber,
        userId: input.actor?.id ?? null,
        userName: input.actor?.name ?? input.actor?.email ?? null,
      });

      product.stockQuantity = newStock;
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
