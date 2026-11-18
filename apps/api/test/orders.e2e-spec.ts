import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

const TEST_API_KEY = 'e2e-test-api-key';

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let prisma: PrismaService;

  const uniqueSuffix = Date.now().toString();
  const namePrefix = `E2E Order ${uniqueSuffix}`;

  let categoryId: string;
  let productOneId: string;
  let productTwoId: string;
  let customerId: string;

  function auth() {
    return { Authorization: `Bearer ${accessToken}` };
  }

  function createOrder(body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/orders')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send(body);
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

    const email = `orders-e2e-${uniqueSuffix}@example.com`;
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

    const category = await request(app.getHttpServer())
      .post('/categories')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send({ name: `${namePrefix} Category` })
      .expect(201);
    categoryId = category.body.id;

    const productOne = await request(app.getHttpServer())
      .post('/products')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send({
        name: `${namePrefix} Product One`,
        categoryId,
        sellingPrice: 250,
        stockQuantity: 200,
      })
      .expect(201);
    productOneId = productOne.body.id;

    const productTwo = await request(app.getHttpServer())
      .post('/products')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send({
        name: `${namePrefix} Product Two`,
        categoryId,
        sellingPrice: 100,
        stockQuantity: 1000,
      })
      .expect(201);
    productTwoId = productTwo.body.id;

    const customer = await request(app.getHttpServer())
      .post('/customers')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send({
        name: `${namePrefix} Customer`,
        phone: '01712345678',
        address: 'House 1, Road 1',
        city: 'Dhaka',
        postalCode: '1200',
      })
      .expect(201);
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

    await prisma.client.orderPayment.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.orderItem.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.order.deleteMany({
      where: { id: { in: orderIds } },
    });
    await prisma.client.product.deleteMany({
      where: { categoryId },
    });
    await prisma.client.category.deleteMany({
      where: { id: categoryId },
    });
    await prisma.client.customer.deleteMany({
      where: { name: { startsWith: namePrefix } },
    });
    await app.close();
  });

  describe('authentication', () => {
    it('rejects requests without an API key', async () => {
      await request(app.getHttpServer()).get('/orders').expect(401);
    });

    it('rejects requests without a JWT', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .expect(401);
    });
  });

  describe('POST /orders', () => {
    it('creates an order with server-side totals and product snapshots', async () => {
      const res = await createOrder({
        customerId,
        items: [
          { productId: productOneId, quantity: 2 },
          { productId: productTwoId, quantity: 1 },
        ],
        discountAmount: 50,
        shippingFee: 80,
        taxAmount: 10,
        customerNote: 'Please call before delivery',
        internalNote: 'Repeat customer',
      }).expect(201);

      expect(res.body.orderNumber).toMatch(/^ORD-\d{8}-[A-Z2-9]{6}$/);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.paymentStatus).toBe('UNPAID');
      expect(res.body.currency).toBe('BDT');
      expect(res.body.subtotal).toBe('600');
      expect(res.body.discountAmount).toBe('50');
      expect(res.body.shippingFee).toBe('80');
      expect(res.body.taxAmount).toBe('10');
      expect(res.body.totalAmount).toBe('640');
      expect(res.body.amountPaid).toBe('0');
      expect(res.body.shippingName).toBe(`${namePrefix} Customer`);
      expect(res.body.shippingPhone).toBe('01712345678');
      expect(res.body.shippingAddress).toBe('House 1, Road 1');
      expect(res.body.customerNote).toBe('Please call before delivery');
      expect(res.body.internalNote).toBe('Repeat customer');
      expect(res.body.items).toHaveLength(2);

      const panjabiLine = res.body.items.find(
        (item: { productId: string }) => item.productId === productOneId,
      );
      expect(panjabiLine).toMatchObject({
        productName: `${namePrefix} Product One`,
        quantity: 2,
        unitPrice: '250',
        lineTotal: '500',
      });
      expect(res.body.payments).toEqual([]);
    });

    it('deducts stock for ordered quantities', async () => {
      const before = await prisma.client.product.findUniqueOrThrow({
        where: { id: productOneId },
        select: { stockQuantity: true },
      });

      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 3 }],
      }).expect(201);

      const after = await prisma.client.product.findUniqueOrThrow({
        where: { id: productOneId },
        select: { stockQuantity: true },
      });

      expect(after.stockQuantity).toBe(before.stockQuantity - 3);
    });

    it('combines duplicate product lines', async () => {
      const res = await createOrder({
        customerId,
        items: [
          { productId: productOneId, quantity: 1 },
          { productId: productOneId, quantity: 2 },
        ],
      }).expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].quantity).toBe(3);
      expect(res.body.subtotal).toBe('750');
    });

    it('rejects an empty item list', async () => {
      await createOrder({ customerId, items: [] }).expect(400);
    });

    it('returns 404 for a missing customer', async () => {
      await createOrder({
        customerId: '00000000-0000-4000-8000-000000000000',
        items: [{ productId: productOneId, quantity: 1 }],
      }).expect(404);
    });

    it('returns 404 for a missing product', async () => {
      await createOrder({
        customerId,
        items: [
          { productId: productOneId, quantity: 1 },
          { productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
        ],
      }).expect(404);
    });

    it('rejects inactive products', async () => {
      const inactive = await request(app.getHttpServer())
        .post('/products')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({
          name: `${namePrefix} Inactive`,
          categoryId,
          sellingPrice: 50,
          stockQuantity: 5,
          isActive: false,
        })
        .expect(201);

      await createOrder({
        customerId,
        items: [{ productId: inactive.body.id, quantity: 1 }],
      }).expect(400);
    });

    it('rejects zero and negative quantities', async () => {
      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 0 }],
      }).expect(400);

      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: -1 }],
      }).expect(400);
    });

    it('rejects a discount larger than the subtotal', async () => {
      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 1 }],
        discountAmount: 9999.99,
      }).expect(400);
    });

    it('rejects negative shipping fees', async () => {
      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 1 }],
        shippingFee: -1,
      }).expect(400);
    });

    it('rejects client-supplied totals and order numbers', async () => {
      await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 1 }],
        totalAmount: 1,
        orderNumber: 'ORD-HACKED-000001',
      }).expect(400);
    });

    it('rejects insufficient stock with a conflict', async () => {
      const scarce = await request(app.getHttpServer())
        .post('/products')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({
          name: `${namePrefix} Scarce`,
          categoryId,
          sellingPrice: 40,
          stockQuantity: 5,
        })
        .expect(201);

      await createOrder({
        customerId,
        items: [{ productId: scarce.body.id, quantity: 6 }],
      }).expect(409);

      const after = await prisma.client.product.findUniqueOrThrow({
        where: { id: scarce.body.id },
        select: { stockQuantity: true },
      });
      expect(after.stockQuantity).toBe(5);
    });

    it('does not oversell limited stock under concurrent orders', async () => {
      const limited = await request(app.getHttpServer())
        .post('/products')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({
          name: `${namePrefix} Limited`,
          categoryId,
          sellingPrice: 30,
          stockQuantity: 10,
        })
        .expect(201);

      const [first, second] = await Promise.all([
        createOrder({
          customerId,
          items: [{ productId: limited.body.id, quantity: 6 }],
        }),
        createOrder({
          customerId,
          items: [{ productId: limited.body.id, quantity: 6 }],
        }),
      ]);

      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([201, 409]);

      const after = await prisma.client.product.findUniqueOrThrow({
        where: { id: limited.body.id },
        select: { stockQuantity: true },
      });
      expect(after.stockQuantity).toBe(4);
    });
  });

  describe('GET /orders', () => {
    it('lists orders with pagination metadata and summaries', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .query({ page: 1, limit: 5, customerId })
        .expect(200);

      expect(res.body.meta).toEqual({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].customer).toMatchObject({ id: customerId });
      expect(res.body.data[0].items.length).toBeGreaterThan(0);
    });

    it('filters by status and payment status', async () => {
      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .query({
          customerId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          limit: 100,
        })
        .expect(200);

      expect(
        res.body.data.every(
          (order: { status: string; paymentStatus: string }) =>
            order.status === 'PENDING' && order.paymentStatus === 'UNPAID',
        ),
      ).toBe(true);
    });

    it('searches by order number', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .query({ search: created.body.orderNumber, limit: 100 })
        .expect(200);

      expect(
        res.body.data.some(
          (order: { id: string }) => order.id === created.body.id,
        ),
      ).toBe(true);
    });

    it('rejects an invalid status filter', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .query({ status: 'NOT_A_STATUS' })
        .expect(400);
    });

    it('rejects an invalid date range', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .query({ dateFrom: '2026-10-10', dateTo: '2026-10-01' })
        .expect(400);
    });
  });

  describe('GET /orders/:id and /orders/number/:orderNumber', () => {
    it('retrieves a complete order by id', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 2 }],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .get(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.payments).toEqual([]);
    });

    it('retrieves an order by order number', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .get(`/orders/number/${created.body.orderNumber}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('returns 404 for a missing order', async () => {
      await request(app.getHttpServer())
        .get('/orders/00000000-0000-4000-8000-000000000000')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(404);
    });

    it('returns 404 for a missing order number', async () => {
      await request(app.getHttpServer())
        .get('/orders/number/ORD-00000000-ZZZZZZ')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(404);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('updates permitted metadata fields', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ internalNote: 'Handle with care', shippingCity: 'Rajshahi' })
        .expect(200);

      expect(res.body.internalNote).toBe('Handle with care');
      expect(res.body.shippingCity).toBe('Rajshahi');
      expect(res.body.totalAmount).toBe(created.body.totalAmount);
    });

    it('rejects attempts to modify calculated fields', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ totalAmount: 1, paymentStatus: 'PAID' })
        .expect(400);
    });

    it('returns 404 for a missing order', async () => {
      await request(app.getHttpServer())
        .patch('/orders/00000000-0000-4000-8000-000000000000')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ internalNote: 'nope' })
        .expect(404);
    });
  });

  describe('PATCH /orders/:id/status', () => {
    it('walks the happy path and blocks invalid transitions', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      const confirmed = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CONFIRMED' })
        .expect(200);
      expect(confirmed.body.status).toBe('CONFIRMED');
      expect(confirmed.body.paymentStatus).toBe('UNPAID');

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'DELIVERED' })
        .expect(400);

      const processing = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'PROCESSING' })
        .expect(200);
      expect(processing.body.status).toBe('PROCESSING');

      const shipped = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'SHIPPED' })
        .expect(200);
      expect(shipped.body.status).toBe('SHIPPED');

      const delivered = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'DELIVERED' })
        .expect(200);
      expect(delivered.body.status).toBe('DELIVERED');

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CANCELLED', cancellationReason: 'too late' })
        .expect(400);
    });

    it('cancels an order and restores stock exactly once', async () => {
      const before = await prisma.client.product.findUniqueOrThrow({
        where: { id: productOneId },
        select: { stockQuantity: true },
      });

      const created = await createOrder({
        customerId,
        items: [{ productId: productOneId, quantity: 4 }],
      }).expect(201);

      const mid = await prisma.client.product.findUniqueOrThrow({
        where: { id: productOneId },
        select: { stockQuantity: true },
      });
      expect(mid.stockQuantity).toBe(before.stockQuantity - 4);

      const cancelled = await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CANCELLED', cancellationReason: 'Customer changed mind' })
        .expect(200);

      expect(cancelled.body.status).toBe('CANCELLED');
      expect(cancelled.body.cancellationReason).toBe('Customer changed mind');
      expect(cancelled.body.cancelledAt).toBeDefined();
      expect(cancelled.body.paymentStatus).toBe('UNPAID');

      const after = await prisma.client.product.findUniqueOrThrow({
        where: { id: productOneId },
        select: { stockQuantity: true },
      });
      expect(after.stockQuantity).toBe(before.stockQuantity);

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CONFIRMED' })
        .expect(400);
    });

    it('rejects a cancellation reason on a non-cancellation transition', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CONFIRMED', cancellationReason: 'nope' })
        .expect(400);
    });

    it('returns 404 for a missing order', async () => {
      await request(app.getHttpServer())
        .patch('/orders/00000000-0000-4000-8000-000000000000/status')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CONFIRMED' })
        .expect(404);
    });
  });

  describe('order payments', () => {
    async function createFreshOrder() {
      const res = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 2 }],
        shippingFee: 0,
      }).expect(201);
      return res.body as { id: string; totalAmount: string };
    }

    it('records a partial payment and derives PARTIALLY_PAID', async () => {
      const order = await createFreshOrder();

      const payment = await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 50, method: 'CASH' })
        .expect(201);

      expect(payment.body.amount).toBe('50');
      expect(payment.body.status).toBe('COMPLETED');
      expect(payment.body.paidAt).toBeDefined();

      const detail = await request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(detail.body.paymentStatus).toBe('PARTIALLY_PAID');
      expect(detail.body.amountPaid).toBe('50');
      expect(detail.body.payments).toHaveLength(1);
    });

    it('marks the order paid when the balance is settled', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 100, method: 'CASH' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 100, method: 'BANK_TRANSFER', reference: 'TRX-77' })
        .expect(201);

      const detail = await request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(detail.body.paymentStatus).toBe('PAID');
      expect(detail.body.amountPaid).toBe('200');
    });

    it('rejects payments exceeding the outstanding balance', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 150, method: 'CASH' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 100, method: 'CASH' })
        .expect(409);
    });

    it('rejects a zero amount and an unknown payment method', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 0, method: 'CASH' })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'BITCOIN' })
        .expect(400);
    });

    it('rejects duplicate references within the same order', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'BANK_TRANSFER', reference: 'DUP-1' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'BANK_TRANSFER', reference: 'DUP-1' })
        .expect(409);
    });

    it('does not count pending payments as money received', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 50, method: 'MOBILE_FINANCIAL_SERVICE', status: 'PENDING' })
        .expect(201);

      const detail = await request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(detail.body.paymentStatus).toBe('UNPAID');
      expect(detail.body.amountPaid).toBe('0');
    });

    it('lists payments and recalculates when a payment fails', async () => {
      const order = await createFreshOrder();

      const payment = await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 200, method: 'CASH' })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(list.body).toHaveLength(1);

      const failed = await request(app.getHttpServer())
        .patch(`/orders/${order.id}/payments/${payment.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'FAILED' })
        .expect(200);
      expect(failed.body.status).toBe('FAILED');

      const detail = await request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(detail.body.paymentStatus).toBe('UNPAID');
      expect(detail.body.amountPaid).toBe('0');
    });

    it('rejects an invalid payment status transition', async () => {
      const order = await createFreshOrder();

      const payment = await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'CASH' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/payments/${payment.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'PENDING' })
        .expect(400);
    });

    it('rejects payments on a cancelled order', async () => {
      const order = await createFreshOrder();

      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CANCELLED', cancellationReason: 'duplicate order' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'CASH' })
        .expect(409);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('deletes a pending order and restores stock', async () => {
      const before = await prisma.client.product.findUniqueOrThrow({
        where: { id: productTwoId },
        select: { stockQuantity: true },
      });

      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 3 }],
      }).expect(201);

      await request(app.getHttpServer())
        .delete(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(204);

      await request(app.getHttpServer())
        .get(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(404);

      const after = await prisma.client.product.findUniqueOrThrow({
        where: { id: productTwoId },
        select: { stockQuantity: true },
      });
      expect(after.stockQuantity).toBe(before.stockQuantity);
    });

    it('rejects deletion of a confirmed order', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      await request(app.getHttpServer())
        .patch(`/orders/${created.body.id}/status`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ status: 'CONFIRMED' })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(409);
    });

    it('rejects deletion when a payment has been recorded', async () => {
      const created = await createOrder({
        customerId,
        items: [{ productId: productTwoId, quantity: 1 }],
      }).expect(201);

      await request(app.getHttpServer())
        .post(`/orders/${created.body.id}/payments`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ amount: 10, method: 'CASH', status: 'PENDING' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/orders/${created.body.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(409);
    });

    it('returns 404 when deleting a missing order', async () => {
      await request(app.getHttpServer())
        .delete('/orders/00000000-0000-4000-8000-000000000000')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(404);
    });
  });
});
