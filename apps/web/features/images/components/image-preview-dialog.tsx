"use client";

import { formatDate, formatDateTime } from "@/lib/format";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { Image } from "../api/images-api";
import { formatBytes } from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

interface ImagePreviewDialogProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-foreground truncate text-sm tabular-nums">{value}</dd>
    </div>
  );
}

/** Full-size preview of a library image with its stored metadata. */
export function ImagePreviewDialog({
  image,
  open,
  onOpenChange,
}: ImagePreviewDialogProps) {
  const dimensions =
    image && image.width !== null && image.height !== null
      ? `${image.width} × ${image.height}`
      : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-xl">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="truncate">
            {image?.originalName ?? "Image preview"}
          </DialogTitle>
          <DialogDescription>
            {image
              ? `${formatBytes(image.size)} · ${image.mimeType}`
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
            <MetadataRow label="Type" value={image.mimeType} />
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
