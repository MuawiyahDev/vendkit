"use client";

import { useId, type ReactNode } from "react";

interface OrderFormSectionProps {
  title: string;
  description?: string;
  /** Optional section-level control (e.g. an "Add product" button). */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Labeled group of related order form fields. Full-bleed top borders keep
 * the sections visually connected inside a single card.
 */
export function OrderFormSection({
  title,
  description,
  action,
  children,
}: OrderFormSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="border-border-subtle flex flex-col gap-5 border-t px-5 py-6 first:border-t-0 sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id={headingId} className="text-sm font-semibold tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-xs leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
