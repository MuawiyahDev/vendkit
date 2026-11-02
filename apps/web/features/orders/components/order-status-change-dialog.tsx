"use client";

import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
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

import {
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "../api/orders-api";
import { formatStatusLabel } from "../utils/orders.utils";

interface OrderStatusChangeDialogProps {
  order: Order | null;
  /** Non-cancellation status the order should advance to. */
  targetStatus: OrderStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: Order) => void;
}

/**
 * Confirms a forward status transition (e.g. PENDING → CONFIRMED). Invalid
 * transitions are rejected by the backend and surfaced inline.
 */
export function OrderStatusChangeDialog({
  order,
  targetStatus,
  open,
  onOpenChange,
  onSuccess,
}: OrderStatusChangeDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) {
      return;
    }
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!order || !targetStatus || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateOrderStatus(order.id, {
        status: targetStatus,
      });
      onSuccess(updated);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while updating the order status.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-4 sm:max-w-md">
        <AlertDialogHeader className="gap-1.5 text-left">
          <AlertDialogTitle>
            {targetStatus
              ? `Mark order as ${formatStatusLabel(targetStatus)}?`
              : "Update order status?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            {order && targetStatus ? (
              <>
                <span className="text-foreground font-medium tabular-nums">
                  {order.orderNumber}
                </span>{" "}
                will move from{" "}
                <span className="text-foreground font-medium">
                  {formatStatusLabel(order.status)}
                </span>{" "}
                to{" "}
                <span className="text-foreground font-medium">
                  {formatStatusLabel(targetStatus)}
                </span>
                . This cannot be undone.
              </>
            ) : (
              "The order status will be updated."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving || !order || !targetStatus}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
            {isSaving ? "Updating…" : "Update status"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
