"use client";

import { Check, Copy, Download, Lock, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Image } from "../api/images-api";
import {
  describeImageUsage,
  formatBytes,
  formatImageMimeType,
  toAbsoluteImageUrl,
} from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

interface ImagePreviewDialogProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the delete confirmation for the previewed image. */
  onDelete?: (image: Image) => void;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        title={value}
        className="text-foreground truncate text-sm tabular-nums"
      >
        {value}
      </dd>
    </div>
  );
}

interface CopyState {
  imageId: string | null;
  isOpen: boolean;
  copied: boolean;
  error: string | null;
}

const EMPTY_COPY_STATE: CopyState = {
  imageId: null,
  isOpen: false,
  copied: false,
  error: null,
};

/** Full-size preview of a library image with its stored metadata. */
export function ImagePreviewDialog({
  image,
  open,
  onOpenChange,
  onDelete,
}: ImagePreviewDialogProps) {
  const [copyState, setCopyState] = useState<CopyState>(EMPTY_COPY_STATE);

  // Render-time reset keeps clipboard feedback scoped to one open session
  // for one image, including closes triggered by the delete action.
  if (copyState.imageId !== (image?.id ?? null) || copyState.isOpen !== open) {
    setCopyState({
      imageId: image?.id ?? null,
      isOpen: open,
      copied: false,
      error: null,
    });
  }

  const dimensions =
    image && image.width !== null && image.height !== null
      ? `${image.width} × ${image.height}`
      : "—";

  const isInUse = image !== null && image.usage.total > 0;
  const isCopied = copyState.copied;
  const deleteDisabled = !image || isInUse || !onDelete;

  async function handleCopyUrl() {
    if (!image) {
      return;
    }

    try {
      await navigator.clipboard.writeText(toAbsoluteImageUrl(image.url));
      setCopyState((current) => ({
        ...current,
        copied: true,
        error: null,
      }));
    } catch {
      setCopyState((current) => ({
        ...current,
        copied: false,
        error:
          "Could not copy the URL. Your browser may block clipboard access.",
      }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-xl">
        <DialogHeader className="min-w-0 pr-10 text-left">
          <DialogTitle
            className="block max-w-full min-w-0 truncate"
            title={image?.originalName}
          >
            {image?.originalName ?? "Image preview"}
          </DialogTitle>
          <DialogDescription>
            {image
              ? `${formatImageMimeType(image.mimeType)} · ${formatBytes(image.size)}`
              : "Stored library image."}
          </DialogDescription>
        </DialogHeader>

        {image ? (
          <div className="bg-surface-muted ring-border-subtle flex max-h-[50dvh] items-center justify-center overflow-hidden rounded-lg ring-1 ring-inset">
            <ImageThumbnail
              src={image.url}
              alt={image.altText?.trim() || image.originalName}
              className="max-h-[50dvh] w-auto object-contain"
            />
          </div>
        ) : null}

        {image ? (
          <dl className="border-border-subtle divide-border-subtle divide-y border-y">
            <MetadataRow label="Dimensions" value={dimensions} />
            <MetadataRow label="File size" value={formatBytes(image.size)} />
            <MetadataRow
              label="Type"
              value={formatImageMimeType(image.mimeType)}
            />
            <MetadataRow
              label="Alt text"
              value={image.altText?.trim() || "—"}
            />
            <MetadataRow label="Uploaded" value={formatDate(image.createdAt)} />
            <MetadataRow
              label="Last updated"
              value={formatDateTime(image.updatedAt)}
            />
          </dl>
        ) : null}

        {image ? (
          <div className="border-border-subtle bg-surface-muted/40 flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground text-xs font-medium">Usage</span>
              <Badge variant={isInUse ? "warning" : "secondary"} dot>
                {isInUse ? "In use" : "Not in use"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {describeImageUsage(image.usage)}
              {isInUse
                ? " Detach this image from those records before deleting it."
                : ""}
            </p>
          </div>
        ) : null}

        {copyState.error ? (
          <p role="alert" className="text-destructive text-xs">
            {copyState.error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!image}
              onClick={() => void handleCopyUrl()}
            >
              {isCopied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span aria-live="polite">{isCopied ? "Copied" : "Copy URL"}</span>
            </Button>

            {image ? (
              <Button asChild variant="outline" size="sm">
                <a href={image.url} download={image.originalName}>
                  <Download aria-hidden="true" />
                  Download
                </a>
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {image && onDelete ? (
              <Button
                type="button"
                variant="destructive-outline"
                size="sm"
                disabled={deleteDisabled}
                title={
                  isInUse
                    ? "Detach this image from the records using it before deleting it."
                    : "Delete image"
                }
                onClick={() => onDelete(image)}
              >
                {isInUse ? (
                  <Lock aria-hidden="true" />
                ) : (
                  <Trash2 aria-hidden="true" />
                )}
                Delete
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(image && onDelete ? undefined : "sm:ml-auto")}
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
