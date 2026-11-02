"use client";

import { CheckCircle2, CircleX, Plus, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  Order,
  OrderPayment,
  OrderPaymentStatus,
} from "../api/orders-api";
import {
  allowedPaymentStatusTransitions,
  formatCurrency,
  formatDateTime,
  formatOptionalValue,
  formatPaymentMethod,
  formatStatusLabel,
} from "../utils/orders.utils";

const ORDER_PAYMENT_STATUS_VARIANT: Record<
  OrderPaymentStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
> = {
  PENDING: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
};

interface OrderPaymentsCardProps {
  order: Order;
  /** Currently updating payment id, used to disable its buttons. */
  updatingPaymentId: string | null;
  error: string | null;
  canRecordPayment: boolean;
  onRecordPayment: () => void;
  onUpdatePaymentStatus: (
    payment: OrderPayment,
    status: OrderPaymentStatus,
  ) => void;
}

/**
 * Payments recorded against the order with per-payment status transitions.
 * The order's payment status is recalculated by the backend whenever a
 * payment is added or changes status.
 */
export function OrderPaymentsCard({
  order,
  updatingPaymentId,
  error,
  canRecordPayment,
  onRecordPayment,
  onUpdatePaymentStatus,
}: OrderPaymentsCardProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-base">Payments</CardTitle>
            <CardDescription>
              {order.payments.length === 0
                ? "No payments have been recorded yet."
                : `${order.payments.length} ${
                    order.payments.length === 1 ? "payment" : "payments"
                  } recorded against this order.`}
            </CardDescription>
          </div>
          {canRecordPayment ? (
            <Button
              type="button"
              size="sm"
              onClick={onRecordPayment}
              className="w-full sm:w-auto"
            >
              <Plus aria-hidden="true" />
              Record payment
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-2">
        {error ? (
          <p
            role="alert"
            className="text-destructive border-destructive/20 bg-destructive-soft/50 mt-3 rounded-md border px-3 py-2 text-sm font-medium"
          >
            {error}
          </p>
        ) : null}

        {order.payments.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No payments yet"
            description={
              canRecordPayment
                ? "Record a payment when the customer pays, in full or in parts."
                : "Payments cannot be recorded for a cancelled order."
            }
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <ul className="divide-border-subtle divide-y">
            {order.payments.map((payment) => {
              const busy = updatingPaymentId === payment.id;
              const transitions = allowedPaymentStatusTransitions(
                payment.status,
              );

              return (
                <li
                  key={payment.id}
                  className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-semibold tabular-nums">
                        {formatCurrency(payment.amount, order.currency)}
                      </span>
                      <Badge variant="secondary">
                        {formatPaymentMethod(payment.method)}
                      </Badge>
                      <Badge
                        variant={ORDER_PAYMENT_STATUS_VARIANT[payment.status]}
                        dot
                      >
                        {formatStatusLabel(payment.status)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {payment.paidAt
                        ? `Paid ${formatDateTime(payment.paidAt)}`
                        : `Recorded ${formatDateTime(payment.createdAt)}`}
                      {payment.reference
                        ? ` · Ref ${payment.reference}`
                        : ""}
                    </p>
                    {payment.note ? (
                      <p className="text-muted-foreground max-w-md text-xs">
                        {formatOptionalValue(payment.note)}
                      </p>
                    ) : null}
                  </div>

                  {transitions.length > 0 ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {transitions.map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          type="button"
                          size="xs"
                          variant={
                            nextStatus === "COMPLETED" ? "outline" : "destructive-outline"
                          }
                          disabled={busy}
                          onClick={() =>
                            onUpdatePaymentStatus(payment, nextStatus)
                          }
                        >
                          {nextStatus === "COMPLETED" ? (
                            <CheckCircle2 aria-hidden="true" />
                          ) : (
                            <CircleX aria-hidden="true" />
                          )}
                          {nextStatus === "COMPLETED"
                            ? "Mark completed"
                            : nextStatus === "FAILED"
                              ? "Mark failed"
                              : "Mark pending"}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
