import type {
  OrderBaseResponse,
  OrderItemResponse,
  OrderPaymentResponse,
  OrderPaymentRow,
  OrderResponse,
  OrderSummaryItemResponse,
  OrderSummaryResponse,
  OrderSummaryWithRelations,
  OrderWithRelations,
} from './orders.types.js';

export function toPaymentResponse(
  payment: OrderPaymentRow,
): OrderPaymentResponse {
  return {
    id: payment.id,
    amount: payment.amount.toString(),
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    note: payment.note,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export function toBaseResponse(
  order: OrderSummaryWithRelations | OrderWithRelations,
): OrderBaseResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    subtotal: order.subtotal.toString(),
    discountAmount: order.discountAmount.toString(),
    shippingFee: order.shippingFee.toString(),
    taxAmount: order.taxAmount.toString(),
    totalAmount: order.totalAmount.toString(),
    amountPaid: order.amountPaid.toString(),
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    customerNote: order.customerNote,
    internalNote: order.internalNote,
    cancellationReason: order.cancellationReason,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toOrderSummaryResponse(
  order: OrderSummaryWithRelations,
): OrderSummaryResponse {
  return {
    ...toBaseResponse(order),
    items: order.items.map((item): OrderSummaryItemResponse => ({
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      unitPrice: item.unitPrice.toString(),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toString(),
    })),
  };
}

export function toOrderResponse(order: OrderWithRelations): OrderResponse {
  return {
    ...toBaseResponse(order),
    items: order.items.map((item): OrderItemResponse => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unitPrice: item.unitPrice.toString(),
      quantity: item.quantity,
      lineTotal: item.lineTotal.toString(),
      createdAt: item.createdAt,
    })),
    payments: order.payments.map((payment) => toPaymentResponse(payment)),
  };
}
