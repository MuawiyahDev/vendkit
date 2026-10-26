import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function CategoryStatusBadge({
  isActive,
  className,
}: CategoryStatusBadgeProps) {
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
