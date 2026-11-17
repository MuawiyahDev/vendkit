import { Badge } from "@/components/ui/badge";

import type { StockStatus } from "../api/inventory-api";
import { STATUS_LABELS } from "../utils/inventory.utils";

const STATUS_VARIANTS: Record<
  StockStatus,
  "success" | "warning" | "destructive" | "secondary"
> = {
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "destructive",
  untracked: "secondary",
};

export function InventoryStatusBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} dot>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
