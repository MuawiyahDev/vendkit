import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { formatDate } from "@/lib/format";

import type { Brand } from "../api/brands-api";
import { BrandRowActions } from "./brand-row-actions";
import { BrandStatusBadge } from "./brand-status-badge";

const columnHelper = createColumnHelper<DataTableFeatures, Brand>();

interface BrandsTableProps {
  brands: Brand[];
  updatingStatusId: string | null;
  onEdit: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export function BrandsTable({
  brands,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: BrandsTableProps) {
  const isStatusUpdatePending = updatingStatusId !== null;
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      enableSorting: false,
      meta: { className: "min-w-[260px]" },
      header: "Brand",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            title={row.original.name}
            className="text-foreground max-w-[280px] truncate text-sm font-medium"
          >
            {row.original.name}
          </span>
          <span
            title={row.original.slug}
            className="text-muted-foreground max-w-[280px] truncate font-mono text-xs"
          >
            /{row.original.slug}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("isActive", {
      enableSorting: false,
      meta: { className: "w-[120px]" },
      header: "Status",
      cell: ({ row }) => (
        <BrandStatusBadge isActive={row.original.isActive} />
      ),
    }),
    columnHelper.accessor("createdAt", {
      enableSorting: false,
      meta: { className: "hidden sm:table-cell" },
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
        <BrandRowActions
          brand={row.original}
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
          label="Brands"
          columns={columns}
          data={brands}
          getRowId={(brand) => brand.id}
        />
      </div>

      <BrandMobileList
        brands={brands}
        updatingStatusId={updatingStatusId}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
      />
    </>
  );
}

interface BrandMobileListProps {
  brands: Brand[];
  updatingStatusId: string | null;
  onEdit: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

function BrandMobileList({
  brands,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: BrandMobileListProps) {
  const isStatusUpdatePending = updatingStatusId !== null;

  return (
    <ul aria-label="Brands" className="divide-border-subtle divide-y md:hidden">
      {brands.map((brand) => (
        <li
          key={brand.id}
          className="group hover:bg-surface-hover/50 flex items-start gap-3 px-4 py-4 transition-colors focus-within:bg-surface-hover/50 active:bg-surface-active/60 motion-reduce:transition-none"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  title={brand.name}
                  className="text-foreground max-w-[220px] truncate text-sm font-semibold"
                >
                  {brand.name}
                </span>
                <span
                  title={brand.slug}
                  className="text-muted-foreground max-w-[220px] truncate font-mono text-xs"
                >
                  /{brand.slug}
                </span>
              </div>
              <BrandRowActions
                brand={brand}
                isUpdatingStatus={updatingStatusId === brand.id}
                isStatusUpdatePending={isStatusUpdatePending}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <BrandStatusBadge isActive={brand.isActive} />
              <span className="text-muted-foreground text-xs">
                Created {formatDate(brand.createdAt)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
