import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { isNewCustomer } from "../utils/customers.utils";

interface CustomerStatusBadgeProps {
  createdAt: string;
  className?: string;
}

/**
 * Derived status shown for customers added within the last 30 days.
 * Renders nothing once the customer is no longer considered new.
 */
export function CustomerStatusBadge({
  createdAt,
  className,
}: CustomerStatusBadgeProps) {
  if (!isNewCustomer(createdAt)) {
    return null;
  }

  return (
    <Badge
      variant="success"
      title="Added in the last 30 days"
      className={cn(
        "px-1.5 py-0 text-[0.625rem] tracking-wide uppercase",
        className,
      )}
    >
      New
    </Badge>
  );
}
