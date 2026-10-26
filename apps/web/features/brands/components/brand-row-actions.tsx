"use client";

import {
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Brand } from "../api/brands-api";

interface BrandRowActionsProps {
  brand: Brand;
  isUpdatingStatus: boolean;
  isStatusUpdatePending: boolean;
  onEdit: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}

export function BrandRowActions({
  brand,
  isUpdatingStatus,
  isStatusUpdatePending,
  onEdit,
  onToggleStatus,
  onDelete,
}: BrandRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isStatusUpdatePending}
          aria-label={`Actions for ${brand.name}`}
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
            onEdit(brand);
          }}
        >
          <Pencil aria-hidden="true" />
          Edit brand
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isStatusUpdatePending}
          onSelect={() => {
            onToggleStatus(brand);
          }}
        >
          {brand.isActive ? (
            <PowerOff aria-hidden="true" />
          ) : (
            <Power aria-hidden="true" />
          )}
          {brand.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onDelete(brand);
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete brand
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
