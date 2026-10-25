"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Customer } from "../api/customers-api";

interface CustomerRowActionsProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerRowActions({
  customer,
  onEdit,
  onDelete,
}: CustomerRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${customer.name}`}
          className="text-muted-foreground group-hover:text-foreground group-focus-within:text-foreground data-[state=open]:bg-surface-active data-[state=open]:text-foreground"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/customers/${customer.id}`}>
            <Eye aria-hidden="true" />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onEdit(customer);
          }}
        >
          <Pencil aria-hidden="true" />
          Edit customer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onDelete(customer);
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
