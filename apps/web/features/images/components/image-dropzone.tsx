"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState, type DragEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function hasFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

/**
 * Adds drag-and-drop upload to any surface. The overlay is only rendered
 * while files are dragged over the zone, so normal browsing is unaffected.
 */
export function ImageDropzone({
  onFiles,
  disabled = false,
  children,
  className,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  function resetDragState() {
    dragDepthRef.current = 0;
    setIsDragging(false);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) {
      return;
    }
    event.preventDefault();
    if (disabled) {
      return;
    }
    dragDepthRef.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (dragDepthRef.current === 0) {
      return;
    }
    event.preventDefault();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasFiles(event)) {
      return;
    }
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    resetDragState();
    if (!disabled && files.length > 0) {
      onFiles(files);
    }
  }

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragging ? (
        <div
          aria-hidden="true"
          className="bg-background/80 pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] p-6 backdrop-blur-[2px]"
        >
          <div className="border-primary/40 bg-surface flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-8 py-6 text-center shadow-sm">
            <span className="bg-primary-soft text-primary-soft-foreground flex size-10 items-center justify-center rounded-full">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium">Drop images to upload</p>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, WebP, or GIF
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
