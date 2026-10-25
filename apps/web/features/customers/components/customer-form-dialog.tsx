"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
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
  createCustomer,
  updateCustomer,
  type Customer,
} from "../api/customers-api";
import {
  customerFormSchema,
  type CustomerFormPayload,
  type CustomerFormValues,
} from "../schemas/customers.schemas";

const NAME_ERROR_ID = "customer-form-name-error";
const PHONE_ERROR_ID = "customer-form-phone-error";
const EMAIL_ERROR_ID = "customer-form-email-error";
const ADDRESS_ERROR_ID = "customer-form-address-error";
const CITY_ERROR_ID = "customer-form-city-error";
const POSTAL_CODE_ERROR_ID = "customer-form-postal-code-error";
const NOTES_ERROR_ID = "customer-form-notes-error";

function toDefaultValues(customer?: Customer | null): CustomerFormValues {
  return {
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    postalCode: customer?.postalCode ?? "",
    notes: customer?.notes ?? "",
  };
}

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits this customer; otherwise it creates one. */
  customer?: Customer | null;
  onSuccess: (customer: Customer, mode: "create" | "edit") => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const mode: "create" | "edit" = customer ? "edit" : "create";
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset transient state as soon as the dialog opens (render-time
  // adjustment so a previously mounted dialog never shows stale errors).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setServerError(null);
      setConfirmDiscard(false);
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CustomerFormValues, unknown, CustomerFormPayload>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toDefaultValues(customer),
  });

  useEffect(() => {
    if (open) {
      reset(toDefaultValues(customer));
    }
  }, [open, customer, reset]);

  function close() {
    setServerError(null);
    setConfirmDiscard(false);
    onOpenChange(false);
  }

  function requestClose() {
    if (isSubmitting) {
      return;
    }
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    close();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestClose();
      return;
    }
    onOpenChange(true);
  }

  async function onSubmit(values: CustomerFormPayload) {
    setServerError(null);

    try {
      const saved = customer
        ? await updateCustomer(customer.id, values)
        : await createCustomer(values);
      onSuccess(saved, mode);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0 sm:max-w-xl"
        closeButtonDisabled={isSubmitting}
        onInteractOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          if (isDirty) {
            event.preventDefault();
            setConfirmDiscard(true);
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          if (isDirty) {
            event.preventDefault();
            setConfirmDiscard(true);
          }
        }}
      >
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>
            {mode === "create" ? "Add customer" : "Edit customer"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new person to your customer directory."
              : "Update this customer's contact and delivery details."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="customer-form"
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

            <fieldset className="border-border-subtle flex flex-col gap-4 border-t pt-5">
              <legend className="text-muted-foreground mb-1 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
                Contact information
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customer-name">
                    Name
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <Input
                    id="customer-name"
                    placeholder="e.g. Ayesha Rahman"
                    autoComplete="name"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? NAME_ERROR_ID : undefined}
                    disabled={isSubmitting}
                    {...register("name")}
                  />
                  <FieldError
                    id={NAME_ERROR_ID}
                    message={errors.name?.message}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="customer-phone">
                    Phone
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    placeholder="+880 17 1234 5678"
                    autoComplete="tel"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? PHONE_ERROR_ID : undefined}
                    disabled={isSubmitting}
                    {...register("phone")}
                  />
                  <FieldError
                    id={PHONE_ERROR_ID}
                    message={errors.phone?.message}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="customer-email">
                  Email{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? EMAIL_ERROR_ID : undefined}
                  disabled={isSubmitting}
                  {...register("email")}
                />
                <p className="text-muted-foreground text-xs">
                  Used for receipts and order updates when available.
                </p>
                <FieldError
                  id={EMAIL_ERROR_ID}
                  message={errors.email?.message}
                />
              </div>
            </fieldset>

            <fieldset className="border-border-subtle flex flex-col gap-4 border-t pt-5">
              <legend className="text-muted-foreground mb-1 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
                Delivery address
              </legend>

              <div className="flex flex-col gap-2">
                <Label htmlFor="customer-address">
                  Address{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="customer-address"
                  placeholder="Street address, house or apartment number"
                  autoComplete="street-address"
                  rows={2}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={
                    errors.address ? ADDRESS_ERROR_ID : undefined
                  }
                  disabled={isSubmitting}
                  {...register("address")}
                />
                <FieldError
                  id={ADDRESS_ERROR_ID}
                  message={errors.address?.message}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customer-city">
                    City{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="customer-city"
                    placeholder="e.g. Dhaka"
                    autoComplete="address-level2"
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? CITY_ERROR_ID : undefined}
                    disabled={isSubmitting}
                    {...register("city")}
                  />
                  <FieldError
                    id={CITY_ERROR_ID}
                    message={errors.city?.message}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="customer-postal-code">
                    Postal code{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="customer-postal-code"
                    placeholder="e.g. 1207"
                    autoComplete="postal-code"
                    aria-invalid={Boolean(errors.postalCode)}
                    aria-describedby={
                      errors.postalCode ? POSTAL_CODE_ERROR_ID : undefined
                    }
                    disabled={isSubmitting}
                    {...register("postalCode")}
                  />
                  <FieldError
                    id={POSTAL_CODE_ERROR_ID}
                    message={errors.postalCode?.message}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border-border-subtle flex flex-col gap-4 border-t pt-5">
              <legend className="text-muted-foreground mb-1 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
                Notes
              </legend>

              <div className="flex flex-col gap-2">
                <Label htmlFor="customer-notes">
                  Internal notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="customer-notes"
                  placeholder="Anything worth remembering about this customer"
                  rows={3}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? NOTES_ERROR_ID : undefined}
                  disabled={isSubmitting}
                  {...register("notes")}
                />
                <p className="text-muted-foreground text-xs">
                  Only visible to you and your team.
                </p>
                <FieldError
                  id={NOTES_ERROR_ID}
                  message={errors.notes?.message}
                />
              </div>
            </fieldset>
          </div>

          <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
            {confirmDiscard ? (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-muted-foreground mr-auto text-sm">
                  Discard unsaved changes?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep editing
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={close}
                >
                  Discard
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="customer-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isSubmitting
                    ? mode === "create"
                      ? "Adding…"
                      : "Saving…"
                    : mode === "create"
                      ? "Add customer"
                      : "Save changes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
