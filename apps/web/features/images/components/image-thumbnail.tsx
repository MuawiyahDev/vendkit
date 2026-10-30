"use client";

import { ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ImageThumbnailProps {
  src: string;
  /** Alt text; falls back to a descriptive file name when empty. */
  alt: string;
  className?: string;
}

/**
 * Renders an image thumbnail with a neutral fallback when the file fails
 * to load (e.g. removed server-side), so broken files never show the
 * browser's broken-image glyph.
 */
export function ImageThumbnail({ src, alt, className }: ImageThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasFailed = failedSrc === src;

  if (hasFailed) {
    return (
      <span
        role="img"
        aria-label={`${alt} (image unavailable)`}
        className={cn(
          "bg-surface-muted text-muted-foreground flex size-full items-center justify-center",
          className,
        )}
      >
        <ImageOff className="size-5" aria-hidden="true" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic API URLs are not statically optimizable
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn("size-full object-cover", className)}
    />
  );
}
