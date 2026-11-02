"use client";

import { AlertCircle, Check, Plus } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductThumbnail } from "@/features/products/components/product-thumbnail";
import type { Product } from "@/features/products/api/products-api";
import { formatAmount } from "@/lib/format";

import { useProductPicker } from "../../hooks/use-product-picker";

interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Products already on the order, shown as added. */
  addedProductIds: string[];
  onAdd: (product: Product) => void;
}

/** First display image of a product, or null when it has none. */
export function getPrimaryImageUrl(product: Product): string | null {
  const primary = product.images.find((image) => image.isPrimary);
  return (primary ?? product.images[0])?.image.url ?? null;
}

function StockBadge({ product }: { product: Product }) {
  if (product.stockQuantity === 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }
  if (
    product.lowStockThreshold !== null &&
    product.stockQuantity <= product.lowStockThreshold
  ) {
    return (
      <Badge variant="warning">{product.stockQuantity} in stock · low</Badge>
    );
  }
  return (
    <Badge variant="secondary">{product.stockQuantity} in stock</Badge>
  );
}

/**
 * Searches the active product catalog and adds products to the order.
 * Unit prices always come from the product's current selling price — the
 * backend snapshots them at order creation.
 */
export function ProductPickerDialog({
  open,
  onOpenChange,
  addedProductIds,
  onAdd,
}: ProductPickerDialogProps) {
  const { view, searchInput, setSearchInput, debouncedSearch, refresh } =
    useProductPicker(open);
  const products = view.status === "success" ? view.data : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>Add products</DialogTitle>
          <DialogDescription>
            Search your active catalog by name or SKU. Prices are taken from
            the current selling price.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-4">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search products…"
            ariaLabel="Search products"
          />

          {view.status === "error" ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Alert variant="destructive" className="text-left">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{view.message}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : view.status === "loading" || view.status === "idle" ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-10" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="ml-auto h-8 w-20" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {debouncedSearch
                ? `No active products match “${debouncedSearch}”.`
                : "No active products found."}
            </p>
          ) : (
            <ul
              aria-label="Products"
              className="divide-border-subtle flex max-h-96 flex-col divide-y overflow-y-auto"
            >
              {products.map((product) => {
                const added = addedProductIds.includes(product.id);
                const outOfStock = product.stockQuantity === 0;

                return (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="border-border-subtle bg-surface-muted size-10 shrink-0 overflow-hidden rounded-md border">
                      <ProductThumbnail
                        src={getPrimaryImageUrl(product)}
                        alt={product.name}
                        className="size-full"
                      />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span
                        className="text-foreground truncate text-sm font-medium"
                        title={product.name}
                      >
                        {product.name}
                      </span>
                      <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        {product.sku ? <span>SKU {product.sku}</span> : null}
                        <span className="tabular-nums">
                          {formatAmount(product.sellingPrice)}
                        </span>
                        <StockBadge product={product} />
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={added ? "outline" : "default"}
                      disabled={added || outOfStock}
                      onClick={() => onAdd(product)}
                      className="shrink-0"
                    >
                      {added ? (
                        <>
                          <Check aria-hidden="true" />
                          Added
                        </>
                      ) : outOfStock ? (
                        "Out of stock"
                      ) : (
                        <>
                          <Plus aria-hidden="true" />
                          Add
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
