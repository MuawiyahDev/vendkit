"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { NativeSelect } from "@/components/shared/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";

import {
  CREATABLE_PAYMENT_STATUSES,
  PAYMENT_METHODS,
  createOrderPayment,
  type Order,
  type OrderPayment,
} from "../api/orders-api";
import {
  orderPaymentFormSchema,
  PAYMENT_REFERENCE_MAX_LENGTH,
  type OrderPaymentFormPayload,
  type OrderPaymentFormValues,
} from "../schemas/orders.schemas";
import {
  formatCurrency,
  formatStatusLabel,
  outstandingBalance,
} from "../utils/orders.utils";

const AMOUNT_ERROR_ID = "order-payment-amount-error";
const REFERENCE_ERROR_ID = "order-payment-reference-error";
const NOTE_ERROR_ID = "order-payment-note-error";
const PAID_AT_ERROR_ID = "order-payment-paid-at-error";

const METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({
  value: method,
  label: formatStatusLabel(method),
}));

const STATUS_OPTIONS = CREATABLE_PAYMENT_STATUSES.map((status) => ({
  value: status,
  label: formatStatusLabel(status),
}));

function toDefaultValues(order: Order | null): OrderPaymentFormValues {
  const outstanding = order ? outstandingBalance(order) : 0;
  return {
    amount: outstanding > 0 ? String(outstanding) : "",
    method: "CASH",
    status: "COMPLETED",
    reference: "",
    note: "",
    paidAt: "",
  };
}

interface OrderPaymentFormDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (payment: OrderPayment) => void;
}

/**
 * Records a payment against an order. The backend rejects amounts above
 * the outstanding balance and duplicate references; both are also guarded
 * here so mistakes surface before the request.
 */
export function OrderPaymentFormDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderPaymentFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrderPaymentFormValues, unknown, OrderPaymentFormPayload>({
    resolver: zodResolver(orderPaymentFormSchema),
    defaultValues: toDefaultValues(order),
  });

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }
    if (!nextOpen) {
      setServerError(null);
      reset(toDefaultValues(order));
    }
    onOpenChange(nextOpen);
  }

  async function onSubmit(values: OrderPaymentFormPayload) {
    if (!order) {
      return;
    }

    setServerError(null);

    const outstanding = outstandingBalance(order);
    if (values.amount > outstanding) {
      setError("amount", {
        type: "manual",
        message: `Amount exceeds the outstanding balance of ${formatCurrency(
          outstanding,
          order.currency,
        )}`,
      });
      return;
    }

    try {
      const payment = await createOrderPayment(order.id, {
        amount: values.amount,
        method: values.method,
        status: values.status,
        reference: values.reference,
        note: values.note,
        paidAt: values.paidAt ?? undefined,
      });
      reset(toDefaultValues(order));
      onSuccess(payment);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while recording this payment.",
      );
    }
  }

  const outstanding = order ? outstandingBalance(order) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0 sm:max-w-xl"
        closeButtonDisabled={isSubmitting}
      >
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {order ? (
              <>
                <span className="tabular-nums">{order.orderNumber}</span> ·{" "}
                outstanding{" "}
                <span className="tabular-nums">
                  {formatCurrency(outstanding, order.currency)}
                </span>
              </>
            ) : (
              "Add a payment to this order."
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          id="order-payment-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col"
        >
          <div className="flex flex-col gap-6 px-6 py-5">
            {serverError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="order-payment-amount">
                  Amount
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="order-payment-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={
                    errors.amount ? AMOUNT_ERROR_ID : undefined
                  }
                  disabled={isSubmitting}
                  {...register("amount")}
                />
                <FieldError id={AMOUNT_ERROR_ID} message={errors.amount?.message} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order-payment-method">
                  Method
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <NativeSelect
                  ariaLabel="Payment method"
                  options={METHOD_OPTIONS}
                  id="order-payment-method"
                  disabled={isSubmitting}
                  {...register("method")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order-payment-status">
                  Payment status
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <NativeSelect
                  ariaLabel="Payment status"
                  options={STATUS_OPTIONS}
                  id="order-payment-status"
                  disabled={isSubmitting}
                  {...register("status")}
                />
                <p className="text-muted-foreground text-xs">
                  Completed payments count towards the order total
                  immediately.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order-payment-paid-at">
                  Paid date{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="order-payment-paid-at"
                  type="date"
                  aria-invalid={Boolean(errors.paidAt)}
                  aria-describedby={
                    errors.paidAt ? PAID_AT_ERROR_ID : undefined
                  }
                  disabled={isSubmitting}
                  {...register("paidAt")}
                />
                <FieldError id={PAID_AT_ERROR_ID} message={errors.paidAt?.message} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-payment-reference">
                Reference{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="order-payment-reference"
                placeholder="e.g. transaction id"
                maxLength={PAYMENT_REFERENCE_MAX_LENGTH}
                aria-invalid={Boolean(errors.reference)}
                aria-describedby={
                  errors.reference ? REFERENCE_ERROR_ID : undefined
                }
                disabled={isSubmitting}
                {...register("reference")}
              />
              <p className="text-muted-foreground text-xs">
                Must be unique within this order.
              </p>
              <FieldError
                id={REFERENCE_ERROR_ID}
                message={errors.reference?.message}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-payment-note">
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="order-payment-note"
                placeholder="Anything worth noting about this payment"
                rows={2}
                aria-invalid={Boolean(errors.note)}
                aria-describedby={errors.note ? NOTE_ERROR_ID : undefined}
                disabled={isSubmitting}
                {...register("note")}
              />
              <FieldError id={NOTE_ERROR_ID} message={errors.note?.message} />
            </div>
          </div>

          <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="order-payment-form"
              disabled={isSubmitting || !order || outstanding <= 0}
            >
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus aria-hidden="true" />
              )}
              {isSubmitting ? "Recording…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
