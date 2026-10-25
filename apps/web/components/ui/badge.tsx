import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary-soft text-primary-soft-foreground [a&]:hover:bg-primary-soft/80",
        secondary:
          "border-border-subtle bg-surface-muted text-muted-foreground [a&]:hover:bg-surface-active [a&]:hover:text-foreground",
        destructive:
          "border-destructive/15 bg-destructive-soft text-destructive-soft-foreground [a&]:hover:bg-destructive-soft/80",
        outline:
          "border-border-strong bg-transparent text-foreground [a&]:hover:bg-surface-hover [a&]:hover:text-foreground",
        success:
          "border-success/20 bg-success-soft text-success-soft-foreground [a&]:hover:bg-success-soft/80",
        warning:
          "border-warning/20 bg-warning-soft text-warning-soft-foreground [a&]:hover:bg-warning-soft/80",
        info: "border-info/20 bg-info-soft text-info-soft-foreground [a&]:hover:bg-info-soft/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  dot = false,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    /** Renders a small leading status dot in the current text color. */
    dot?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current opacity-80"
        />
      ) : null}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
