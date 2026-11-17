"use client";

import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { StockMovement } from "../api/inventory-api";
import {
  MOVEMENT_TYPE_LABELS,
  REASON_LABELS,
  signedQuantity,
} from "../utils/inventory.utils";

const columnHelper = createColumnHelper<DataTableFeatures, StockMovement>();

const INCREASE_TYPES = new Set([
  "INITIAL",
  "MANUAL_INCREASE",
  "RETURN",
] as const);

export function StockMovementsTable({ movements }: { movements: StockMovement[] }) {
  const columns = columnHelper.columns([
    columnHelper.accessor("createdAt", {
      meta: { className: "w-[150px]" },
      header: "When",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    }),
    columnHelper.accessor("productName", {
      meta: { className: "min-w-[220px]" },
      header: "Product",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          {row.original.productId ? (
            <Link
              href={`/products/${row.original.productId}/edit`}
              className="text-foreground hover:text-primary max-w-[240px] truncate text-sm font-medium transition-colors hover:underline hover:underline-offset-4"
            >
              {row.original.productName}
            </Link>
          ) : (
            <span className="max-w-[240px] truncate text-sm font-medium">
              {row.original.productName}
            </span>
          )}
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.sku ?? "No SKU"}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      meta: { className: "w-[160px]" },
      header: "Movement",
      cell: ({ row }) => <MovementBadge movement={row.original} />,
    }),
    columnHelper.accessor("quantityChange", {
      meta: { className: "w-[110px]" },
      header: "Change",
      cell: ({ row }) => (
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            row.original.quantityChange > 0
              ? "text-success-soft-foreground"
              : "text-destructive-soft-foreground",
          )}
        >
          {signedQuantity(row.original.quantityChange)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "balance",
      meta: { className: "hidden sm:table-cell w-[150px]" },
      header: "Before → after",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
          {row.original.previousQuantity.toLocaleString()}
          <span className="mx-1.5 opacity-60">→</span>
          <span className="text-foreground font-medium">
            {row.original.newQuantity.toLocaleString()}
          </span>
        </span>
      ),
    }),
    columnHelper.accessor("reason", {
      meta: { className: "hidden lg:table-cell w-[180px]" },
      header: "Reason",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-muted-foreground text-sm">
            {REASON_LABELS[row.original.reason]}
          </span>
          {row.original.note ? (
            <span
              title={row.original.note}
              className="text-muted-foreground/80 max-w-[180px] truncate text-xs"
            >
              {row.original.note}
            </span>
          ) : null}
        </div>
      ),
    }),
    columnHelper.display({
      id: "reference",
      meta: { className: "hidden xl:table-cell w-[180px]" },
      header: "Reference",
      cell: ({ row }) => <MovementReference movement={row.original} />,
    }),
    columnHelper.display({
      id: "user",
      meta: { className: "hidden xl:table-cell w-[140px]" },
      header: "By",
      cell: ({ row }) => (
        <span className="text-muted-foreground block max-w-[140px] truncate text-sm">
          {row.original.userName ?? "System"}
        </span>
      ),
    }),
  ]);

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          label="Stock movement history"
          columns={columns}
          data={movements}
          getRowId={(movement) => movement.id}
        />
      </div>

      <ul
        aria-label="Stock movement history"
        className="divide-border-subtle divide-y md:hidden"
      >
        {movements.map((movement) => (
          <li key={movement.id} className="flex flex-col gap-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground truncate text-sm font-medium">
                  {movement.productName}
                </span>
                <span className="text-muted-foreground font-mono text-xs">
                  {movement.sku ?? "No SKU"}
                </span>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  movement.quantityChange > 0
                    ? "text-success-soft-foreground"
                    : "text-destructive-soft-foreground",
                )}
              >
                {signedQuantity(movement.quantityChange)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <MovementBadge movement={movement} />
              <span className="text-muted-foreground text-xs tabular-nums">
                {movement.previousQuantity.toLocaleString()} →{" "}
                {movement.newQuantity.toLocaleString()}
              </span>
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>{REASON_LABELS[movement.reason]}</span>
              <span>{formatDateTime(movement.createdAt)}</span>
              {movement.orderNumber ? (
                <span className="font-mono">{movement.orderNumber}</span>
              ) : null}
              <span>{movement.userName ?? "System"}</span>
            </div>

            {movement.note ? (
              <p className="text-muted-foreground/80 text-xs leading-relaxed">
                {movement.note}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

function MovementBadge({ movement }: { movement: StockMovement }) {
  const isIncrease = INCREASE_TYPES.has(
    movement.type as "INITIAL" | "MANUAL_INCREASE" | "RETURN",
  );

  return (
    <Badge
      variant={
        movement.type === "DAMAGE"
          ? "destructive"
          : isIncrease
            ? "success"
            : movement.type === "SET"
              ? "info"
              : "secondary"
      }
    >
      {MOVEMENT_TYPE_LABELS[movement.type]}
    </Badge>
  );
}

function MovementReference({ movement }: { movement: StockMovement }) {
  if (movement.order) {
    return (
      <Link
        href={`/orders/${movement.order.id}`}
        className="text-primary hover:text-primary/80 font-mono text-xs transition-colors hover:underline hover:underline-offset-4"
      >
        {movement.order.orderNumber}
      </Link>
    );
  }

  if (movement.orderNumber) {
    return (
      <span className="text-muted-foreground font-mono text-xs">
        {movement.orderNumber}
      </span>
    );
  }

  return <span className="text-muted-foreground text-sm">—</span>;
}
