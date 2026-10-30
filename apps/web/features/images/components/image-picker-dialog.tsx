"use client";

import { Images, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { PickedImage } from "../api/images-api";
import { ImageLibrary } from "./image-library";
import { ImageThumbnail } from "./image-thumbnail";

export type ImagePickerMode = "single" | "multiple";

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single picks replace the selection; multiple picks append to it. */
  mode?: ImagePickerMode;
  /** Current selection, ordered, including images not on the visible page. */
  value?: readonly PickedImage[];
  /** Receives the confirmed ordered selection with full metadata. */
  onConfirm: (images: PickedImage[]) => void;
}

function SelectedStrip({
  images,
  onRemove,
}: {
  images: readonly PickedImage[];
  onRemove: (id: string) => void;
}) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="border-border-subtle border-b px-4 py-3 sm:px-5">
      <p className="text-muted-foreground mb-2 text-xs font-medium">
        Selected ({images.length})
      </p>
      <ul className="flex flex-wrap gap-2">
        {images.map((image) => (
          <li key={image.id} className="group relative">
            <span
              title={image.originalName}
              className="border-border-subtle bg-surface-muted ring-border-subtle block size-14 overflow-hidden rounded-md ring-1 ring-inset"
            >
              <ImageThumbnail
                src={image.url}
                alt={image.altText?.trim() || image.originalName}
              />
            </span>
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              aria-label={`Remove ${image.originalName} from selection`}
              className="bg-destructive text-destructive-foreground focus-visible:ring-ring/60 absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full opacity-0 shadow-sm transition-opacity focus-visible:ring-[3px] focus-visible:outline-hidden group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Reusable picker dialog that embeds the image library. Returns the
 * confirmed ordered selection (ids plus rendering metadata) to the caller;
 * it contains no feature-specific logic.
 */
export function ImagePickerDialog({
  open,
  onOpenChange,
  mode = "multiple",
  value = [],
  onConfirm,
}: ImagePickerDialogProps) {
  // Local draft of the selection, seeded whenever the dialog opens so the
  // caller's value is only applied on explicit confirmation.
  const [draft, setDraft] = useState<PickedImage[]>([]);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft([...value]);
    }
  }

  function handleConfirm() {
    if (draft.length === 0) {
      return;
    }
    onConfirm(draft);
    onOpenChange(false);
  }

  const confirmLabel =
    mode === "single"
      ? "Use image"
      : draft.length === 1
        ? "Use 1 image"
        : `Use ${draft.length} images`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setDraft([]);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>
            {mode === "single" ? "Select an image" : "Select images"}
          </DialogTitle>
          <DialogDescription>
            Pick from your library or upload new images — already uploaded
            files can be reused without uploading them again.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          <ImageLibrary
            selectionMode={mode}
            selected={draft}
            onSelectionChange={setDraft}
          />
        </div>

        <SelectedStrip
          images={draft}
          onRemove={(id) =>
            setDraft((current) => current.filter((item) => item.id !== id))
          }
        />

        <DialogFooter className="border-border-subtle bg-surface-muted/40 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={draft.length === 0}
          >
            <Images aria-hidden="true" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
