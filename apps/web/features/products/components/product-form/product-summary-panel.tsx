"use client";

import { useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Brand } from "@/features/brands/api/brands-api";
import type { Category } from "@/features/categories/api/categories-api";
import type { PickedImage } from "@/features/images/api/images-api";
import { ImageThumbnail } from "@/features/images/components/image-thumbnail";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ProductStatusBadge } from "../product-status-badge";
import { isLowStockValue } from "../../utils/products.utils";
import type { ProductFormApi } from "./product-form.types";

interface ProductSummaryPanelProps {
  form: ProductFormApi;
  /** Current ordered image selection; the first one is primary. */
  images: PickedImage[];
  categories: Category[];
  brands: Brand[];
}

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="text-muted-foreground shrink-0 text-xs">{label}</dt>
      <dd
        className={cn(
          "text-foreground truncate text-right text-sm font-medium",
          className,
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Compact live preview of the product being edited: primary image, status,
 * pricing, stock, and catalog placement — all driven by form state so it
 * updates as the merchant types.
 */
export function ProductSummaryPanel({
  form,
  images,
  categories,
  brands,
}: ProductSummaryPanelProps) {
  const { control } = form;

  const name = useWatch({ control, name: "name" });
  const sku = useWatch({ control, name: "sku" });
  const sellingPrice = useWatch({ control, name: "sellingPrice" });
  const compareAtPrice = useWatch({ control, name: "compareAtPrice" });
  const stockQuantity = useWatch({ control, name: "stockQuantity" });
  const lowStockThreshold = useWatch({ control, name: "lowStockThreshold" });
  const isActive = useWatch({ control, name: "isActive" });
  const categoryId = useWatch({ control, name: "categoryId" });
  const brandId = useWatch({ control, name: "brandId" });

  const primaryImage = images[0] ?? null;
  const category = categories.find((item) => item.id === categoryId);
  const brand = brands.find((item) => item.id === brandId);
  const stock = stockQuantity ?? 0;
  const isLow = isLowStockValue(stock, lowStockThreshold ?? null);
  const displayName = name.trim();

  return (
    <aside
      aria-label="Product summary"
      className="mx-auto w-full max-w-md lg:sticky lg:top-20 lg:mx-0 lg:max-w-none"
    >
      <Card className="gap-5 py-5">
        <CardHeader className="px-5">
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>

        <div className="flex flex-col gap-4 px-5">
          <div className="border-border-subtle bg-surface-muted ring-border-subtle relative aspect-square overflow-hidden rounded-lg ring-1 ring-inset">
            {primaryImage ? (
              <ImageThumbnail
                src={primaryImage.url}
                alt={
                  primaryImage.altText?.trim() || primaryImage.originalName
                }
              />
            ) : (
              <span
                role="img"
                aria-label="No product image selected"
                className="text-muted-foreground/70 flex size-full items-center justify-center"
              >
                <span className="text-xs font-medium">No image</span>
              </span>
            )}
            <span className="border-border-subtle bg-surface/90 text-muted-foreground absolute right-2 bottom-2 rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-medium tabular-nums backdrop-blur-sm">
              {images.length} {images.length === 1 ? "image" : "images"}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-foreground line-clamp-2 text-sm font-semibold">
              {displayName || (
                <span className="text-muted-foreground font-normal">
                  Untitled product
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ProductStatusBadge isActive={isActive} />
              {isLow ? (
                <Badge variant="warning">Low stock</Badge>
              ) : null}
            </div>
          </div>

          <dl className="border-border-subtle divide-border-subtle divide-y border-t pt-2">
            <SummaryRow
              label="Selling price"
              value={formatAmount(sellingPrice ?? 0)}
            />
            {compareAtPrice !== null && compareAtPrice !== undefined ? (
              <SummaryRow
                label="Compare-at"
                value={
                  <span className="text-muted-foreground line-through">
                    {formatAmount(compareAtPrice)}
                  </span>
                }
              />
            ) : null}
            <SummaryRow
              label="Stock"
              value={
                <span className="tabular-nums">
                  {Number.isFinite(stock) ? stock : "—"}
                  {lowStockThreshold !== null &&
                  lowStockThreshold !== undefined ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      / {lowStockThreshold} threshold
                    </span>
                  ) : null}
                </span>
              }
            />
            <SummaryRow
              label="SKU"
              value={
                sku?.trim() ? (
                  <span className="font-mono text-xs">{sku.trim()}</span>
                ) : (
                  <span className="text-muted-foreground font-normal">—</span>
                )
              }
            />
            <SummaryRow
              label="Category"
              value={
                category ? (
                  category.name
                ) : (
                  <span className="text-muted-foreground font-normal">—</span>
                )
              }
            />
            <SummaryRow
              label="Brand"
              value={
                brand ? (
                  brand.name
                ) : (
                  <span className="text-muted-foreground font-normal">—</span>
                )
              }
            />
          </dl>

          <p className="text-muted-foreground text-xs leading-relaxed">
            The first image is used as the product's primary image. The
            preview updates as you edit.
          </p>
        </div>
      </Card>
    </aside>
  );
}

/** Loading placeholder for the summary panel while the product loads. */
export function ProductSummaryPanelSkeleton() {
  return (
    <Card className="gap-5 py-5" aria-hidden="true">
      <CardHeader className="px-5">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <div className="flex flex-col gap-4 px-5">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}
