import { OrderPaymentStatus, OrderStatus, Prisma } from '@repo/database';

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_CURRENCY = 'BDT';

export const MAX_ORDER_NUMBER_ATTEMPTS = 5;

export const ORDER_NUMBER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ORDER_NUMBER_SUFFIX_LENGTH = 6;

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const PAYMENT_STATUS_TRANSITIONS: Record<
  OrderPaymentStatus,
  readonly OrderPaymentStatus[]
> = {
  [OrderPaymentStatus.PENDING]: [
    OrderPaymentStatus.COMPLETED,
    OrderPaymentStatus.FAILED,
  ],
  [OrderPaymentStatus.FAILED]: [
    OrderPaymentStatus.PENDING,
    OrderPaymentStatus.COMPLETED,
  ],
  [OrderPaymentStatus.COMPLETED]: [OrderPaymentStatus.FAILED],
};

export const ORDER_CUSTOMER_SELECT = {
  id: true,
  name: true,
  phone: true,
  email: true,
} satisfies Prisma.CustomerSelect;

export const ORDER_DETAIL_INCLUDE = {
  customer: { select: ORDER_CUSTOMER_SELECT },
  items: { orderBy: { createdAt: 'asc' as const } },
  payments: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

export const ORDER_SUMMARY_INCLUDE = {
  customer: { select: ORDER_CUSTOMER_SELECT },
  items: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      productName: true,
      sku: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
  },
} satisfies Prisma.OrderInclude;
