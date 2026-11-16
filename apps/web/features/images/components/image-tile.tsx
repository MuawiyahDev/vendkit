"use client";

import { Check, Lock, Maximize2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Image } from "../api/images-api";
import type { ImageViewMode } from "../images.constants";
import { formatBytes, formatImageMimeType } from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

export type ImageSelectionMode = "none" | "single" | "multiple";

interface ImageTileProps {
  image: Image;
  layout: ImageViewMode;
  selectionMode: ImageSelectionMode;
  isSelected: boolean;
  /**
   * When true, clicking the image toggles selection (picker behavior). When
   * false, the image opens the preview and the selection dot is the control
   * (Media Library management behavior).
   */
  activateOnSelect?: boolean;
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

function actionLabel(
  selectionMode: ImageSelectionMode,
  isSelected: boolean,
  name: string,
): string {
  if (selectionMode === "none") {
    return `Preview ${name}`;
  }
  return isSelected ? `Deselect ${name}` : `Select ${name}`;
}

function SelectionIndicator({
  isSelected,
  onToggle,
  label,
  className,
}: {
  isSelected: boolean;
  onToggle?: () => void;
  label?: string;
  className?: string;
}) {
  const classes = cn(
    "absolute z-20 flex size-5 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors",
    isSelected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border-strong bg-surface/85 text-transparent group-hover:border-primary/45",
    className,
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isSelected}
        aria-label={label}
        title={label}
        className={cn(
          classes,
          "focus-visible:ring-ring/60 size-6 cursor-pointer focus-visible:ring-[3px] focus-visible:outline-hidden",
        )}
      >
        <Check className="size-3" aria-hidden="true" />
      </button>
    );
  }

  return (
    <span aria-hidden="true" className={cn(classes, "pointer-events-none")}>
      <Check className="size-3" aria-hidden="true" />
    </span>
  );
}

function InUseIndicator({
  withLabel = false,
  className,
}: {
  withLabel?: boolean;
  className?: string;
}) {
  if (withLabel) {
    return (
      <span
        title="In use by existing records"
        className={cn(
          "bg-warning-soft text-warning-soft-foreground inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.625rem] font-medium",
          className,
        )}
      >
        <Lock className="size-2.5" aria-hidden="true" />
        In use
      </span>
    );
  }

  return (
    <span
      title="In use by existing records"
      className={cn(
        "text-warning-soft-foreground inline-flex size-6 shrink-0 items-center justify-center",
        className,
      )}
    >
      <Lock className="size-3" aria-hidden="true" />
      <span className="sr-only">In use by existing records</span>
    </span>
  );
}

/**
 * A single library item. Grid cards keep metadata minimal; list rows expose
 * upload date and type. Preview and delete actions sit outside the selection
 * control so contextual actions never toggle the selection by accident.
 */
export function ImageTile({
  image,
  layout,
  selectionMode,
  isSelected,
  activateOnSelect = true,
  onToggle,
  onPreview,
  onDelete,
}: ImageTileProps) {
  const selectable = selectionMode !== "none";
  const dimensions = imageDimensions(image);
  const alt = image.altText?.trim() || image.originalName;
  const label = actionLabel(selectionMode, isSelected, image.originalName);
  const activate = selectable && activateOnSelect ? onToggle : onPreview;
  const activateLabel =
    selectable && activateOnSelect ? label : `Preview ${image.originalName}`;
  const showInteractiveSelection = selectable && !activateOnSelect;

  if (layout === "list") {
    return (
      <li
        className={cn(
          "group relative flex items-center gap-2 rounded-lg border p-2.5 transition-colors sm:p-3",
          isSelected
            ? "border-primary bg-primary-soft/20"
            : "border-border-subtle bg-card hover:border-border-strong hover:bg-surface-hover/30",
        )}
      >
        <button
          type="button"
          onClick={activate}
          aria-pressed={selectable && activateOnSelect ? isSelected : undefined}
          aria-label={activateLabel}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:outline-hidden"
        >
          <span className="bg-surface-muted border-border-subtle relative size-16 shrink-0 overflow-hidden rounded-lg border">
            <ImageThumbnail src={image.url} alt={alt} />
            {selectable && activateOnSelect ? (
              <SelectionIndicator
                isSelected={isSelected}
                className="top-1 left-1 size-4.5"
              />
            ) : null}
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-2">
              <span
                title={image.originalName}
                className="text-foreground truncate text-sm font-medium"
              >
                {image.originalName}
              </span>
              {image.usage.total > 0 ? <InUseIndicator withLabel /> : null}
            </span>
            <span className="text-muted-foreground truncate text-xs tabular-nums">
              {formatImageMimeType(image.mimeType)}
              {dimensions ? ` · ${dimensions}` : ""} · {formatBytes(image.size)}
            </span>
            <span className="text-muted-foreground truncate text-[0.6875rem]">
              Uploaded {formatDate(image.createdAt)}
            </span>
          </span>
        </button>

        {showInteractiveSelection ? (
          <SelectionIndicator
            isSelected={isSelected}
            onToggle={onToggle}
            label={label}
            className="top-3 left-3"
          />
        ) : null}

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onPreview}
            aria-label={`Preview ${image.originalName}`}
            title="Preview"
          >
            <Maximize2 aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${image.originalName}`}
            title="Delete image"
            className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive-soft-foreground"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group min-w-0">
      <div
        className={cn(
          "bg-card flex flex-col overflow-hidden rounded-xl border transition-[border-color,box-shadow] duration-200",
          isSelected
            ? "border-primary shadow-sm ring-1 ring-primary/20"
            : "border-border-subtle hover:border-border-strong hover:shadow-sm",
        )}
      >
        <div className="relative">
          <button
            type="button"
            onClick={activate}
            aria-pressed={
              selectable && activateOnSelect ? isSelected : undefined
            }
            aria-label={activateLabel}
            className="bg-surface-muted relative block aspect-square w-full cursor-pointer overflow-hidden focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:outline-hidden"
          >
            <ImageThumbnail
              src={image.url}
              alt={alt}
              className="transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="bg-foreground/0 group-hover:bg-foreground/[0.035] pointer-events-none absolute inset-0 transition-colors"
            />
          </button>

          {selectable && activateOnSelect ? (
            <SelectionIndicator
              isSelected={isSelected}
              className="top-2 left-2"
            />
          ) : null}

          {showInteractiveSelection ? (
            <SelectionIndicator
              isSelected={isSelected}
              onToggle={onToggle}
              label={label}
              className="top-2 left-2"
            />
          ) : null}

          <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              onClick={onPreview}
              aria-label={`Preview ${image.originalName}`}
              title="Preview"
              className="bg-surface/90 border-border-subtle/60 hover:bg-surface rounded-full border shadow-sm backdrop-blur-sm"
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
              className="bg-surface/90 border-border-subtle/60 text-destructive hover:bg-destructive-soft hover:text-destructive-soft-foreground rounded-full border shadow-sm backdrop-blur-sm"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 items-start justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              title={image.originalName}
              className="text-foreground truncate text-xs font-medium"
            >
              {image.originalName}
            </span>
            <span className="text-muted-foreground truncate text-[0.6875rem] tabular-nums">
              {formatImageMimeType(image.mimeType)} · {formatBytes(image.size)}
            </span>
          </div>
          {image.usage.total > 0 ? <InUseIndicator /> : null}
        </div>
      </div>
    </li>
  );
}
