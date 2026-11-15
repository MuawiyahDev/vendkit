import { TrendingUp } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductThumbnail } from "@/features/products/components/product-thumbnail";

import type {
  DashboardBestSellingProduct,
  DashboardRegionalSettings,
} from "../dashboard.types";
import { formatCount, formatDashboardMoney } from "../utils/dashboard.utils";
import { DashboardSectionHeader } from "./dashboard-section-header";

interface BestSellingProductsProps {
  products: DashboardBestSellingProduct[];
  regional: DashboardRegionalSettings;
  rangeLabel: string;
}

export function BestSellingProducts({
  products,
  regional,
  rangeLabel,
}: BestSellingProductsProps) {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="p-5 pb-4">
        <DashboardSectionHeader
          title="Best-selling products"
          description={`By units sold in ${rangeLabel}`}
          action={
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/products">View products</Link>
            </Button>
          }
        />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No product sales yet"
          description="Products sold in the selected period will be ranked here by units sold."
          className="rounded-none border-0 bg-transparent py-12"
        >
          <Button type="button" variant="outline" asChild>
            <Link href="/products">View products</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="divide-border-subtle divide-y">
          {products.map((product, index) => (
            <li key={product.productId}>
              <Link
                href={`/products/${product.productId}/edit`}
                className="hover:bg-surface-hover focus-visible:ring-ring/40 flex items-center gap-3 px-5 py-3 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset"
              >
                <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">
                  {index + 1}
                </span>
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
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-medium tabular-nums">
                    {formatDashboardMoney(product.revenue, regional)}
                  </span>
                  <span className="text-muted-foreground block text-xs tabular-nums">
                    {formatCount(product.unitsSold)} sold
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
