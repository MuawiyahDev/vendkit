import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Prisma,
  StockMovementReason,
  StockMovementType,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import { InventoryService } from './inventory.service.js';

const productId = '3f1d2c9a-0000-4000-8000-000000000001';

function productFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    name: 'Cotton Panjabi',
    slug: 'cotton-panjabi',
    sku: 'PAN-001',
    category: { id: 'cat-1', name: 'Clothing', slug: 'clothing' },
    images: [],
    stockQuantity: 10,
    lowStockThreshold: 3,
    trackInventory: true,
    isActive: true,
    unit: 'pcs',
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
    ...overrides,
  };
}

function movementFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'movement-1',
    productId,
    productName: 'Cotton Panjabi',
    sku: 'PAN-001',
    type: StockMovementType.MANUAL_INCREASE,
    reason: StockMovementReason.RESTOCK,
    previousQuantity: 10,
    quantityChange: 3,
    newQuantity: 13,
    note: null,
    orderId: null,
    orderNumber: null,
    userId: 'user-1',
    userName: 'Owner',
    idempotencyKey: null,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    order: null,
    ...overrides,
  };
}

describe('InventoryService', () => {
  let service: InventoryService;

  const prismaMock = {
    client: {
      $transaction: vi.fn(),
      $queryRaw: vi.fn(),
      product: {
        count: vi.fn(),
        aggregate: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        fields: { lowStockThreshold: 'Product.lowStockThreshold' },
      },
      stockMovement: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock.client.$transaction.mockImplementation(
      async (fn: (tx: typeof prismaMock.client) => unknown) =>
        fn(prismaMock.client),
    );
    prismaMock.client.$queryRaw.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  describe('getOverview', () => {
    it('summarizes tracked, untracked, low and out-of-stock products', async () => {
      prismaMock.client.product.count
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);
      prismaMock.client.product.aggregate.mockResolvedValue({
        _sum: { stockQuantity: 240 },
      });

      await expect(service.getOverview()).resolves.toEqual({
        totalProducts: 12,
        totalAvailableStock: 240,
        lowStockProducts: 3,
        outOfStockProducts: 1,
        untrackedProducts: 2,
      });
    });

    it('treats an empty aggregate as zero units', async () => {
      prismaMock.client.product.count.mockResolvedValue(0);
      prismaMock.client.product.aggregate.mockResolvedValue({
        _sum: { stockQuantity: null },
      });

      const overview = await service.getOverview();

      expect(overview.totalAvailableStock).toBe(0);
    });
  });

  describe('findAll', () => {
    it('returns paginated inventory with derived status', async () => {
      prismaMock.client.product.findMany.mockResolvedValue([
        productFixture(),
      ]);
      prismaMock.client.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.data[0]).toMatchObject({
        id: productId,
        stockQuantity: 10,
        availableQuantity: 10,
        status: 'in-stock',
        trackInventory: true,
      });
    });

    it('applies stock status and search filters', async () => {
      prismaMock.client.product.findMany.mockResolvedValue([]);
      prismaMock.client.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'PAN', status: 'low-stock' });

      expect(prismaMock.client.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: 'PAN', mode: 'insensitive' } },
                  { sku: { contains: 'PAN', mode: 'insensitive' } },
                  { slug: { contains: 'PAN', mode: 'insensitive' } },
                ],
              },
              {
                trackInventory: true,
                stockQuantity: {
                  gt: 0,
                  lte: 'Product.lowStockThreshold',
                },
              },
            ],
          },
        }),
      );
    });

    it('sorts by stock ascending by default', async () => {
      prismaMock.client.product.findMany.mockResolvedValue([]);
      prismaMock.client.product.count.mockResolvedValue(0);

      await service.findAll({});

      expect(prismaMock.client.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { stockQuantity: 'asc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('throws for a missing product', async () => {
      prismaMock.client.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateSettings', () => {
    it('updates tracking and threshold', async () => {
      prismaMock.client.product.update.mockResolvedValue(
        productFixture({ trackInventory: false, lowStockThreshold: 2 }),
      );

      const result = await service.updateSettings(productId, {
        trackInventory: false,
        lowStockThreshold: 2,
      });

      expect(prismaMock.client.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: productId },
          data: { trackInventory: false, lowStockThreshold: 2 },
        }),
      );
      expect(result.trackInventory).toBe(false);
      expect(result.status).toBe('untracked');
    });

    it('maps a missing product to not found', async () => {
      prismaMock.client.product.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('missing', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.updateSettings(productId, { trackInventory: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('adjustStock', () => {
    const actor = { id: 'user-1', name: 'Owner', email: 'owner@example.com' };

    beforeEach(() => {
      prismaMock.client.product.findUnique.mockResolvedValue({
        id: productId,
        name: 'Cotton Panjabi',
        sku: 'PAN-001',
        stockQuantity: 10,
        trackInventory: true,
      });
      prismaMock.client.product.update.mockResolvedValue(
        productFixture({ stockQuantity: 13 }),
      );
      prismaMock.client.stockMovement.create.mockResolvedValue(
        movementFixture(),
      );
    });

    it('increases stock and records a movement', async () => {
      const result = await service.adjustStock(
        productId,
        {
          mode: 'increase',
          quantity: 3,
          reason: StockMovementReason.RESTOCK,
        },
        actor,
      );

      expect(prismaMock.client.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: productId },
          data: { stockQuantity: 13 },
        }),
      );
      expect(prismaMock.client.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            previousQuantity: 10,
            quantityChange: 3,
            newQuantity: 13,
            type: StockMovementType.MANUAL_INCREASE,
            reason: StockMovementReason.RESTOCK,
            userName: 'Owner',
          }),
        }),
      );
      expect(result.item.stockQuantity).toBe(13);
    });

    it('rejects a decrease that would go below zero', async () => {
      await expect(
        service.adjustStock(
          productId,
          {
            mode: 'decrease',
            quantity: 11,
            reason: StockMovementReason.LOST,
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.client.stockMovement.create).not.toHaveBeenCalled();
    });

    it('rejects adjustments when tracking is disabled', async () => {
      prismaMock.client.product.findUnique.mockResolvedValue({
        id: productId,
        name: 'Cotton Panjabi',
        sku: 'PAN-001',
        stockQuantity: 10,
        trackInventory: false,
      });

      await expect(
        service.adjustStock(
          productId,
          {
            mode: 'increase',
            quantity: 1,
            reason: StockMovementReason.RESTOCK,
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('caps returns by the ordered quantity', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue({
        id: 'order-1',
      });
      prismaMock.client.order.update.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-1',
        status: 'CONFIRMED',
        items: [{ quantity: 5 }],
      });
      prismaMock.client.stockMovement.aggregate.mockResolvedValue({
        _sum: { quantityChange: 4 },
      });

      await expect(
        service.adjustStock(
          productId,
          {
            mode: 'increase',
            quantity: 2,
            reason: StockMovementReason.CUSTOMER_RETURN,
            orderNumber: 'ORD-1',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns the existing movement for a repeated idempotency key', async () => {
      prismaMock.client.stockMovement.findUnique.mockResolvedValue(
        movementFixture({ idempotencyKey: 'key-1' }),
      );
      prismaMock.client.product.findUnique.mockResolvedValue(
        productFixture(),
      );

      const result = await service.adjustStock(
        productId,
        {
          mode: 'increase',
          quantity: 3,
          reason: StockMovementReason.RESTOCK,
          idempotencyKey: '3f1d2c9a-0000-4000-8000-000000000099',
        },
        actor,
      );

      expect(result.movement.id).toBe('movement-1');
      expect(prismaMock.client.product.update).not.toHaveBeenCalled();
      expect(prismaMock.client.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('listMovements', () => {
    it('returns paginated movement history', async () => {
      prismaMock.client.stockMovement.findMany.mockResolvedValue([
        movementFixture(),
      ]);
      prismaMock.client.stockMovement.count.mockResolvedValue(1);

      const result = await service.listMovements({ page: 1, limit: 20 });

      expect(result.meta.total).toBe(1);
      expect(result.data[0]).toMatchObject({
        productName: 'Cotton Panjabi',
        quantityChange: 3,
        type: StockMovementType.MANUAL_INCREASE,
      });
    });

    it('filters by product, type and search term', async () => {
      prismaMock.client.stockMovement.findMany.mockResolvedValue([]);
      prismaMock.client.stockMovement.count.mockResolvedValue(0);

      await service.listMovements({
        productId,
        type: StockMovementType.RETURN,
        search: 'PAN',
      });

      expect(prismaMock.client.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  { productName: { contains: 'PAN', mode: 'insensitive' } },
                  { sku: { contains: 'PAN', mode: 'insensitive' } },
                  { orderNumber: { contains: 'PAN', mode: 'insensitive' } },
                ],
              },
              { productId },
              { type: StockMovementType.RETURN },
            ],
          },
        }),
      );
    });
  });

  describe('recordInitialStock', () => {
    it('records opening stock for a new product', async () => {
      prismaMock.client.stockMovement.create.mockResolvedValue(
        movementFixture({ type: StockMovementType.INITIAL, quantityChange: 5 }),
      );

      await service.recordInitialStock(
        prismaMock.client,
        {
          id: productId,
          name: 'Cotton Panjabi',
          sku: 'PAN-001',
          stockQuantity: 5,
        },
        { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
      );

      expect(prismaMock.client.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: StockMovementType.INITIAL,
            quantityChange: 5,
            previousQuantity: 0,
          }),
        }),
      );
    });

    it('ignores zero opening stock', async () => {
      await service.recordInitialStock(
        prismaMock.client,
        { id: productId, name: 'Cotton Panjabi', sku: null, stockQuantity: 0 },
        null,
      );

      expect(prismaMock.client.stockMovement.create).not.toHaveBeenCalled();
    });
  });
});
