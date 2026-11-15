"use client";

import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  DASHBOARD_PRESET_LABELS,
  DASHBOARD_PRESET_OPTIONS,
} from "../dashboard.constants";
import type {
  DashboardPreset,
  DashboardRangeSelection,
} from "../dashboard.types";
import { formatRangeLabel } from "../utils/dashboard.utils";

interface DashboardDateFilterProps {
  selection: DashboardRangeSelection;
  /** Resolved label from the last successful response, when available. */
  rangeLabel: string;
  dateFormat: string;
  disabled?: boolean;
  onSelect: (selection: DashboardRangeSelection) => void;
}

export function DashboardDateFilter({
  selection,
  rangeLabel,
  dateFormat,
  disabled,
  onSelect,
}: DashboardDateFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const label =
    selection.preset === "custom"
      ? formatRangeLabel(selection.from, selection.to, dateFormat)
      : rangeLabel;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setCustomFrom(selection.preset === "custom" ? selection.from : "");
      setCustomTo(selection.preset === "custom" ? selection.to : "");
      setValidationError(null);
    }
    setOpen(nextOpen);
  }

  function choosePreset(preset: DashboardPreset) {
    if (preset === "custom") {
      return;
    }

    onSelect({ preset });
    setOpen(false);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) {
      setValidationError("Choose both a start and an end date.");
      return;
    }

    if (customFrom > customTo) {
      setValidationError("The start date must be on or before the end date.");
      return;
    }

    onSelect({ preset: "custom", from: customFrom, to: customTo });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-9 justify-start gap-2 px-3 font-normal"
          aria-label={`Date range: ${label}`}
        >
          <CalendarDays className="text-muted-foreground" aria-hidden="true" />
          <span className="max-w-52 truncate">{label}</span>
          <ChevronDown
            className="text-muted-foreground ml-auto size-3.5"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-2"
        aria-label="Choose date range"
      >
        <div className="flex flex-col gap-0.5">
          {DASHBOARD_PRESET_OPTIONS.map((preset) => {
            const active = selection.preset === preset;

            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => choosePreset(preset)}
                className={cn(
                  "focus-visible:ring-ring/40 flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px]",
                  active
                    ? "bg-primary-soft text-primary-soft-foreground font-medium"
                    : "hover:bg-surface-hover",
                )}
              >
                <span>{DASHBOARD_PRESET_LABELS[preset]}</span>
                {active ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="border-border-subtle mt-2 border-t p-2.5 pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium">Custom range</p>
            {selection.preset === "custom" ? (
              <Check className="text-primary size-3.5" aria-hidden="true" />
            ) : null}
          </div>
          <div className="grid gap-2">
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">From</span>
              <Input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(event) => {
                  setCustomFrom(event.target.value);
                  setValidationError(null);
                }}
                aria-label="Custom range start date"
                className="h-8"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-muted-foreground">To</span>
              <Input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(event) => {
                  setCustomTo(event.target.value);
                  setValidationError(null);
                }}
                aria-label="Custom range end date"
                className="h-8"
              />
            </label>
          </div>

          {validationError ? (
            <p className="text-destructive-soft-foreground mt-2 text-xs">
              {validationError}
            </p>
          ) : null}

          <Button
            type="button"
            size="sm"
            onClick={applyCustomRange}
            className="mt-3 w-full"
          >
            Apply custom range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
