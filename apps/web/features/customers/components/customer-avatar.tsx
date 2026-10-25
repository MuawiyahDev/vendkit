import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { getInitials } from "../utils/customers.utils";

interface CustomerAvatarProps {
  name: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Restrained initials avatar for customer rows and headers. A single brand
 * tint keeps long lists calm while still giving each record a visual anchor.
 */
export function CustomerAvatar({
  name,
  className,
  fallbackClassName,
}: CustomerAvatarProps) {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback
        className={cn(
          "bg-primary-soft text-primary-soft-foreground ring-primary/10 text-xs font-semibold tracking-wide ring-1 ring-inset",
          fallbackClassName,
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
