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

import type { CustomerSortField, SortOrder } from "../api/customers-api";

interface SortOption {
  value: string;
  label: string;
  sortBy: CustomerSortField;
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
    value: "name:asc",
    label: "Name A–Z",
    sortBy: "name",
    sortOrder: "asc",
  },
  {
    value: "name:desc",
    label: "Name Z–A",
    sortBy: "name",
    sortOrder: "desc",
  },
];

interface CustomersSortMenuProps {
  sortBy: CustomerSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: CustomerSortField;
    sortOrder: SortOrder;
  }) => void;
  disabled?: boolean;
}

export function CustomersSortMenu({
  sortBy,
  sortOrder,
  onSortChange,
  disabled = false,
}: CustomersSortMenuProps) {
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
          aria-label={`Sort customers: ${currentLabel}`}
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
      <DropdownMenuContent align="end" className="w-52">
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
