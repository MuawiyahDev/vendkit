import { Badge } from "@/components/ui/badge";

import type { OrderStatus, PaymentStatus } from "../api/customers-api";
import { formatStatusLabel } from "../utils/customers.utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

const ORDER_STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  UNPAID: "secondary",
  PARTIALLY_PAID: "warning",
  PAID: "success",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status]} dot>
      {formatStatusLabel(status)}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANT[status]} dot>
      {formatStatusLabel(status)}
    </Badge>
  );
}
