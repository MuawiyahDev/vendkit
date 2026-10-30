"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ImagePickerDialog } from "@/features/images/components/image-picker-dialog";
import { ImageThumbnail } from "@/features/images/components/image-thumbnail";
import type { PickedImage } from "@/features/images/api/images-api";

interface ImagesFieldProps {
  /** Ordered selection; the first image is the product's primary image. */
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  disabled?: boolean;
}

function moveImage(images: PickedImage[], from: number, to: number): PickedImage[] {
  const next = [...images];
  const [moved] = next.splice(from, 1);
  if (moved) {
    next.splice(to, 0, moved);
  }
  return next;
}

/**
 * Product image association control. Selection reuses the shared image
 * library; removing an image here only detaches it from the product and
 * never deletes the library file.
 */
export function ImagesField({ images, onChange, disabled }: ImagesFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="product-images-button">Images</Label>
        <Button
          id="product-images-button"
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
        >
          <ImagePlus aria-hidden="true" />
          {images.length === 0 ? "Choose images" : "Change images"}
        </Button>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="flex min-w-0 flex-col gap-1">
              <div
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border",
                  index === 0
                    ? "border-primary ring-primary/30 ring-2"
                    : "border-border-subtle",
                )}
              >
                <ImageThumbnail
                  src={image.url}
                  alt={image.altText?.trim() || image.originalName}
                />
                <span
                  className={cn(
                    "absolute top-1 left-1 flex size-4.5 items-center justify-center rounded-full text-[0.625rem] font-semibold",
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface/85 text-muted-foreground ring-border-subtle ring-1 ring-inset",
                  )}
                  title={index === 0 ? "Primary image" : undefined}
                >
                  {index + 1}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveImage(images, index, index - 1))}
                  aria-label={`Move ${image.originalName} earlier`}
                  title="Move earlier"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled || index === images.length - 1}
                  onClick={() => onChange(moveImage(images, index, index + 1))}
                  aria-label={`Move ${image.originalName} later`}
                  title="Move later"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() =>
                    onChange(images.filter((item) => item.id !== image.id))
                  }
                  aria-label={`Remove ${image.originalName} from this product`}
                  title="Remove from product (keeps the library image)"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-muted-foreground text-xs leading-relaxed">
        {images.length === 0
          ? "No images selected. The first image becomes the product's primary image."
          : `The first image is used as the primary product image (${images.length} selected). Removing an image here only detaches it from this product — the library copy stays available.`}
      </p>

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="multiple"
        value={images}
        onConfirm={onChange}
      />
    </div>
  );
}
