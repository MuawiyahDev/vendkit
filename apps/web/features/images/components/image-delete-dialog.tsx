"use client";

import { AlertCircle, LoaderCircle, TriangleAlert } from "lucide-react";
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
import { ApiError } from "@/lib/api/client";

import { deleteImage, type Image } from "../api/images-api";
import { formatBytes } from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

interface ImageDeleteDialogProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (image: Image) => void;
}

/**
 * Confirms permanent deletion of a library image. The backend rejects the
 * delete while products still reference the image, and that failure is
 * surfaced here without touching any product data.
 */
export function ImageDeleteDialog({
  image,
  open,
  onOpenChange,
  onSuccess,
}: ImageDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isDeleting) {
      return;
    }
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!image || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteImage(image.id);
      onSuccess(image);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while deleting this image.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const dimensions =
    image && image.width !== null && image.height !== null
      ? `${image.width} × ${image.height}`
      : null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-5 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              This permanently removes the file from your library and cannot
              be undone. Images that are still used by products cannot be
              deleted until those products no longer reference them.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {image ? (
          <div className="border-border-subtle bg-surface-muted/60 flex items-center gap-3 rounded-lg border p-3">
            <span className="bg-surface ring-border-subtle size-12 shrink-0 overflow-hidden rounded-md ring-1 ring-inset">
              <ImageThumbnail
                src={image.url}
                alt={image.altText?.trim() || image.originalName}
              />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p
                title={image.originalName}
                className="text-foreground truncate text-sm font-medium"
              >
                {image.originalName}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {dimensions ? `${dimensions} · ` : ""}
                {formatBytes(image.size)} · {image.mimeType}
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || !image}
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
            {isDeleting ? "Deleting…" : "Delete image"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
