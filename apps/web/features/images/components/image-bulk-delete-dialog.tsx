"use client";

import { AlertCircle, LoaderCircle, Lock, TriangleAlert } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";

import { deleteImage, type Image } from "../api/images-api";
import { formatBytes, formatImageMimeType } from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

interface ImageBulkDeleteDialogProps {
  images: readonly Image[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with successfully deleted images; blocked/failed images remain. */
  onDeleted: (images: Image[]) => void;
}

/**
 * Deletes several safe images in one action. Images still referenced by a
 * product or settings record are skipped and clearly marked, and per-image
 * failures stay visible for retry without closing the dialog.
 */
export function ImageBulkDeleteDialog({
  images,
  open,
  onOpenChange,
  onDeleted,
}: ImageBulkDeleteDialogProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completed, setCompleted] = useState(0);

  const safeImages = images.filter((image) => image.usage.total === 0);
  const blockedCount = images.length - safeImages.length;
  const totalBytes = images.reduce((total, image) => total + image.size, 0);
  const selectedLabel =
    images.length === 1 ? "image" : `${images.length} images`;

  function handleOpenChange(nextOpen: boolean) {
    if (isDeleting) {
      return;
    }
    if (!nextOpen) {
      setErrors([]);
      setCompleted(0);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (isDeleting || safeImages.length === 0) {
      return;
    }

    setIsDeleting(true);
    setErrors([]);
    setCompleted(0);

    const deleted: Image[] = [];
    const failures: string[] = [];
    let processed = 0;

    for (const image of safeImages) {
      try {
        await deleteImage(image.id);
        deleted.push(image);
      } catch (caught) {
        failures.push(
          caught instanceof ApiError
            ? `“${image.originalName}”: ${caught.message}`
            : `“${image.originalName}” could not be deleted.`,
        );
      } finally {
        processed += 1;
        setCompleted(processed);
      }
    }

    setIsDeleting(false);

    if (deleted.length > 0) {
      onDeleted(deleted);
    }

    if (failures.length > 0) {
      setErrors(failures);
      return;
    }

    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-5 sm:max-w-lg">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="min-w-0 gap-1.5 text-left">
            <AlertDialogTitle>{`Delete ${selectedLabel}?`}</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This permanently removes the selected files from your library and
              cannot be undone. Images still in use are skipped automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="border-border-subtle bg-surface-muted/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">Selected</span>
            <span className="text-foreground text-sm font-medium tabular-nums">
              {images.length} {images.length === 1 ? "image" : "images"} ·{" "}
              {formatBytes(totalBytes)}
            </span>
          </div>
          {blockedCount > 0 ? (
            <Badge variant="warning" dot>
              {blockedCount} in use
            </Badge>
          ) : (
            <Badge variant="secondary">Ready to delete</Badge>
          )}
        </div>

        <ul className="border-border-subtle divide-border-subtle max-h-64 divide-y overflow-y-auto rounded-lg border">
          {images.map((image) => {
            const isInUse = image.usage.total > 0;

            return (
              <li key={image.id} className="flex items-center gap-3 px-3 py-2">
                <span className="bg-surface-muted border-border-subtle size-10 shrink-0 overflow-hidden rounded-md border">
                  <ImageThumbnail
                    src={image.url}
                    alt={image.altText?.trim() || image.originalName}
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    title={image.originalName}
                    className="text-foreground truncate text-xs font-medium"
                  >
                    {image.originalName}
                  </span>
                  <span className="text-muted-foreground truncate text-[0.6875rem] tabular-nums">
                    {formatImageMimeType(image.mimeType)} ·{" "}
                    {formatBytes(image.size)}
                  </span>
                </span>
                {isInUse ? (
                  <Badge variant="warning" className="shrink-0">
                    <Lock aria-hidden="true" />
                    In use
                  </Badge>
                ) : null}
              </li>
            );
          })}
        </ul>

        {blockedCount > 0 ? (
          <div className="border-warning/25 bg-warning-soft text-warning-soft-foreground flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p>
              {blockedCount === 1
                ? "1 selected image is still in use and will be skipped."
                : `${blockedCount} selected images are still in use and will be skipped.`}{" "}
              Detach them from their records before deleting.
            </p>
          </div>
        ) : null}

        {errors.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>
              <p>Some images could not be deleted.</p>
              <ul className="list-disc space-y-1 pl-4">
                {errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || safeImages.length === 0}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeleting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
            {isDeleting
              ? `Deleting ${completed} of ${safeImages.length}…`
              : safeImages.length === 0
                ? "No images can be deleted"
                : `Delete ${safeImages.length} ${
                    safeImages.length === 1 ? "image" : "images"
                  }`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
