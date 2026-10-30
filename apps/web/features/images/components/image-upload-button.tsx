"use client";

import { LoaderCircle, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";

import { IMAGE_FILE_ACCEPT } from "../utils/images.utils";

interface ImageUploadButtonProps {
  /** Receives the chosen files once the user confirms the file dialog. */
  onFiles: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Opens the browser file dialog for one or more images. The native input is
 * kept out of the tab order; the button provides the accessible control.
 */
export function ImageUploadButton({
  onFiles,
  isUploading = false,
  disabled = false,
  className,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset so picking the same file again re-triggers the change event.
    event.target.value = "";
    if (files.length > 0) {
      onFiles(files);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className={className}
      >
        {isUploading ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Upload aria-hidden="true" />
        )}
        {isUploading ? "Uploading…" : "Upload images"}
      </Button>
    </>
  );
}
