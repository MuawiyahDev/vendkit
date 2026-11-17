"use client";

import Link from "next/link";
import {
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Warehouse,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Product } from "../api/products-api";

interface ProductRowActionsProps {
  product: Product;
  isUpdatingStatus: boolean;
  isStatusUpdatePending: boolean;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductRowActions({
  product,
  isUpdatingStatus,
  isStatusUpdatePending,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isStatusUpdatePending}
          aria-label={`Actions for ${product.name}`}
          className="text-muted-foreground group-hover:text-foreground group-focus-within:text-foreground data-[state=open]:bg-surface-active data-[state=open]:text-foreground"
        >
          {isUpdatingStatus ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <MoreHorizontal aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        <DropdownMenuItem
          onSelect={() => {
            onEdit(product);
          }}
        >
          <Pencil aria-hidden="true" />
          Edit product
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/inventory">
            <Warehouse aria-hidden="true" />
            Manage stock
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isStatusUpdatePending}
          onSelect={() => {
            onToggleStatus(product);
          }}
        >
          {product.isActive ? (
            <PowerOff aria-hidden="true" />
          ) : (
            <Power aria-hidden="true" />
          )}
          {product.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onDelete(product);
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete product
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
