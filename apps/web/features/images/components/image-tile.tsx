"use client";

import { Check, Maximize2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Image } from "../api/images-api";
import { formatBytes } from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

export type ImageSelectionMode = "none" | "single" | "multiple";

interface ImageTileProps {
  image: Image;
  selectionMode: ImageSelectionMode;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onDelete: () => void;
}

function imageDimensions(image: Image): string | null {
  if (image.width !== null && image.height !== null) {
    return `${image.width} × ${image.height}`;
  }
  return null;
}

/**
 * A single library tile. The thumbnail button either toggles selection or
 * opens the preview; preview and delete actions sit above it so all
 * controls stay keyboard reachable.
 */
export function ImageTile({
  image,
  selectionMode,
  isSelected,
  onToggle,
  onPreview,
  onDelete,
}: ImageTileProps) {
  const selectable = selectionMode !== "none";
  const dimensions = imageDimensions(image);
  const alt = image.altText?.trim() || image.originalName;

  return (
    <li className="group flex min-w-0 flex-col gap-1.5">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border transition-shadow",
          isSelected
            ? "border-primary ring-primary/40 ring-2 ring-offset-1 ring-offset-background"
            : "border-border-subtle hover:border-border-strong",
        )}
      >
        <button
          type="button"
          onClick={selectable ? onToggle : onPreview}
          aria-pressed={selectable ? isSelected : undefined}
          aria-label={
            selectable
              ? isSelected
                ? `Deselect ${image.originalName}`
                : `Select ${image.originalName}`
              : `Preview ${image.originalName}`
          }
          className="bg-surface-muted block aspect-square w-full cursor-pointer focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:outline-hidden"
        >
          <ImageThumbnail src={image.url} alt={alt} />
        </button>

        {isSelected ? (
          <span className="bg-primary text-primary-foreground pointer-events-none absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full shadow-sm">
            <Check className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}

        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            onClick={onPreview}
            aria-label={`Preview ${image.originalName}`}
            title="Preview"
            className="bg-surface/90 border-border-subtle/60 shadow-sm backdrop-blur-sm hover:bg-surface"
          >
            <Maximize2 aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            onClick={onDelete}
            aria-label={`Delete ${image.originalName}`}
            title="Delete image"
            className="bg-surface/90 border-border-subtle/60 text-destructive shadow-sm backdrop-blur-sm hover:bg-destructive-soft hover:text-destructive-soft-foreground"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
        <span
          title={image.originalName}
          className="text-foreground truncate text-xs font-medium"
        >
          {image.originalName}
        </span>
        <span className="text-muted-foreground truncate text-[0.6875rem] tabular-nums">
          {dimensions ? `${dimensions} · ` : ""}
          {formatBytes(image.size)}
        </span>
      </div>
    </li>
  );
}
