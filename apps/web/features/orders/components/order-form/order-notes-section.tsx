"use client";

import type { UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { OrderNotesFieldName } from "./order-form.types";

interface OrderNotesSectionProps {
  register: (name: OrderNotesFieldName) => UseFormRegisterReturn;
  customerNoteError?: string;
  internalNoteError?: string;
  isSubmitting: boolean;
}

const CUSTOMER_NOTE_ERROR_ID = "order-form-customer-note-error";
const INTERNAL_NOTE_ERROR_ID = "order-form-internal-note-error";

/** Customer-facing and internal notes attached to the order. */
export function OrderNotesSection({
  register,
  customerNoteError,
  internalNoteError,
  isSubmitting,
}: OrderNotesSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="order-customer-note">
          Customer note{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="order-customer-note"
          placeholder="e.g. Deliver after 5pm, call before arrival"
          rows={2}
          aria-invalid={Boolean(customerNoteError)}
          aria-describedby={
            customerNoteError ? CUSTOMER_NOTE_ERROR_ID : undefined
          }
          disabled={isSubmitting}
          {...register("customerNote")}
        />
        <p className="text-muted-foreground text-xs">
          Shown to the customer on the order.
        </p>
        <FieldError id={CUSTOMER_NOTE_ERROR_ID} message={customerNoteError} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-internal-note">
          Internal note{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="order-internal-note"
          placeholder="Anything worth remembering about this order"
          rows={2}
          aria-invalid={Boolean(internalNoteError)}
          aria-describedby={
            internalNoteError ? INTERNAL_NOTE_ERROR_ID : undefined
          }
          disabled={isSubmitting}
          {...register("internalNote")}
        />
        <p className="text-muted-foreground text-xs">
          Only visible to you and your team.
        </p>
        <FieldError id={INTERNAL_NOTE_ERROR_ID} message={internalNoteError} />
      </div>
    </>
  );
}
