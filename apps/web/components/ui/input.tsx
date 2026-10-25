"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const inputClassName = cn(
  "border-input placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-surface px-3 py-1 text-base shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground hover:border-border-strong disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 md:text-sm",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
);

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [revealed, setRevealed] = React.useState(false);

  if (type === "password") {
    return (
      <div className="relative">
        <input
          type={revealed ? "text" : "password"}
          data-slot="input"
          className={cn(inputClassName, "pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
          disabled={props.disabled}
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none transition-colors motion-reduce:transition-none focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {revealed ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  );
}

export { Input };
