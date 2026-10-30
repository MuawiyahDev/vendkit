import type { Ref, SelectHTMLAttributes } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface NativeSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  /** Accessible name announced for the select. */
  ariaLabel: string;
  options: SelectOption[];
  /**
   * Optional leading option rendered with an empty value (e.g. an
   * "All categories" filter or a "Select one" prompt).
   */
  placeholder?: string;
  /** Forwarded ref (React 19 style) — required by react-hook-form. */
  ref?: Ref<HTMLSelectElement>;
}

/**
 * Styled native `<select>`. Native element is used deliberately for
 * keyboard/screen-reader support and mobile-friendly option pickers,
 * styled to match the Input component.
 */
export function NativeSelect({
  ariaLabel,
  options,
  placeholder,
  className,
  ...props
}: NativeSelectProps) {
  return (
    <span className={cn("relative inline-flex w-full", className)}>
      <select
        aria-label={ariaLabel}
        className="border-input bg-surface text-foreground hover:bg-surface-hover focus-visible:border-ring focus-visible:ring-ring/40 h-9 w-full cursor-pointer appearance-none rounded-md border pr-8 pl-3 text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [aria-invalid]:border-destructive [aria-invalid]:ring-destructive/20"
        {...props}
      >
        {placeholder !== undefined ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="text-muted-foreground pointer-events-none absolute right-2.5 size-4 -translate-y-1/2 top-1/2"
        aria-hidden="true"
      />
    </span>
  );
}
