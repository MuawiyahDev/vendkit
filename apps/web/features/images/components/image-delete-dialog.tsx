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
import {
  describeImageUsage,
  formatBytes,
  formatImageMimeType,
} from "../utils/images.utils";
import { ImageThumbnail } from "./image-thumbnail";

interface ImageDeleteDialogProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (image: Image) => void;
}

/**
 * Confirms permanent deletion of a library image. Images that products,
 * invoice settings, or the business profile still reference are protected:
 * the action is disabled up front and a concurrent reference change is
 * surfaced as the backend's 409 conflict message.
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
    if (!image || isDeleting || image.usage.total > 0) {
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
  const isInUse = image !== null && image.usage.total > 0;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="gap-5 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>
              {isInUse ? "Image is still in use" : "Delete image?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {isInUse
                ? "This image is referenced by other records. Detach it from them first; deleting it now would break those references."
                : "This permanently removes the file from your library and cannot be undone."}
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
                {formatBytes(image.size)} ·{" "}
                {formatImageMimeType(image.mimeType)}
              </p>
            </div>
          </div>
        ) : null}

        {image ? (
          <div className="border-border-subtle flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground text-xs font-medium">Usage</span>
              <Badge variant={isInUse ? "warning" : "secondary"} dot>
                {isInUse ? "In use" : "Not in use"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {describeImageUsage(image.usage)}
            </p>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {isInUse ? "Close" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || !image || isInUse}
            title={
              isInUse
                ? "Detach this image from the records using it before deleting it."
                : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeleting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : isInUse ? (
              <Lock aria-hidden="true" />
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
