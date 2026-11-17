import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StockMovementReason,
  StockMovementType,
  type Product,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  INVENTORY_PAGE_SIZE,
  INVENTORY_PRODUCT_INCLUDE,
  STOCK_MOVEMENT_ORDER_INCLUDE,
  type InventorySortField,
  type SortOrder,
} from './inventory.constants.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { QueryInventoryDto } from './dto/query-inventory.dto.js';
import { QueryStockMovementsDto } from './dto/query-stock-movements.dto.js';
import { UpdateInventorySettingsDto } from './dto/update-inventory-settings.dto.js';
import {
  toInventoryItemResponse,
  toStockMovementResponse,
} from './inventory.mapper.js';
import type {
  InventoryItemResponse,
  InventoryOverviewResponse,
  PaginatedInventory,
  PaginatedStockMovements,
  RecordMovementInput,
  StockActor,
  StockAdjustmentResult,
} from './inventory.types.js';
import {
  buildInventoryOrderBy,
  buildInventoryStatusCondition,
  isUniqueConstraintViolation,
  mapInventoryErrors,
  resolveAdjustment,
} from './inventory.utils.js';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<InventoryOverviewResponse> {
    const lowStockThresholdField =
      this.prisma.client.product.fields.lowStockThreshold;

    const [trackedProducts, untrackedProducts, units, lowStock, outOfStock] =
      await Promise.all([
        this.prisma.client.product.count({ where: { trackInventory: true } }),
        this.prisma.client.product.count({ where: { trackInventory: false } }),
        this.prisma.client.product.aggregate({
          where: { trackInventory: true },
          _sum: { stockQuantity: true },
        }),
        this.prisma.client.product.count({
          where: {
            trackInventory: true,
            stockQuantity: { gt: 0, lte: lowStockThresholdField },
          },
        }),
        this.prisma.client.product.count({
          where: { trackInventory: true, stockQuantity: { lte: 0 } },
        }),
      ]);

    return {
      totalProducts: trackedProducts,
      totalAvailableStock: units._sum.stockQuantity ?? 0,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      untrackedProducts,
    };
  }

  async findAll(query: QueryInventoryDto): Promise<PaginatedInventory> {
    const page = query.page ?? 1;
    const limit = query.limit ?? INVENTORY_PAGE_SIZE;
    const search = query.search || undefined;

    const conditions: Prisma.ProductWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const statusCondition = buildInventoryStatusCondition(
      query.status ?? 'all',
      this.prisma.client.product.fields.lowStockThreshold,
    );

    if (statusCondition) {
      conditions.push(statusCondition);
    }

    const where: Prisma.ProductWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        include: INVENTORY_PRODUCT_INCLUDE,
        orderBy: buildInventoryOrderBy(
          query.sortBy as InventorySortField | undefined,
          query.sortOrder as SortOrder | undefined,
        ),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.product.count({ where }),
    ]);

    return {
      data: data.map((product) => toInventoryItemResponse(product)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(productId: string): Promise<InventoryItemResponse> {
    const product = await this.prisma.client.product.findUnique({
      where: { id: productId },
      include: INVENTORY_PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return toInventoryItemResponse(product);
  }

  async updateSettings(
    productId: string,
    dto: UpdateInventorySettingsDto,
  ): Promise<InventoryItemResponse> {
    if (
      dto.trackInventory === undefined &&
      dto.lowStockThreshold === undefined
    ) {
      return this.findOne(productId);
    }

    try {
      const product = await this.prisma.client.product.update({
        where: { id: productId },
        data: {
          ...(dto.trackInventory !== undefined
            ? { trackInventory: dto.trackInventory }
            : {}),
          ...(dto.lowStockThreshold !== undefined
            ? { lowStockThreshold: dto.lowStockThreshold }
            : {}),
        },
        include: INVENTORY_PRODUCT_INCLUDE,
      });

      return toInventoryItemResponse(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Product not found');
      }

      throw mapInventoryErrors(error);
    }
  }

  async adjustStock(
    productId: string,
    dto: AdjustStockDto,
    actor: StockActor | null,
  ): Promise<StockAdjustmentResult> {
    try {
      return await this.prisma.client.$transaction(async (tx) => {
        if (dto.idempotencyKey) {
          const existing = await tx.stockMovement.findUnique({
            where: { idempotencyKey: dto.idempotencyKey },
            include: STOCK_MOVEMENT_ORDER_INCLUDE,
          });

          if (existing) {
            if (!existing.productId || existing.productId !== productId) {
              throw new ConflictException(
                'This idempotency key was already used for another adjustment',
              );
            }

            const product = await tx.product.findUnique({
              where: { id: existing.productId },
              include: INVENTORY_PRODUCT_INCLUDE,
            });

            if (!product) {
              throw new ConflictException(
                'This adjustment was already applied to a product that no longer exists',
              );
            }

            return {
              item: toInventoryItemResponse(product),
              movement: toStockMovementResponse(existing),
            };
          }
        }

        // When the adjustment references an order, lock the order row first.
        // Order operations use the same order-then-product lock order, so a
        // return and a cancellation can never both consume the same units.
        const order = dto.orderNumber
          ? await this.lockRelatedOrder(tx, dto.orderNumber, productId)
          : null;

        await this.lockProducts(tx, [productId]);

        const product = await tx.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            name: true,
            sku: true,
            stockQuantity: true,
            trackInventory: true,
          },
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        if (!product.trackInventory) {
          throw new BadRequestException(
            'Inventory tracking is disabled for this product',
          );
        }

        const adjustment = resolveAdjustment(
          product,
          dto.mode,
          dto.quantity,
          dto.reason,
        );

        if (
          order &&
          dto.reason === StockMovementReason.CUSTOMER_RETURN &&
          adjustment.quantityChange > 0
        ) {
          const alreadyReturned = await tx.stockMovement.aggregate({
            where: {
              orderId: order.id,
              productId: product.id,
              type: StockMovementType.RETURN,
            },
            _sum: { quantityChange: true },
          });

          const remaining =
            order.quantity - (alreadyReturned._sum.quantityChange ?? 0);

          if (adjustment.quantityChange > remaining) {
            throw new BadRequestException(
              `Only ${Math.max(remaining, 0)} units remain returnable for order ${order.orderNumber}`,
            );
          }
        }

        const updated = await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: adjustment.newQuantity },
          include: INVENTORY_PRODUCT_INCLUDE,
        });

        const movement = await this.recordMovement(tx, {
          product,
          type: adjustment.type,
          reason: dto.reason,
          previousQuantity: product.stockQuantity,
          quantityChange: adjustment.quantityChange,
          newQuantity: adjustment.newQuantity,
          note: dto.note ?? null,
          orderId: order?.id ?? null,
          orderNumber: order?.orderNumber ?? null,
          userId: actor?.id ?? null,
          userName: actor?.name ?? actor?.email ?? null,
          idempotencyKey: dto.idempotencyKey ?? null,
        });

        return {
          item: toInventoryItemResponse(updated),
          movement,
        };
      });
    } catch (error) {
      if (dto.idempotencyKey && isUniqueConstraintViolation(error)) {
        return this.getExistingAdjustment(dto.idempotencyKey);
      }

      throw mapInventoryErrors(error);
    }
  }

  async listMovements(
    query: QueryStockMovementsDto,
  ): Promise<PaginatedStockMovements> {
    const page = query.page ?? 1;
    const limit = query.limit ?? INVENTORY_PAGE_SIZE;
    const search = query.search || undefined;
    const conditions: Prisma.StockMovementWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { productName: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { orderNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (query.productId) {
      conditions.push({ productId: query.productId });
    }

    if (query.orderId) {
      conditions.push({ orderId: query.orderId });
    }

    if (query.type) {
      conditions.push({ type: query.type });
    }

    if (query.reason) {
      conditions.push({ reason: query.reason });
    }

    if (query.dateFrom || query.dateTo) {
      conditions.push({
        createdAt: {
          ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
        },
      });
    }

    const where: Prisma.StockMovementWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [data, total] = await Promise.all([
      this.prisma.client.stockMovement.findMany({
        where,
        include: STOCK_MOVEMENT_ORDER_INCLUDE,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.stockMovement.count({ where }),
    ]);

    return {
      data: data.map((movement) => toStockMovementResponse(movement)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Locks product rows in a deterministic order so concurrent order and
   * adjustment operations cannot oversell or compute stale movement values.
   */
  async lockProducts(
    tx: TransactionClient,
    productIds: readonly string[],
  ): Promise<void> {
    const ids = [...new Set(productIds)].sort();

    for (const id of ids) {
      await tx.$queryRaw(
        Prisma.sql`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`,
      );
    }
  }

  async recordMovement(
    tx: TransactionClient,
    input: RecordMovementInput,
  ): Promise<ReturnType<typeof toStockMovementResponse>> {
    const movement = await tx.stockMovement.create({
      data: {
        productId: input.product.id,
        productName: input.product.name,
        sku: input.product.sku,
        type: input.type,
        reason: input.reason,
        previousQuantity: input.previousQuantity,
        quantityChange: input.quantityChange,
        newQuantity: input.newQuantity,
        note: input.note ?? null,
        orderId: input.orderId ?? null,
        orderNumber: input.orderNumber ?? null,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
      include: STOCK_MOVEMENT_ORDER_INCLUDE,
    });

    return toStockMovementResponse(movement);
  }

  /** Records the opening balance when a product is created with stock. */
  async recordInitialStock(
    tx: TransactionClient,
    product: Pick<Product, 'id' | 'name' | 'sku' | 'stockQuantity'>,
    actor: StockActor | null,
  ): Promise<void> {
    if (product.stockQuantity <= 0) {
      return;
    }

    await this.recordMovement(tx, {
      product,
      type: StockMovementType.INITIAL,
      reason: StockMovementReason.INITIAL_STOCK,
      previousQuantity: 0,
      quantityChange: product.stockQuantity,
      newQuantity: product.stockQuantity,
      note: 'Opening stock recorded when the product was created',
      userId: actor?.id ?? null,
      userName: actor?.name ?? actor?.email ?? null,
    });
  }

  /**
   * Applies an exact stock value from the product editor inside the caller's
   * transaction, keeping the change auditable instead of silently overwriting
   * the quantity.
   */
  async setStockFromProductForm(
    tx: TransactionClient,
    productId: string,
    newQuantity: number,
    actor: StockActor | null,
  ): Promise<void> {
    await this.lockProducts(tx, [productId]);

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        trackInventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stockQuantity === newQuantity) {
      return;
    }

    if (newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
    });

    if (!product.trackInventory) {
      return;
    }

    await this.recordMovement(tx, {
      product,
      type: StockMovementType.SET,
      reason: StockMovementReason.CORRECTION,
      previousQuantity: product.stockQuantity,
      quantityChange: newQuantity - product.stockQuantity,
      newQuantity,
      note: 'Stock quantity changed from the product editor',
      userId: actor?.id ?? null,
      userName: actor?.name ?? actor?.email ?? null,
    });
  }

  private async getExistingAdjustment(
    idempotencyKey: string,
  ): Promise<StockAdjustmentResult> {
    const existing = await this.prisma.client.stockMovement.findUnique({
      where: { idempotencyKey },
      include: STOCK_MOVEMENT_ORDER_INCLUDE,
    });

    if (!existing?.productId) {
      throw new ConflictException('This adjustment was already applied');
    }

    const product = await this.prisma.client.product.findUnique({
      where: { id: existing.productId },
      include: INVENTORY_PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new ConflictException('This adjustment was already applied');
    }

    return {
      item: toInventoryItemResponse(product),
      movement: toStockMovementResponse(existing),
    };
  }

  private async lockRelatedOrder(
    tx: TransactionClient,
    orderNumber: string,
    productId: string,
  ): Promise<{
    id: string;
    orderNumber: string;
    status: string;
    quantity: number;
  }> {
    const existing = await tx.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    // The no-op write waits for any in-flight order transaction and then
    // returns the current row, so the quantity below is never stale.
    const order = await tx.order.update({
      where: { id: existing.id },
      data: { amountPaid: { increment: 0 } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: {
          where: { productId },
          select: { quantity: true },
        },
      },
    });

    const item = order.items[0];

    if (!item) {
      throw new BadRequestException(
        `Order ${order.orderNumber} does not contain this product`,
      );
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException(
        'A cancelled order already released its stock and cannot be used for a return',
      );
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      quantity: item.quantity,
    };
  }
}
