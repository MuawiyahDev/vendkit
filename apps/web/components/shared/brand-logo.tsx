import { ReceiptText } from "lucide-react";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function BrandLogo({ collapsed = false, className }: BrandLogoProps) {
  return (
    <div
      className={cn("flex min-w-0 items-center gap-2.5", className)}
      aria-label="OpenOrder"
    >
      <span
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <ReceiptText className="size-4.5" />
      </span>
      {!collapsed ? (
        <span className="truncate text-sm font-semibold tracking-tight">
          OpenOrder
        </span>
      ) : null}
    </div>
  );
}
