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

import { deleteCustomer, type Customer } from "../api/customers-api";

interface CustomerDeleteDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (customer: Customer) => void;
}

export function CustomerDeleteDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: CustomerDeleteDialogProps) {
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
    if (!customer || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteCustomer(customer.id);
      onSuccess(customer);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while deleting this customer.",
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
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This permanently removes the customer and cannot be undone.
              Customers with existing orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {customer ? (
          <div className="border-border-subtle bg-surface-muted/60 rounded-lg border px-3.5 py-3">
            <p className="text-foreground text-sm font-medium">
              {customer.name}
            </p>
            <p className="text-muted-foreground text-xs tabular-nums">
              {customer.phone}
              {customer.email ? ` · ${customer.email}` : ""}
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
            disabled={isDeleting || !customer}
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
            {isDeleting ? "Deleting…" : "Delete customer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
