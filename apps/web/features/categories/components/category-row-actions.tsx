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

import type { Category } from "../api/categories-api";

interface CategoryRowActionsProps {
  category: Category;
  isUpdatingStatus: boolean;
  isStatusUpdatePending: boolean;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryRowActions({
  category,
  isUpdatingStatus,
  isStatusUpdatePending,
  onEdit,
  onToggleStatus,
  onDelete,
}: CategoryRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isStatusUpdatePending}
          aria-label={`Actions for ${category.name}`}
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
            onEdit(category);
          }}
        >
          <Pencil aria-hidden="true" />
          Edit category
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isStatusUpdatePending}
          onSelect={() => {
            onToggleStatus(category);
          }}
        >
          {category.isActive ? (
            <PowerOff aria-hidden="true" />
          ) : (
            <Power aria-hidden="true" />
          )}
          {category.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            onDelete(category);
          }}
        >
          <Trash2 aria-hidden="true" />
          Delete category
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
