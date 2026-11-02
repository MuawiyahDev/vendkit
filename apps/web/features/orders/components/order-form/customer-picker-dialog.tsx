"use client";

import { AlertCircle, Check, Plus } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import { CustomerAvatar } from "@/features/customers/components/customer-avatar";
import type { Customer } from "@/features/customers/api/customers-api";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useCustomerPicker } from "../../hooks/use-customer-picker";
import { formatOptionalValue } from "../../utils/orders.utils";

interface CustomerPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomerId: string | null;
  onSelect: (customer: Customer) => void;
  /** Opens the shared customer form so a new customer can be created. */
  onCreateNew: () => void;
}

/**
 * Finds an existing customer for the order. An empty search shows the most
 * recent customers; results come from the same customers endpoint the
 * directory page uses.
 */
export function CustomerPickerDialog({
  open,
  onOpenChange,
  selectedCustomerId,
  onSelect,
  onCreateNew,
}: CustomerPickerDialogProps) {
  const { view, searchInput, setSearchInput, debouncedSearch, refresh } =
    useCustomerPicker(open);
  const customers = view.status === "success" ? view.data : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>Select customer</DialogTitle>
          <DialogDescription>
            Search by name or phone number. The most recent customers are
            shown first.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search customers…"
            ariaLabel="Search customers"
          />

          {view.status === "error" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Alert variant="destructive" className="text-left">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{view.message}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : view.status === "loading" || view.status === "idle" ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 py-1.5">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {debouncedSearch
                ? `No customers match “${debouncedSearch}”.`
                : "No customers found."}
            </p>
          ) : (
            <ul
              aria-label="Customers"
              className="divide-border-subtle flex max-h-80 flex-col divide-y overflow-y-auto"
            >
              {customers.map((customer) => {
                const selected = customer.id === selectedCustomerId;

                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(customer)}
                      className={cn(
                        "hover:bg-surface-hover focus-visible:ring-ring/40 flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden",
                        selected && "bg-surface-active",
                      )}
                      aria-pressed={selected}
                    >
                      <CustomerAvatar name={customer.name} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-foreground truncate text-sm font-medium">
                          {customer.name}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {customer.phone}
                          {customer.city ? ` · ${formatOptionalValue(customer.city)}` : ""}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          className="text-primary size-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
          >
            <Plus aria-hidden="true" />
            Add new customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
