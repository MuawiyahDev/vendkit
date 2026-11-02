"use client";

import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { OrderSortField, SortOrder } from "../api/orders-api";

interface SortOption {
  value: string;
  label: string;
  sortBy: OrderSortField;
  sortOrder: SortOrder;
}

const SORT_OPTIONS: SortOption[] = [
  {
    value: "createdAt:desc",
    label: "Newest first",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt:asc",
    label: "Oldest first",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "updatedAt:desc",
    label: "Recently updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  {
    value: "orderNumber:asc",
    label: "Order number A–Z",
    sortBy: "orderNumber",
    sortOrder: "asc",
  },
  {
    value: "totalAmount:desc",
    label: "Total: high to low",
    sortBy: "totalAmount",
    sortOrder: "desc",
  },
  {
    value: "totalAmount:asc",
    label: "Total: low to high",
    sortBy: "totalAmount",
    sortOrder: "asc",
  },
];

interface OrdersSortMenuProps {
  sortBy: OrderSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: OrderSortField;
    sortOrder: SortOrder;
  }) => void;
  disabled?: boolean;
}

export function OrdersSortMenu({
  sortBy,
  sortOrder,
  onSortChange,
  disabled = false,
}: OrdersSortMenuProps) {
  const currentValue = `${sortBy}:${sortOrder}`;
  const currentLabel =
    SORT_OPTIONS.find((option) => option.value === currentValue)?.label ??
    "Custom order";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`Sort orders: ${currentLabel}`}
          className="gap-2"
        >
          <ArrowUpDown aria-hidden="true" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="sm:hidden">Sort</span>
          <ChevronDown
            className="text-muted-foreground size-3.5"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground px-2.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
          Sort by
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currentValue}
          onValueChange={(value) => {
            const option = SORT_OPTIONS.find((item) => item.value === value);
            if (option) {
              onSortChange({
                sortBy: option.sortBy,
                sortOrder: option.sortOrder,
              });
            }
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className={cn(
                "cursor-pointer",
                option.value === currentValue && "font-medium",
              )}
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
