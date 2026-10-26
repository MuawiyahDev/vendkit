import { createColumnHelper } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { formatDate } from "@/lib/format";

import type { Category } from "../api/categories-api";
import { CategoryRowActions } from "./category-row-actions";
import { CategoryStatusBadge } from "./category-status-badge";

const columnHelper = createColumnHelper<DataTableFeatures, Category>();

interface CategoriesTableProps {
  categories: Category[];
  updatingStatusId: string | null;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoriesTable({
  categories,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: CategoriesTableProps) {
  const isStatusUpdatePending = updatingStatusId !== null;
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      enableSorting: false,
      meta: { className: "min-w-[260px]" },
      header: "Category",
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
        <CategoryStatusBadge isActive={row.original.isActive} />
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
        <CategoryRowActions
          category={row.original}
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
          label="Categories"
          columns={columns}
          data={categories}
          getRowId={(category) => category.id}
        />
      </div>

      <CategoryMobileList
        categories={categories}
        updatingStatusId={updatingStatusId}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
      />
    </>
  );
}

interface CategoryMobileListProps {
  categories: Category[];
  updatingStatusId: string | null;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function CategoryMobileList({
  categories,
  updatingStatusId,
  onEdit,
  onToggleStatus,
  onDelete,
}: CategoryMobileListProps) {
  const isStatusUpdatePending = updatingStatusId !== null;

  return (
    <ul
      aria-label="Categories"
      className="divide-border-subtle divide-y md:hidden"
    >
      {categories.map((category) => (
        <li
          key={category.id}
          className="group hover:bg-surface-hover/50 flex items-start gap-3 px-4 py-4 transition-colors focus-within:bg-surface-hover/50 active:bg-surface-active/60 motion-reduce:transition-none"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  title={category.name}
                  className="text-foreground max-w-[220px] truncate text-sm font-semibold"
                >
                  {category.name}
                </span>
                <span
                  title={category.slug}
                  className="text-muted-foreground max-w-[220px] truncate font-mono text-xs"
                >
                  /{category.slug}
                </span>
              </div>
              <CategoryRowActions
                category={category}
                isUpdatingStatus={updatingStatusId === category.id}
                isStatusUpdatePending={isStatusUpdatePending}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <CategoryStatusBadge isActive={category.isActive} />
              <span className="text-muted-foreground text-xs">
                Created {formatDate(category.createdAt)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
