"use client";

import { Pencil, Plus, UserRound } from "lucide-react";



import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";


import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import type { Customer } from "@/features/customers/api/customers-api";

interface OrderCustomerSectionProps {
  selectedCustomer: Customer | null;
  customerIdError?: string;
  isSubmitting: boolean;
  onChange: () => void;
  /** Opens the customer creation popup directly. */
  onCreateNew?: () => void;
}

/**
 * Optional customer picker for the order editor. When no customer is
 * selected the order can still proceed as a walk-in/guest order using
 * the separate guest fields.
 */
export function OrderCustomerSection({
  selectedCustomer,
  customerIdError,
  isSubmitting,
  onChange,
  onCreateNew,
}: OrderCustomerSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {selectedCustomer ? (
        <div className="border-border-subtle bg-surface-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3">
          <CustomerAvatar
            name={selectedCustomer.name}
            className="size-10"
            fallbackClassName="text-sm"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-foreground truncate text-sm font-medium">
              {selectedCustomer.name}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {selectedCustomer.phone}
              {selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onChange}
            disabled={isSubmitting}
          >
            <Pencil aria-hidden="true" />
            Change
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onChange}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <UserRound aria-hidden="true" />
          Select customer (optional)
        </Button>
      )}
      {onCreateNew ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCreateNew}
          disabled={isSubmitting}
          className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus aria-hidden="true" />
          Create new customer
        </Button>
      ) : null}
      <FieldError id="order-form-customer-error" message={customerIdError} />


    </div>
  );
}
