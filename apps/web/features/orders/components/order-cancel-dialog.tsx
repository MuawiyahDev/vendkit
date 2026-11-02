"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Ban, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { orderCustomerName } from "../utils/orders.utils";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";

import { updateOrderStatus, type Order } from "../api/orders-api";
import {
  CANCELLATION_REASON_MAX_LENGTH,
  orderCancelSchema,
  type OrderCancelFormPayload,
  type OrderCancelFormValues,
} from "../schemas/orders.schemas";

const REASON_ERROR_ID = "order-cancel-reason-error";

interface OrderCancelDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: Order) => void;
}

/**
 * Cancels an order with an optional reason. Cancelling restores the stock
 * deducted when the order was created (handled by the backend).
 */
export function OrderCancelDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderCancelDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderCancelFormValues, unknown, OrderCancelFormPayload>({
    resolver: zodResolver(orderCancelSchema),
    defaultValues: { cancellationReason: "" },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }
    if (!nextOpen) {
      setError(null);
      reset({ cancellationReason: "" });
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: OrderCancelFormPayload) {
    if (!order) {
      return;
    }

    setError(null);

    try {
      const updated = await updateOrderStatus(order.id, {
        status: "CANCELLED",
        cancellationReason: values.cancellationReason,
      });
      reset({ cancellationReason: "" });
      onSuccess(updated);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while cancelling this order.",
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-4 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <Ban className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              The order will be marked as cancelled and the deducted stock is
              returned to the products. Cancelled orders cannot be reactivated
              or receive payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {order ? (
          <div className="border-border-subtle bg-surface-muted/60 rounded-lg border px-3.5 py-3">
            <p className="text-foreground text-sm font-medium tabular-nums">
              {order.orderNumber}
            </p>
            <p className="text-muted-foreground text-xs">{orderCustomerName(order)}</p>
          </div>
        ) : null}

        <form
          id="order-cancel-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-2"
        >
          {error ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Label htmlFor="order-cancel-reason">
            Reason{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="order-cancel-reason"
            placeholder="e.g. Customer changed their mind"
            rows={3}
            maxLength={CANCELLATION_REASON_MAX_LENGTH}
            aria-invalid={Boolean(errors.cancellationReason)}
            aria-describedby={
              errors.cancellationReason ? REASON_ERROR_ID : undefined
            }
            disabled={isSubmitting}
            {...register("cancellationReason")}
          />
          <FieldError
            id={REASON_ERROR_ID}
            message={errors.cancellationReason?.message}
          />
        </form>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep order
          </Button>
          <Button
            type="submit"
            form="order-cancel-form"
            variant="destructive"
            disabled={isSubmitting || !order}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Ban aria-hidden="true" />
            )}
            {isSubmitting ? "Cancelling…" : "Cancel order"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
