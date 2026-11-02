"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  ArrowRight,
  Pencil,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  Order,
  OrderPayment,
  OrderPaymentStatus,
  OrderStatus,
} from "../api/orders-api";
import { updateOrderPaymentStatus } from "../api/orders-api";
import { useOrder } from "../hooks/use-order";
import { OrderCancelDialog } from "./order-cancel-dialog";
import { OrderCustomerCard } from "./order-customer-card";
import { OrderDeleteDialog } from "./order-delete-dialog";
import { OrderItemsCard } from "./order-items-card";
import { OrderNotesCard } from "./order-notes-card";
import { OrderPaymentFormDialog } from "./order-payment-form-dialog";
import { OrderPaymentsCard } from "./order-payments-card";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "./order-status-badge";
import { OrderStatusChangeDialog } from "./order-status-change-dialog";
import { OrderSummaryCard } from "./order-summary-card";
import {
  canCancelOrder,
  canDeleteOrder,
  formatDateTime,
  formatStatusLabel,
  nextOrderStatus,
  outstandingBalance,
} from "../utils/orders.utils";

const NOTICE_PARAM = "notice";

function OrderDetailsSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Loading order details"
    >
      <span className="sr-only">Loading order details…</span>
      <div className="flex flex-col gap-4" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-[22px] w-24" />
              <Skeleton className="h-[22px] w-24" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-xl border p-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="ml-auto h-4 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { view, order, refresh } = useOrder(id);

  const [statusDialogTarget, setStatusDialogTarget] =
    useState<OrderStatus | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(
    null,
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);

  // One-shot success notice left in the URL after creating this order.
  const notice = searchParams.get(NOTICE_PARAM);
  const liveNotice =
    notice !== null && notice !== dismissedNotice ? notice : null;
  const feedback = actionFeedback ?? liveNotice;

  const dismissFeedback = useCallback(() => {
    setActionFeedback(null);
    if (notice !== null) {
      setDismissedNotice(notice);
      router.replace(`/orders/${id}`, { scroll: false });
    }
  }, [notice, router, id]);

  /**
   * Shows a new action message, consuming any pending creation notice so
   * the two sources can never fight, and cleaning the URL so a refresh
   * cannot replay it.
   */
  const publishFeedback = useCallback(
    (message: string) => {
      if (notice !== null) {
        setDismissedNotice(notice);
        router.replace(`/orders/${id}`, { scroll: false });
      }
      setActionFeedback(message);
    },
    [notice, router, id],
  );

  if (view.status === "loading") {
    return <OrderDetailsSkeleton />;
  }

  if (view.status === "error") {
    if (view.notFound) {
      return (
        <div className="flex flex-col gap-6">
          <BackLink />
          <EmptyState
            icon={ReceiptText}
            title="Order not found"
            description="This order may have been deleted, or the link is incorrect."
          >
            <Button type="button" variant="outline" asChild>
              <Link href="/orders">Back to orders</Link>
            </Button>
          </EmptyState>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex flex-col items-center gap-4 py-8">
          <Alert variant="destructive" className="max-w-md text-left">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{view.message}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={refresh}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Captured so the hoisted handler declarations below see a non-null order.
  const currentOrder = order;

  const nextStatus = nextOrderStatus(currentOrder.status);
  const cancellable = canCancelOrder(currentOrder.status);
  const editable = currentOrder.status !== "CANCELLED";
  const deletable =
    canDeleteOrder(currentOrder.status) && currentOrder.payments.length === 0;
  const canRecordPayment =
    currentOrder.status !== "CANCELLED" && outstandingBalance(currentOrder) > 0;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Orders", href: "/orders" },
    { label: currentOrder.orderNumber },
  ];

  function handleStatusChangeSuccess(updated: Order) {
    setStatusDialogTarget(null);
    publishFeedback(
      `Order ${updated.orderNumber} is now ${formatStatusLabel(
        updated.status,
      ).toLowerCase()}.`,
    );
    refresh();
  }

  function handleCancelSuccess(updated: Order) {
    setIsCancelOpen(false);
    publishFeedback(`Order ${updated.orderNumber} was cancelled.`);
    refresh();
  }

  function handleDeleteSuccess() {
    setIsDeleteOpen(false);
    router.push(
      `/orders?notice=${encodeURIComponent(
        `Order ${currentOrder.orderNumber} was deleted.`,
      )}`,
    );
    router.refresh();
  }

  function handlePaymentSuccess() {
    setIsPaymentOpen(false);
    publishFeedback("Payment recorded.");
    refresh();
  }

  async function handlePaymentStatusChange(
    payment: OrderPayment,
    status: OrderPaymentStatus,
  ) {
    setPaymentError(null);
    setUpdatingPaymentId(payment.id);

    try {
      await updateOrderPaymentStatus(currentOrder.id, payment.id, status);
      publishFeedback(
        `Payment marked as ${formatStatusLabel(status).toLowerCase()}.`,
      );
      refresh();
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating this payment.",
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <div className="flex flex-col gap-4">
        <Breadcrumb items={breadcrumbItems} />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] tabular-nums break-words sm:text-[1.75rem]">
              {order.orderNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
              <span className="text-muted-foreground text-sm">
                Placed {formatDateTime(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {nextStatus ? (
              <Button
                type="button"
                onClick={() => setStatusDialogTarget(nextStatus)}
              >
                <ArrowRight aria-hidden="true" />
                Mark as {formatStatusLabel(nextStatus)}
              </Button>
            ) : null}
            {editable ? (
              <Button type="button" variant="outline" asChild>
                <Link href={`/orders/${order.id}/edit`}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Link>
              </Button>
            ) : null}
            {cancellable ? (
              <Button
                type="button"
                variant="destructive-outline"
                onClick={() => setIsCancelOpen(true)}
              >
                <Ban aria-hidden="true" />
                Cancel order
              </Button>
            ) : null}
            {deletable ? (
              <Button
                type="button"
                variant="destructive-outline"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </Button>
            ) : null}
          </div>
        </header>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <OrderItemsCard items={order.items} currency={order.currency} />
          <OrderPaymentsCard
            order={order}
            updatingPaymentId={updatingPaymentId}
            error={paymentError}
            canRecordPayment={canRecordPayment}
            onRecordPayment={() => setIsPaymentOpen(true)}
            onUpdatePaymentStatus={(payment, status) => {
              void handlePaymentStatusChange(payment, status);
            }}
          />
        </div>

        <div className="flex w-full flex-col gap-6">
          <OrderSummaryCard order={order} />
          <OrderCustomerCard order={order} />
          <OrderNotesCard order={order} />
        </div>
      </div>

      <OrderStatusChangeDialog
        order={order}
        targetStatus={statusDialogTarget}
        open={statusDialogTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialogTarget(null);
          }
        }}
        onSuccess={handleStatusChangeSuccess}
      />

      <OrderCancelDialog
        order={order}
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onSuccess={handleCancelSuccess}
      />

      <OrderDeleteDialog
        order={order}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleDeleteSuccess}
      />

      <OrderPaymentFormDialog
        order={order}
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/orders"
      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to orders
    </Link>
  );
}
