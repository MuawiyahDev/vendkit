import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Shared report panel: one heading style, one padding rhythm, and enough room
 * for a small summary badge on the right.
 */
export function ReportCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: ReportCardProps) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0 shadow-xs", className)}>
      <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:flex-row sm:items-start sm:justify-between">
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
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("px-5 pb-5", contentClassName)}>{children}</div>
    </Card>
  );
}

interface ReportEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Quiet empty state for a report panel, sized to sit inside a card. */
export function ReportEmptyState({
  icon: Icon,
  title,
  description,
}: ReportEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <span className="bg-surface-muted text-muted-foreground ring-border-subtle flex size-10 items-center justify-center rounded-xl ring-1 ring-inset">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
