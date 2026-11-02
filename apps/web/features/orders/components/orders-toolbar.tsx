"use client";

import { ListFilter, RefreshCw, RotateCcw } from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ORDER_STATUSES, PAYMENT_STATUSES } from "../api/orders-api";
import type {
  OrderSortField,
  SortOrder,
} from "../api/orders-api";
import type {
  OrderStatusFilter,
  PaymentStatusFilter,
} from "../hooks/use-orders";
import { formatStatusLabel } from "../utils/orders.utils";
import { OrdersSortMenu } from "./orders-sort-menu";

const STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...ORDER_STATUSES.map((status) => ({
    value: status as OrderStatusFilter,
    label: formatStatusLabel(status),
  })),
];

const PAYMENT_OPTIONS: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All payments" },
  ...PAYMENT_STATUSES.map((status) => ({
    value: status as PaymentStatusFilter,
    label: formatStatusLabel(status),
  })),
];

interface OrdersToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number | null;
  statusFilter: OrderStatusFilter;
  onStatusFilterChange: (value: OrderStatusFilter) => void;
  paymentStatusFilter: PaymentStatusFilter;
  onPaymentStatusFilterChange: (value: PaymentStatusFilter) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  sortBy: OrderSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: OrderSortField;
    sortOrder: SortOrder;
  }) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Search, status/payment/date filters, sorting, and refresh controls for
 * the orders table. Every filter maps directly to a supported NestJS
 * orders list query parameter.
 */
export function OrdersToolbar({
  searchInput,
  onSearchChange,
  isInitialLoading,
  isFetching,
  total,
  statusFilter,
  onStatusFilterChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRefresh,
  onResetFilters,
  hasActiveFilters,
}: OrdersToolbarProps) {
  return (
    <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          disabled={isInitialLoading}
          placeholder="Search order number or customer…"
          ariaLabel="Search orders"
        />

        <div className="flex items-center gap-2">
          {total !== null ? (
            <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
              {total.toLocaleString()} {total === 1 ? "order" : "orders"}
            </span>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isInitialLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" />
              <span className="hidden sm:inline">Reset filters</span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isInitialLoading || isFetching}
            aria-label="Refresh orders"
            title="Refresh orders"
          >
            <RefreshCw
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ListFilter
          className="text-muted-foreground hidden size-4 shrink-0 sm:block"
          aria-hidden="true"
        />
        <NativeSelect
          ariaLabel="Filter by order status"
          value={statusFilter}
          disabled={isInitialLoading}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as OrderStatusFilter)
          }
          className="w-full sm:w-auto sm:min-w-40"
          options={STATUS_OPTIONS}
        />
        <NativeSelect
          ariaLabel="Filter by payment status"
          value={paymentStatusFilter}
          disabled={isInitialLoading}
          onChange={(event) =>
            onPaymentStatusFilterChange(
              event.target.value as PaymentStatusFilter,
            )
          }
          className="w-full sm:w-auto sm:min-w-44"
          options={PAYMENT_OPTIONS}
        />
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="whitespace-nowrap">From</span>
          <Input
            type="date"
            value={dateFrom}
            disabled={isInitialLoading}
            onChange={(event) => onDateFromChange(event.target.value)}
            aria-label="Orders from date"
            className="h-9 w-full sm:w-auto"
          />
        </label>
        <label className="text-muted-foreground flex items-center gap-2 text-xs">
          <span className="whitespace-nowrap">To</span>
          <Input
            type="date"
            value={dateTo}
            disabled={isInitialLoading}
            onChange={(event) => onDateToChange(event.target.value)}
            aria-label="Orders to date"
            className="h-9 w-full sm:w-auto"
          />
        </label>
        <div className="ml-auto w-full sm:w-auto">
          <OrdersSortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            disabled={isInitialLoading}
          />
        </div>
      </div>
    </div>
  );
}
