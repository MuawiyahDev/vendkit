import { Badge } from "@/components/ui/badge";

export function ProductStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "secondary"} dot>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
