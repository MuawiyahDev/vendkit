"use client";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";

import { INVOICE_STATUSES } from "../invoices-api";
import type { InvoiceStatusFilter } from "../hooks/use-invoices";
import { formatInvoiceStatus } from "../invoice.utils";

interface InvoicesToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: InvoiceStatusFilter;
  onStatusChange: (value: InvoiceStatusFilter) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...INVOICE_STATUSES.map((status) => ({
    value: status,
    label: formatInvoiceStatus(status),
  })),
];

export function InvoicesToolbar({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
  disabled = false,
}: InvoicesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={searchInput}
        onChange={onSearchChange}
        disabled={disabled}
        placeholder="Search invoice, order, or customer"
        ariaLabel="Search invoices"
        className="sm:max-w-sm"
      />

      <NativeSelect
        ariaLabel="Filter invoices by status"
        value={statusFilter}
        options={STATUS_OPTIONS}
        onChange={(event) =>
          onStatusChange(event.target.value as InvoiceStatusFilter)
        }
        disabled={disabled}
        className="sm:w-44"
      />

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={disabled}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
