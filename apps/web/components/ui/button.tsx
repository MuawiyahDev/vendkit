import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:translate-y-px active:bg-primary-active active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:translate-y-px active:bg-destructive/80 active:shadow-none focus-visible:border-destructive focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/35",
        "destructive-outline":
          "border border-border-strong bg-surface text-destructive shadow-xs hover:border-destructive/30 hover:bg-destructive-soft hover:text-destructive-soft-foreground active:bg-destructive-soft/80 focus-visible:border-destructive focus-visible:ring-destructive/25 dark:border-input dark:bg-surface",
        outline:
          "border border-border-strong bg-surface text-foreground shadow-xs hover:border-foreground/20 hover:bg-surface-hover active:bg-surface-active active:shadow-none dark:border-input dark:bg-surface/60 dark:hover:bg-surface-hover",
        secondary:
          "bg-surface-muted text-secondary-foreground hover:bg-surface-active active:bg-surface-active/80",
        ghost:
          "hover:bg-surface-hover hover:text-foreground active:bg-surface-active dark:hover:bg-surface-hover",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.8125rem] has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
