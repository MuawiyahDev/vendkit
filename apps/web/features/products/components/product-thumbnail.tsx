import { Package } from "lucide-react";

import { ImageThumbnail } from "@/features/images/components/image-thumbnail";
import { cn } from "@/lib/utils";

interface ProductThumbnailProps {
  /** Image file URL, or null when the product has no image yet. */
  src: string | null;
  alt: string;
  className?: string;
}

/**
 * Square product thumbnail with a neutral placeholder when the product has
 * no image (or the file no longer loads).
 */
export function ProductThumbnail({ src, alt, className }: ProductThumbnailProps) {
  if (src === null) {
    return (
      <span
        role="img"
        aria-label={`${alt} (no image)`}
        className={cn(
          "bg-surface-muted text-muted-foreground/70 flex size-full items-center justify-center",
          className,
        )}
      >
        <Package className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={cn("bg-surface-muted block size-full overflow-hidden", className)}>
      <ImageThumbnail src={src} alt={alt} />
    </span>
  );
}
