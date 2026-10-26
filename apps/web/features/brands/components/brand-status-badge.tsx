import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BrandStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function BrandStatusBadge({
  isActive,
  className,
}: BrandStatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? "success" : "secondary"}
      dot
      className={cn("capitalize", className)}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
