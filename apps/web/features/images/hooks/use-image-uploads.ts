"use client";

import { useCallback, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { uploadImage, UploadCancelledError } from "../api/images-api";
import { validateImageFile } from "../utils/images.utils";

export interface PendingUpload {
  /** Local identifier for rendering progress rows. */
  id: string;
  name: string;
  /** Upload progress from 0 to 1. */
  progress: number;
}

let uploadCounter = 0;

/**
 * Runs image uploads sequentially with per-file progress, validating each
 * file against the backend rules before sending it. Returns the number of
 * files that uploaded successfully so the caller can refresh its collection
 * once per batch instead of once per image.
 */
export function useImageUploads() {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);

  const updateUpload = useCallback(
    (id: string, patch: Partial<PendingUpload> | null) => {
      setUploads((current) =>
        patch === null
          ? current.filter((upload) => upload.id !== id)
          : current.map((upload) =>
              upload.id === id ? { ...upload, ...patch } : upload,
            ),
      );
    },
    [],
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<number> => {
      if (files.length === 0 || isUploading) {
        return 0;
      }

      setError(null);

      // Drop duplicates within the same batch (same file picked twice).
      const seen = new Set<string>();
      const uniqueFiles = files.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      const validated = uniqueFiles.map((file) => ({
        file,
        error: validateImageFile(file),
      }));

      const invalid: string[] = [];
      const validFiles: File[] = [];
      for (const entry of validated) {
        if (entry.error === null) {
          validFiles.push(entry.file);
        } else {
          invalid.push(entry.error);
        }
      }

      if (invalid.length > 0) {
        setError(invalid.join(" "));
      }

      if (validFiles.length === 0) {
        return 0;
      }

      setIsUploading(true);
      const controller = new AbortController();
      activeControllerRef.current = controller;
      let uploadedCount = 0;

      try {
        for (const file of validFiles) {
          if (controller.signal.aborted) {
            break;
          }

          const id = `upload-${(uploadCounter += 1)}`;
          setUploads((current) => [
            ...current,
            { id, name: file.name, progress: 0 },
          ]);

          try {
            await uploadImage(file, {
              signal: controller.signal,
              onProgress: (fraction) =>
                updateUpload(id, { progress: fraction }),
            });
            updateUpload(id, null);
            uploadedCount += 1;
          } catch (caught) {
            updateUpload(id, null);

            if (caught instanceof UploadCancelledError) {
              // Cancelled upload: no error to surface.
              continue;
            }

            const message =
              caught instanceof ApiError
                ? `“${file.name}” failed to upload: ${caught.message}`
                : `“${file.name}” failed to upload. Please try again.`;
            // Accumulate failures so a batch never hides earlier errors.
            setError((current) =>
              current ? `${current} ${message}` : message,
            );
          }
        }
      } finally {
        activeControllerRef.current = null;
        setIsUploading(false);
      }

      return uploadedCount;
    },
    [isUploading, updateUpload],
  );

  const dismissError = useCallback(() => setError(null), []);

  return { uploads, error, isUploading, uploadFiles, dismissError };
}
