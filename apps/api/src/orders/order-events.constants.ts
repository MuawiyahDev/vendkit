import { OrderEventType } from '@repo/database';

/** Friendly labels used by API responses and CSV exports. */
export const ORDER_EVENT_LABELS: Record<OrderEventType, string> = {
  [OrderEventType.ORDER_CREATED]: 'Order created',
  [OrderEventType.DETAILS_UPDATED]: 'Details updated',
  [OrderEventType.ITEMS_UPDATED]: 'Items updated',
  [OrderEventType.STATUS_CHANGED]: 'Status changed',
  [OrderEventType.PAYMENT_RECORDED]: 'Payment recorded',
  [OrderEventType.PAYMENT_STATUS_CHANGED]: 'Payment status changed',
  [OrderEventType.RETURN_RECORDED]: 'Return recorded',
  [OrderEventType.INVOICE_CREATED]: 'Invoice created',
  [OrderEventType.INVOICE_ISSUED]: 'Invoice issued',
  [OrderEventType.INVOICE_CANCELLED]: 'Invoice cancelled',
};
