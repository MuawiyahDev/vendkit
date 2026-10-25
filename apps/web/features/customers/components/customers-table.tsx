import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import { createColumnHelper, type SortingState } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { DataTableFeatures } from "@/components/ui/data-table-features";

import type {
  Customer,
  CustomerSortField,
  SortOrder,
} from "../api/customers-api";
import { formatDate, formatOptionalValue } from "../utils/customers.utils";
import { CustomerAvatar } from "./customer-avatar";
import { CustomerRowActions } from "./customer-row-actions";
import { CustomerStatusBadge } from "./customer-status-badge";

const columnHelper = createColumnHelper<DataTableFeatures, Customer>();

interface CustomersTableProps {
  customers: Customer[];
  sortBy: CustomerSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: CustomerSortField;
    sortOrder: SortOrder;
  }) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomersTable({
  customers,
  sortBy,
  sortOrder,
  onSortChange,
  onEdit,
  onDelete,
}: CustomersTableProps) {
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      meta: { className: "min-w-[260px]" },
      sortDescFirst: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <CustomerAvatar name={row.original.name} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/customers/${row.original.id}`}
                title={row.original.name}
                className="text-foreground hover:text-primary focus-visible:ring-ring/40 w-fit max-w-[220px] truncate rounded-sm text-sm font-medium transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                {row.original.name}
              </Link>
              <CustomerStatusBadge createdAt={row.original.createdAt} />
            </div>
            <span
              title={row.original.email ?? undefined}
              className="text-muted-foreground max-w-[240px] truncate text-xs"
            >
              {formatOptionalValue(row.original.email)}
            </span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("phone", {
      enableSorting: false,
      meta: { className: "min-w-[150px]" },
      header: "Phone",
      cell: ({ row }) => (
        <a
          href={`tel:${row.original.phone}`}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 rounded-sm text-sm whitespace-nowrap tabular-nums transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
        >
          {row.original.phone}
        </a>
      ),
    }),
    columnHelper.accessor("city", {
      enableSorting: false,
      meta: { className: "hidden lg:table-cell" },
      header: "Location",
      cell: ({ row }) => (
        <div className="flex max-w-[200px] flex-col gap-0.5">
          <span className="truncate text-sm">
            {formatOptionalValue(row.original.city)}
          </span>
          {row.original.postalCode ? (
            <span className="text-muted-foreground text-xs tabular-nums">
              {row.original.postalCode}
            </span>
          ) : null}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      meta: { className: "hidden md:table-cell" },
      sortDescFirst: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Added" />
      ),
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
        <CustomerRowActions
          customer={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    }),
  ]);

  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === "desc" }];

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          label="Customers"
          columns={columns}
          data={customers}
          getRowId={(customer) => customer.id}
          sorting={sorting}
          onSortingChange={(next) => {
            const active = next[0];
            if (active && (active.id === "name" || active.id === "createdAt")) {
              onSortChange({
                sortBy: active.id,
                sortOrder: active.desc ? "desc" : "asc",
              });
            }
          }}
        />
      </div>

      <CustomerMobileList
        customers={customers}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}

interface CustomerMobileListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function CustomerMobileList({
  customers,
  onEdit,
  onDelete,
}: CustomerMobileListProps) {
  return (
    <ul
      aria-label="Customers"
      className="divide-border-subtle divide-y md:hidden"
    >
      {customers.map((customer) => (
        <li
          key={customer.id}
          className="group hover:bg-surface-hover/50 flex items-start gap-3 px-4 py-4 transition-colors focus-within:bg-surface-hover/50 active:bg-surface-active/60 motion-reduce:transition-none"
        >
          <CustomerAvatar name={customer.name} className="size-10" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/customers/${customer.id}`}
                  title={customer.name}
                  className="text-foreground hover:text-primary focus-visible:ring-ring/40 max-w-[190px] truncate rounded-sm text-sm font-semibold transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
                >
                  {customer.name}
                </Link>
                <CustomerStatusBadge createdAt={customer.createdAt} />
              </div>
              <CustomerRowActions
                customer={customer}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>

            {customer.email ? (
              <p
                title={customer.email}
                className="text-muted-foreground truncate text-xs"
              >
                {customer.email}
              </p>
            ) : null}

            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <a
                href={`tel:${customer.phone}`}
                className="hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1.5 rounded-sm whitespace-nowrap tabular-nums transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                <Phone className="size-3" aria-hidden="true" />
                {customer.phone}
              </a>
              {customer.city ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" aria-hidden="true" />
                  {customer.city}
                </span>
              ) : null}
            </div>

            <p className="text-muted-foreground mt-1 text-xs">
              Added {formatDate(customer.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
