"use client";

import type { ReactNode } from "react";

import { FieldError } from "@/components/shared/field-error";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingsFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent label, control, hint, and inline error wrapper used by every
 * settings form. The `id` must match the control's `id` and error id.
 */
export function SettingsField({
  id,
  label,
  optional = false,
  hint,
  error,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="text-muted-foreground font-normal">(optional)</span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p
          id={`${id}-hint`}
          className="text-muted-foreground text-xs leading-relaxed"
        >
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
