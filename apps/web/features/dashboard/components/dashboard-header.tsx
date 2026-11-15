"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session/session-provider";

import type {
  DashboardRangeSelection,
  DashboardRegionalSettings,
} from "../dashboard.types";
import { getTimeOfDayGreeting } from "../utils/dashboard.utils";
import { DashboardDateFilter } from "./dashboard-date-filter";

interface DashboardHeaderProps {
  selection: DashboardRangeSelection;
  rangeLabel: string;
  regional: DashboardRegionalSettings | null;
  isFetching: boolean;
  onSelectRange: (selection: DashboardRangeSelection) => void;
  onRefresh: () => void;
}

export function DashboardHeader({
  selection,
  rangeLabel,
  regional,
  isFetching,
  onSelectRange,
  onRefresh,
}: DashboardHeaderProps) {
  const { user } = useSession();
  const firstName = user?.name?.trim().split(" ")[0];
  const greeting = regional
    ? getTimeOfDayGreeting(regional.timezone)
    : "Welcome back";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[1.75rem]">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed text-pretty">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <DashboardDateFilter
          selection={selection}
          rangeLabel={rangeLabel}
          dateFormat={regional?.dateFormat ?? "DD/MM/YYYY"}
          disabled={isFetching}
          onSelect={onSelectRange}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh dashboard"
          title="Refresh dashboard"
        >
          <RefreshCw
            className={isFetching ? "animate-spin" : undefined}
            aria-hidden="true"
          />
        </Button>
      </div>
    </header>
  );
}
