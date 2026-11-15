import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Consistent card heading used by every dashboard section. */
export function DashboardSectionHeader({
  title,
  description,
  action,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-base leading-snug font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
