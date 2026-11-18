import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

const TEST_API_KEY = 'e2e-test-api-key';

describe('Inventory (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let prisma: PrismaService;
  let categoryId: string;
  let customerId: string;
  let productId: string;
  let concurrentProductId: string;

  const uniqueSuffix = Date.now().toString();
  const namePrefix = `E2E Inventory ${uniqueSuffix}`;
  const sku = `INV-${uniqueSuffix}`;
  const concurrentSku = `INV-C-${uniqueSuffix}`;

  function auth() {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function get(path: string) {
    return request(app.getHttpServer())
      .get(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth());
  }

  function post(path: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send(body);
  }

  function patch(path: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .patch(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send(body);
  }

  async function stockOf(id: string): Promise<number> {
    const response = await get(`/inventory/products/${id}`).expect(200);
    return response.body.stockQuantity as number;
  }

  function adjust(id: string, body: Record<string, unknown>) {
    return post(`/inventory/products/${id}/adjustments`, body);
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret-that-is-long-enough-for-validation';
    process.env.API_KEY = TEST_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const email = `inventory-e2e-${uniqueSuffix}@example.com`;
    const password = 'strong-password-123';

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(200);

    accessToken = login.body.accessToken;

    const category = await post('/categories', {
      name: `${namePrefix} Category`,
    }).expect(201);
    categoryId = category.body.id;

    const product = await post('/products', {
      name: `${namePrefix} Product`,
      categoryId,
      sku,
      sellingPrice: 100,
      stockQuantity: 10,
      lowStockThreshold: 3,
    }).expect(201);
    productId = product.body.id;

    const concurrentProduct = await post('/products', {
      name: `${namePrefix} Concurrent`,
      categoryId,
      sku: concurrentSku,
      sellingPrice: 100,
      stockQuantity: 10,
    }).expect(201);
    concurrentProductId = concurrentProduct.body.id;

    const customer = await post('/customers', {
      name: `${namePrefix} Customer`,
      phone: '01712345679',
    }).expect(201);
    customerId = customer.body.id;
  });

  afterAll(async () => {
    const products = await prisma.client.product.findMany({
      where: { categoryId },
      select: { id: true },
    });
    const productIds = products.map((product) => product.id);

    const items = await prisma.client.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { orderId: true },
    });
    const orderIds = [...new Set(items.map((item) => item.orderId))];

    await prisma.client.stockMovement.deleteMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { orderId: { in: orderIds } },
        ],
      },
    });
    await prisma.client.orderPayment.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.orderItem.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.client.product.deleteMany({ where: { categoryId } });
    await prisma.client.category.deleteMany({ where: { id: categoryId } });
    await prisma.client.customer.deleteMany({
      where: { name: { startsWith: namePrefix } },
    });
    await app.close();
  });

  describe('authentication', () => {
    it('rejects requests without an API key', async () => {
      await request(app.getHttpServer()).get('/inventory').expect(401);
    });

    it('rejects requests without a JWT', async () => {
      await request(app.getHttpServer())
        .get('/inventory')
        .set('x-api-key', TEST_API_KEY)
        .expect(401);
    });
  });

  describe('product creation and overview', () => {
    it('returns inventory tracking on the product', async () => {
      const response = await get(`/products/${productId}`).expect(200);
      expect(response.body.trackInventory).toBe(true);
    });

    it('records an initial stock movement', async () => {
      const response = await get(
        `/inventory/movements?productId=${productId}`,
      ).expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId,
            type: 'INITIAL',
            previousQuantity: 0,
            quantityChange: 10,
            newQuantity: 10,
          }),
        ]),
      );
    });

    it('includes tracked products in the overview', async () => {
      const response = await get('/inventory/overview').expect(200);
      expect(response.body.totalProducts).toBeGreaterThanOrEqual(2);
      expect(response.body.totalAvailableStock).toBeGreaterThanOrEqual(20);
    });

    it('lists and searches inventory by SKU', async () => {
      const response = await get(`/inventory?search=${sku}`).expect(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: productId,
        sku,
        availableQuantity: 10,
        status: 'in-stock',
      });
    });
  });

  describe('manual adjustments', () => {
    it('increases stock', async () => {
      const response = await adjust(productId, {
        mode: 'increase',
        quantity: 5,
        reason: 'RESTOCK',
        note: 'Supplier delivery',
      }).expect(201);

      expect(response.body.item.stockQuantity).toBe(15);
      expect(response.body.movement).toMatchObject({
        type: 'MANUAL_INCREASE',
        reason: 'RESTOCK',
        previousQuantity: 10,
        quantityChange: 5,
        newQuantity: 15,
      });
    });

    it('decreases stock', async () => {
      const response = await adjust(productId, {
        mode: 'decrease',
        quantity: 2,
        reason: 'DAMAGED',
      }).expect(201);

      expect(response.body.item.stockQuantity).toBe(13);
      expect(response.body.movement.type).toBe('DAMAGE');
    });

    it('sets an exact quantity', async () => {
      const response = await adjust(productId, {
        mode: 'set',
        quantity: 7,
        reason: 'CORRECTION',
      }).expect(201);

      expect(response.body.item.stockQuantity).toBe(7);
      expect(response.body.movement.type).toBe('SET');
    });

    it('rejects a decrease below zero', async () => {
      await adjust(productId, {
        mode: 'decrease',
        quantity: 999,
        reason: 'LOST',
      }).expect(400);

      await expect(stockOf(productId)).resolves.toBe(7);
    });

    it('rejects an invalid reason for the mode', async () => {
      await adjust(productId, {
        mode: 'increase',
        quantity: 1,
        reason: 'DAMAGED',
      }).expect(400);
    });

    it('applies a repeated idempotency key only once', async () => {
      const key = '3f1d2c9a-0000-4000-8000-0000000000aa';

      const first = await adjust(productId, {
        mode: 'increase',
        quantity: 5,
        reason: 'RESTOCK',
        idempotencyKey: key,
      }).expect(201);
      const second = await adjust(productId, {
        mode: 'increase',
        quantity: 5,
        reason: 'RESTOCK',
        idempotencyKey: key,
      }).expect(201);

      expect(first.body.movement.id).toBe(second.body.movement.id);
      await expect(stockOf(productId)).resolves.toBe(12);
    });

    it('updates the low-stock threshold and status', async () => {
      const response = await patch(`/inventory/products/${productId}/settings`, {
        lowStockThreshold: 15,
      }).expect(200);

      expect(response.body.lowStockThreshold).toBe(15);
      expect(response.body.status).toBe('low-stock');
    });
  });

  describe('order lifecycle', () => {
    it('deducts stock when an order is created', async () => {
      const order = await post('/orders', {
        customerId,
        items: [{ productId, quantity: 3 }],
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(9);

      const movements = await get(
        `/inventory/movements?productId=${productId}&type=ORDER_PLACED`,
      ).expect(200);
      expect(movements.body.data[0]).toMatchObject({
        type: 'ORDER_PLACED',
        orderNumber: order.body.orderNumber,
        quantityChange: -3,
      });

      await patch(`/orders/${order.body.id}/status`, {
        status: 'CANCELLED',
        cancellationReason: 'E2E cancellation',
      }).expect(200);

      await expect(stockOf(productId)).resolves.toBe(12);
    });

    it('prevents overselling', async () => {
      await post('/orders', {
        customerId,
        items: [{ productId, quantity: 9999 }],
      }).expect(409);

      await expect(stockOf(productId)).resolves.toBe(12);
    });

    it('applies only the stock delta when order quantities change', async () => {
      const order = await post('/orders', {
        customerId,
        items: [{ productId, quantity: 2 }],
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(10);

      await patch(`/orders/${order.body.id}`, {
        items: [{ productId, quantity: 5 }],
      }).expect(200);

      await expect(stockOf(productId)).resolves.toBe(7);

      await patch(`/orders/${order.body.id}`, {
        items: [{ productId, quantity: 1 }],
      }).expect(200);

      await expect(stockOf(productId)).resolves.toBe(11);
    });

    it('restores stock exactly once when cancelling', async () => {
      const order = await post('/orders', {
        customerId,
        items: [{ productId, quantity: 2 }],
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(9);

      await patch(`/orders/${order.body.id}/status`, {
        status: 'CANCELLED',
      }).expect(200);
      await expect(stockOf(productId)).resolves.toBe(11);

      await patch(`/orders/${order.body.id}/status`, {
        status: 'CANCELLED',
      }).expect(400);

      await expect(stockOf(productId)).resolves.toBe(11);
    });

    it('restocks explicitly returned items and never over-restocks on cancel', async () => {
      const order = await post('/orders', {
        customerId,
        items: [{ productId, quantity: 4 }],
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(7);

      await post(`/orders/${order.body.id}/returns`, {
        items: [{ productId, quantity: 2 }],
        note: 'Two units returned',
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(9);

      await post(`/orders/${order.body.id}/returns`, {
        items: [{ productId, quantity: 3 }],
      }).expect(400);

      await expect(stockOf(productId)).resolves.toBe(9);

      await patch(`/orders/${order.body.id}`, {
        items: [{ productId, quantity: 1 }],
      }).expect(400);

      await patch(`/orders/${order.body.id}`, {
        items: [{ productId, quantity: 3 }],
      }).expect(200);

      // Net deducted quantity drops from 2 to 1 after the edit.
      await expect(stockOf(productId)).resolves.toBe(10);

      await patch(`/orders/${order.body.id}/status`, {
        status: 'CANCELLED',
      }).expect(200);

      // Two units were already returned; only the remaining one restocks.
      await expect(stockOf(productId)).resolves.toBe(11);
    });

    it('does not deduct stock for untracked products', async () => {
      await patch(`/inventory/products/${productId}/settings`, {
        trackInventory: false,
      }).expect(200);

      await adjust(productId, {
        mode: 'increase',
        quantity: 1,
        reason: 'RESTOCK',
      }).expect(400);

      const order = await post('/orders', {
        customerId,
        items: [{ productId, quantity: 100 }],
      }).expect(201);

      await expect(stockOf(productId)).resolves.toBe(11);

      await patch(`/orders/${order.body.id}/status`, {
        status: 'CANCELLED',
      }).expect(200);

      await expect(stockOf(productId)).resolves.toBe(11);
    });

    it('keeps stock non-negative under concurrent orders', async () => {
      const results = await Promise.all(
        Array.from({ length: 4 }, () =>
          post('/orders', {
            customerId,
            items: [{ productId: concurrentProductId, quantity: 4 }],
          }),
        ),
      );

      const created = results.filter((result) => result.status === 201);
      const rejected = results.filter((result) => result.status === 409);

      expect(created).toHaveLength(2);
      expect(rejected).toHaveLength(2);

      const response = await get(
        `/inventory/products/${concurrentProductId}`,
      ).expect(200);
      expect(response.body.stockQuantity).toBe(2);
      expect(response.body.stockQuantity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validation', () => {
    it('rejects an invalid product id', async () => {
      await get('/inventory/products/not-a-uuid').expect(400);
    });

    it('rejects a missing adjustment reason', async () => {
      await adjust(productId, { mode: 'increase', quantity: 1 }).expect(400);
    });
  });
});
