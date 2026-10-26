"use client";

import { ChevronDown, ListFilter } from "lucide-react";

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

import type { BrandStatusFilter } from "../hooks/use-brands";

const STATUS_OPTIONS: {
  value: BrandStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface BrandsStatusFilterProps {
  value: BrandStatusFilter;
  onChange: (value: BrandStatusFilter) => void;
  disabled?: boolean;
}

export function BrandsStatusFilter({
  value,
  onChange,
  disabled = false,
}: BrandsStatusFilterProps) {
  const currentLabel =
    STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    "All statuses";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={`Filter brands by status: ${currentLabel}`}
          className="gap-2"
        >
          <ListFilter aria-hidden="true" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <span className="sm:hidden">Status</span>
          <ChevronDown
            className="text-muted-foreground size-3.5"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-muted-foreground px-2.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.075em] uppercase">
          Status
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const option = STATUS_OPTIONS.find((item) => item.value === next);
            if (option) {
              onChange(option.value);
            }
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className={cn(
                "cursor-pointer",
                option.value === value && "font-medium",
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
