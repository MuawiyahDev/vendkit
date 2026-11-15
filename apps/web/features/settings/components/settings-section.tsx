"use client";

import { useId, type ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * A labeled group of related settings fields. Sections sit inside a single
 * card and are separated with a subtle rule rather than nested cards.
 */
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
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
