import { PackageCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductThumbnail } from "@/features/products/components/product-thumbnail";

import type { DashboardInventoryAlert } from "../dashboard.types";
import { formatCount } from "../utils/dashboard.utils";
import { DashboardSectionHeader } from "./dashboard-section-header";

interface InventoryAlertsProps {
  alerts: DashboardInventoryAlert[];
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="p-5 pb-4">
        <DashboardSectionHeader
          title="Inventory alerts"
          description="Current stock for active products"
          action={
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/inventory">View inventory</Link>
            </Button>
          }
        />
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <span className="bg-success-soft text-success-soft-foreground flex size-10 items-center justify-center rounded-lg">
            <PackageCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="flex max-w-xs flex-col gap-1">
            <p className="text-sm font-medium">Inventory looks healthy</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              No active products are low or out of stock right now.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-border-subtle divide-y">
          {alerts.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <li key={product.productId}>
                <Link
                  href={`/products/${product.productId}/edit`}
                  className="hover:bg-surface-hover focus-visible:ring-ring/40 flex items-center gap-3 px-5 py-3 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset"
                >
                  <span className="border-border-subtle bg-surface-muted size-10 shrink-0 overflow-hidden rounded-md border">
                    <ProductThumbnail
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-full"
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {product.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {product.sku ? `SKU ${product.sku}` : "No SKU"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={isOutOfStock ? "destructive" : "warning"}
                      dot
                    >
                      {isOutOfStock ? "Out of stock" : "Low stock"}
                    </Badge>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {isOutOfStock
                        ? "0 available"
                        : `${formatCount(product.stockQuantity)} left`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
