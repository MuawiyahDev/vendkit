import { Prisma } from '@repo/database';
import { ORDER_DETAIL_INCLUDE } from '../orders/orders.constants.js';

export const INVOICE_DEFAULT_PAGE_SIZE = 20;
export const INVOICE_MAX_PAGE_SIZE = 100;

export const INVOICE_NUMBER_MAX_LENGTH = 100;
export const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
export const INVOICE_CANCELLATION_REASON_MAX_LENGTH = 500;
export const INVOICE_SEARCH_MAX_LENGTH = 100;

export const INVOICE_ORDER_SELECT = {
  orderNumber: true,
  customer: { select: { name: true } },
  shippingName: true,
} satisfies Prisma.OrderSelect;

export const INVOICE_DETAIL_INCLUDE = {
  order: { include: ORDER_DETAIL_INCLUDE },
} satisfies Prisma.InvoiceInclude;

export const INVOICE_LIST_INCLUDE = {
  order: { select: INVOICE_ORDER_SELECT },
} satisfies Prisma.InvoiceInclude;

export const INVOICE_SNAPSHOT_FORMAT_VERSION = 1;
