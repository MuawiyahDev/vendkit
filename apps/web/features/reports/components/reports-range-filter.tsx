"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  REPORT_RANGE_PRESETS,
  type ReportRangePresetId,
} from "../reports.constants";
import { toDateInput } from "../reports.utils";

interface ReportsRangeFilterProps {
  fromInput: string;
  toInput: string;
  activePreset: ReportRangePresetId | null;
  rangeLabel: string;
  days: number;
  isFetching: boolean;
  onFromInputChange: (value: string) => void;
  onToInputChange: (value: string) => void;
  onPresetSelect: (preset: ReportRangePresetId) => void;
  onApply: () => void;
}

/**
 * Date controls for the report. Quick presets apply immediately; custom dates
 * only apply when the user confirms, so partial input never triggers a fetch.
 */
export function ReportsRangeFilter({
  fromInput,
  toInput,
  activePreset,
  rangeLabel,
  days,
  isFetching,
  onFromInputChange,
  onToInputChange,
  onPresetSelect,
  onApply,
}: ReportsRangeFilterProps) {
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-primary-soft text-primary-soft-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <CalendarDays className="size-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium">Reporting period</p>
              <p className="text-muted-foreground truncate text-xs">
                {rangeLabel} · {days} day{days === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div
            className="bg-surface-muted flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg p-1"
            role="group"
            aria-label="Quick date ranges"
          >
            {REPORT_RANGE_PRESETS.map((preset) => {
              const isActive = activePreset === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onPresetSelect(preset.id)}
                  className={cn(
                    "focus-visible:ring-ring/40 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]",
                    isActive
                      ? "bg-surface text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-border-subtle flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:max-w-md sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-from" className="text-xs">
                From
              </Label>
              <Input
                id="report-from"
                type="date"
                value={fromInput}
                max={toInput || undefined}
                onChange={(event) => onFromInputChange(event.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-to" className="text-xs">
                To
              </Label>
              <Input
                id="report-to"
                type="date"
                value={toInput}
                min={fromInput || undefined}
                max={toDateInput(new Date())}
                onChange={(event) => onToInputChange(event.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={onApply}
            disabled={isFetching || !fromInput || !toInput}
            className="w-full sm:ml-auto sm:w-auto"
          >
            <CalendarDays aria-hidden="true" />
            {isFetching ? "Updating…" : "Apply range"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
