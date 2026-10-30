import { createColumnHelper, type SortingState } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { formatAmount, formatDate } from "@/lib/format";

import type { Product } from "../api/products-api";
import { getPrimaryImage } from "../utils/products.utils";
import { ProductRowActions } from "./product-row-actions";
import { ProductStatusBadge } from "./product-status-badge";
import { ProductStockSummary } from "./product-stock-summary";
import { ProductThumbnail } from "./product-thumbnail";

const columnHelper = createColumnHelper<DataTableFeatures, Product>();

interface ProductsTableProps {
  products: Product[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  updatingStatusId: string | null;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function primaryImageUrl(product: Product): string | null {
  return getPrimaryImage(product)?.image.url ?? null;
}

export function ProductsTable({
  products,
  sorting,
  onSortingChange,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductsTableProps) {
  const isStatusUpdatePending = updatingStatusId !== null;

  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      enableSorting: true,
      meta: { className: "min-w-[300px]" },
      header: "Product",
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="border-border-subtle bg-surface-muted ring-border-subtle size-9 shrink-0 overflow-hidden rounded-md ring-1 ring-inset">
            <ProductThumbnail
              src={primaryImageUrl(row.original)}
              alt={row.original.name}
            />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              title={row.original.name}
              className="text-foreground max-w-[260px] truncate text-sm font-medium"
            >
              {row.original.name}
            </span>
            <span className="text-muted-foreground max-w-[260px] truncate font-mono text-xs">
              {row.original.sku ?? `/${row.original.slug}`}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor((product) => product.category.name, {
      id: "category",
      enableSorting: false,
      meta: { className: "hidden md:table-cell w-[150px]" },
      header: "Category",
      cell: ({ getValue }) => (
        <span
          title={getValue()}
          className="text-muted-foreground block max-w-[150px] truncate text-sm"
        >
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor(
      (product) => product.brand?.name ?? null,
      {
        id: "brand",
        enableSorting: false,
        meta: { className: "hidden lg:table-cell w-[140px]" },
        header: "Brand",
        cell: ({ getValue }) => {
          const brand = getValue();
          return brand === null ? (
            <span className="text-muted-foreground/70 text-sm">—</span>
          ) : (
            <span
              title={brand}
              className="text-muted-foreground block max-w-[140px] truncate text-sm"
            >
              {brand}
            </span>
          );
        },
      },
    ),
    columnHelper.accessor("sellingPrice", {
      enableSorting: true,
      meta: { className: "w-[130px]" },
      header: "Price",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium tabular-nums">
            {formatAmount(row.original.sellingPrice)}
          </span>
          {row.original.compareAtPrice !== null ? (
            <span className="text-muted-foreground text-xs tabular-nums line-through">
              {formatAmount(row.original.compareAtPrice)}
            </span>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor("stockQuantity", {
      enableSorting: true,
      meta: { className: "w-[150px]" },
      header: "Stock",
      cell: ({ row }) => <ProductStockSummary product={row.original} />,
    }),
    columnHelper.accessor("isActive", {
      enableSorting: false,
      meta: { className: "w-[110px]" },
      header: "Status",
      cell: ({ row }) => (
        <ProductStatusBadge isActive={row.original.isActive} />
      ),
    }),
    columnHelper.accessor("createdAt", {
      enableSorting: true,
      meta: { className: "hidden lg:table-cell w-[130px]" },
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      meta: { className: "w-[64px] text-right" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <ProductRowActions
          product={row.original}
          isUpdatingStatus={updatingStatusId === row.original.id}
          isStatusUpdatePending={isStatusUpdatePending}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ),
    }),
  ]);

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          label="Products"
          columns={columns}
          data={products}
          getRowId={(product) => product.id}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
      </div>

      <ProductMobileList
        products={products}
        updatingStatusId={updatingStatusId}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
      />
    </>
  );
}

interface ProductMobileListProps {
  products: Product[];
  updatingStatusId: string | null;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function ProductMobileList({
  products,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductMobileListProps) {
  const isStatusUpdatePending = updatingStatusId !== null;

  return (
    <ul
      aria-label="Products"
      className="divide-border-subtle divide-y md:hidden"
    >
      {products.map((product) => (
        <li
          key={product.id}
          className="group hover:bg-surface-hover/50 flex items-start gap-3 px-4 py-4 transition-colors focus-within:bg-surface-hover/50 active:bg-surface-active/60 motion-reduce:transition-none"
        >
          <span className="border-border-subtle bg-surface-muted ring-border-subtle size-11 shrink-0 overflow-hidden rounded-md ring-1 ring-inset">
            <ProductThumbnail src={primaryImageUrl(product)} alt={product.name} />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  title={product.name}
                  className="text-foreground max-w-[220px] truncate text-sm font-semibold"
                >
                  {product.name}
                </span>
                <span className="text-muted-foreground max-w-[220px] truncate font-mono text-xs">
                  {product.sku ?? `/${product.slug}`}
                </span>
              </div>
              <ProductRowActions
                product={product}
                isUpdatingStatus={updatingStatusId === product.id}
                isStatusUpdatePending={isStatusUpdatePending}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-foreground text-sm font-medium tabular-nums">
                {formatAmount(product.sellingPrice)}
              </span>
              <ProductStatusBadge isActive={product.isActive} />
              <ProductStockSummary product={product} />
            </div>

            <span className="text-muted-foreground text-xs">
              {product.category.name}
              {product.brand ? ` · ${product.brand.name}` : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
