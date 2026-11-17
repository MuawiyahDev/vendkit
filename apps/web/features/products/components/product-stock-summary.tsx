import { TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Product } from "../api/products-api";
import { isLowStock } from "../utils/products.utils";

interface ProductStockSummaryProps {
  product: Product;
  /** Adds the muted "in stock" suffix label. */
  showSuffix?: boolean;
}

/**
 * Stock quantity with a clear low-stock indicator whenever the product has
 * a threshold and has reached or passed it.
 */
export function ProductStockSummary({
  product,
  showSuffix = false,
}: ProductStockSummaryProps) {
  if (!product.trackInventory) {
    return (
      <span className="text-muted-foreground text-sm">Not tracked</span>
    );
  }

  const low = isLowStock(product);

  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "text-sm tabular-nums",
          low ? "text-warning-soft-foreground font-semibold" : "text-foreground",
        )}
      >
        {product.stockQuantity.toLocaleString()}
      </span>
      {low ? (
        <Badge variant="warning" className="gap-1">
          <TriangleAlert aria-hidden="true" />
          Low stock
        </Badge>
      ) : showSuffix ? (
        <span className="text-muted-foreground text-xs">in stock</span>
      ) : null}
    </span>
  );
}
