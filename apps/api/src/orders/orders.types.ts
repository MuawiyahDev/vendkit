import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  type OrderEventType,
  type OrderSource,
  type PaymentMethod,
} from '@repo/database';
import {
  ORDER_CUSTOMER_SELECT,
  ORDER_DETAIL_INCLUDE,
  ORDER_SUMMARY_INCLUDE,
} from './orders.constants.js';

export type OrderCustomerSnapshot = Prisma.CustomerGetPayload<{
  select: typeof ORDER_CUSTOMER_SELECT;
}>;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_DETAIL_INCLUDE;
}>;

export type OrderSummaryWithRelations = Prisma.OrderGetPayload<{
  include: typeof ORDER_SUMMARY_INCLUDE;
}>;

export type TransactionClient = Prisma.TransactionClient;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  createdAt: Date;
}

export interface OrderSummaryItemResponse {
  id: string;
  productName: string;
  sku: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface OrderPaymentResponse {
  id: string;
  amount: string;
  method: PaymentMethod;
  status: OrderPaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPaymentRow {
  id: string;
  amount: Prisma.Decimal;
  method: PaymentMethod;
  status: OrderPaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderEventResponse {
  id: string;
  type: OrderEventType;
  message: string;
  metadata: Prisma.JsonValue | null;
  actorName: string | null;
  createdAt: Date;
}

export interface OrderBaseResponse {
  id: string;
  orderNumber: string;
  customer: OrderCustomerSummary | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  currency: string;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  customerNote: string | null;
  internalNote: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSummaryResponse extends OrderBaseResponse {
  items: OrderSummaryItemResponse[];
}

export interface OrderResponse extends OrderBaseResponse {
  items: OrderItemResponse[];
  payments: OrderPaymentResponse[];
  events: OrderEventResponse[];
}

export interface PaginatedOrders {
  data: OrderSummaryResponse[];
  meta: PaginationMeta;
}
