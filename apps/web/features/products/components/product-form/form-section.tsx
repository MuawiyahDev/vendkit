"use client";

import { useId, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Labeled group of related form fields inside the product editor surface.
 * Full-bleed top borders keep the sections visually connected inside a
 * single card instead of splitting the form into separate cards.
 */
export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="border-border-subtle flex flex-col gap-5 border-t px-5 py-6 first:border-t-0 sm:px-6"
    >
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
      {children}
    </section>
  );
}
