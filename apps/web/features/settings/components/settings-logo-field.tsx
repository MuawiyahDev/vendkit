"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PickedImage } from "@/features/images/api/images-api";
import { ImagePickerDialog } from "@/features/images/components/image-picker-dialog";
import { ImageThumbnail } from "@/features/images/components/image-thumbnail";
import type { SettingsLogo } from "../settings.types";

interface SettingsLogoFieldProps {
  id: string;
  label: string;
  description?: string;
  logo: SettingsLogo | null;
  onChange: (logo: { id: string; url: string } | null) => void;
  disabled?: boolean;
}

/**
 * Logo selector backed by the shared image library. The library file is
 * reused; the settings record only stores a reference to it.
 */
export function SettingsLogoField({
  id,
  label,
  description,
  logo,
  onChange,
  disabled = false,
}: SettingsLogoFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const pickerValue: PickedImage[] = logo
    ? [
        {
          id: logo.id,
          originalName: "Current logo",
          mimeType: "image/*",
          size: 0,
          width: null,
          height: null,
          altText: null,
          url: logo.url,
        },
      ]
    : [];

  function handleConfirm(images: PickedImage[]) {
    const selected = images[0];
    if (selected) {
      onChange({ id: selected.id, url: selected.url });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="border-border-subtle bg-surface-muted/40 flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="border-border-subtle bg-surface flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {logo ? (
            <ImageThumbnail src={logo.url} alt="Current business logo" />
          ) : (
            <ImagePlus
              className="text-muted-foreground size-6"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm font-medium">
            {logo ? "Logo selected" : "No logo selected"}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description ??
              "Choose an image from the media library. A square or horizontal logo works best."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              id={id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setPickerOpen(true)}
            >
              <ImagePlus aria-hidden="true" />
              {logo ? "Change logo" : "Choose logo"}
            </Button>
            {logo ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode="single"
        value={pickerValue}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
