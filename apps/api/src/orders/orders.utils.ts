import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderPaymentStatus, OrderSource, OrderStatus, PaymentStatus, Prisma } from '@repo/database';
import {
  MAX_ORDER_ITEM_QUANTITY,
  type CreateOrderDto,
} from './dto/create-order.dto.js';
import type { QueryOrdersDto } from './dto/query-orders.dto.js';
import {
  ORDER_NUMBER_CHARS,
  ORDER_NUMBER_SUFFIX_LENGTH,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
} from './orders.constants.js';

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function formatOrderSource(source: OrderSource): string {
  return source
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function canTransitionPaymentStatus(
  from: OrderPaymentStatus,
  to: OrderPaymentStatus,
): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function generateOrderNumber(prefix = 'ORD'): string {
  const now = new Date();
  const year = now.getUTCFullYear().toString().padStart(4, '0');
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = now.getUTCDate().toString().padStart(2, '0');

  let suffix = '';
  for (let i = 0; i < ORDER_NUMBER_SUFFIX_LENGTH; i += 1) {
    suffix += ORDER_NUMBER_CHARS[randomInt(0, ORDER_NUMBER_CHARS.length)];
  }

  return `${prefix}-${year}${month}${day}-${suffix}`;
}

export function mergeItemQuantities(
  items: CreateOrderDto['items'],
): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const merged = (quantities.get(item.productId) ?? 0) + item.quantity;

    if (merged > MAX_ORDER_ITEM_QUANTITY) {
      throw new BadRequestException(
        `Combined quantity for a product cannot exceed ${MAX_ORDER_ITEM_QUANTITY}`,
      );
    }

    quantities.set(item.productId, merged);
  }

  return quantities;
}

export function parseDateBoundary(value: string, endOfDay: boolean): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(
      endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`,
    );
  }

  return new Date(value);
}

export function buildOrderOrderBy(
  query: QueryOrdersDto,
): Prisma.OrderOrderByWithRelationInput {
  const field = query.sortBy ?? 'createdAt';
  const order = query.sortOrder ?? (field === 'orderNumber' ? 'asc' : 'desc');

  switch (field) {
    case 'orderNumber':
      return { orderNumber: order };
    case 'totalAmount':
      return { totalAmount: order };
    case 'updatedAt':
      return { updatedAt: order };
    default:
      return { createdAt: order };
  }
}

export function derivePaymentStatus(
  totalAmount: Prisma.Decimal,
  amountPaid: Prisma.Decimal,
): PaymentStatus {
  if (amountPaid.isZero()) {
    return PaymentStatus.UNPAID;
  }

  if (amountPaid.lt(totalAmount)) {
    return PaymentStatus.PARTIALLY_PAID;
  }

  return PaymentStatus.PAID;
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function mapOrderKnownErrors(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new ConflictException('Order number already exists');
    }

    if (error.code === 'P2003' || error.code === 'P2014') {
      return new NotFoundException('A referenced record no longer exists');
    }
  }

  return error;
}
