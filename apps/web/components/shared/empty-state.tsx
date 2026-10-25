import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border-strong/70 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="bg-surface-muted text-muted-foreground ring-border-subtle flex size-12 items-center justify-center rounded-xl ring-1 ring-inset">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <div className="flex max-w-md flex-col gap-1.5">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </section>
  );
}
