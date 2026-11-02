"use client";

import { AlertCircle, LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/client";

import { deleteOrder, type OrderSummary } from "../api/orders-api";
import { orderCustomerName } from "../utils/orders.utils";

interface OrderDeleteDialogProps {
  order: OrderSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: OrderSummary) => void;
}

/**
 * Confirms order deletion. The backend only deletes pending or cancelled
 * orders without recorded payments and restores the deducted stock.
 */
export function OrderDeleteDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isDeleting) {
      return;
    }
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!order || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteOrder(order.id);
      onSuccess(order);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while deleting this order.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-5 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This permanently removes the order and cannot be undone. The
              deducted stock is returned to the products. Only pending or
              cancelled orders without payments can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {order ? (
          <div className="border-border-subtle bg-surface-muted/60 rounded-lg border px-3.5 py-3">
            <p className="text-foreground text-sm font-medium tabular-nums">
              {order.orderNumber}
            </p>
            <p className="text-muted-foreground text-xs">
              {orderCustomerName(order)} ·{" "}
              <span className="tabular-nums">
                {order.totalAmount} {order.currency}
              </span>
            </p>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || !order}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeleting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
            {isDeleting ? "Deleting…" : "Delete order"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
