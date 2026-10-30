"use client";

import { AlertCircle, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

import type { PendingUpload } from "../hooks/use-image-uploads";

interface ImageUploadQueueProps {
  uploads: PendingUpload[];
  error: string | null;
  onDismissError: () => void;
}

function UploadRow({ upload }: { upload: PendingUpload }) {
  const percent = Math.round(upload.progress * 100);

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span
          title={upload.name}
          className="text-foreground truncate text-xs font-medium"
        >
          {upload.name}
        </span>
        <span className="text-muted-foreground shrink-0 text-[0.6875rem] tabular-nums">
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Uploading ${upload.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-surface-muted h-1.5 overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}

/** Renders upload feedback: validation/server errors and progress rows. */
export function ImageUploadQueue({
  uploads,
  error,
  onDismissError,
}: ImageUploadQueueProps) {
  if (!error && uploads.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss upload error"
              className="hover:bg-destructive/10 focus-visible:ring-destructive/30 -m-1 shrink-0 rounded-md p-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {uploads.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Uploads in progress">
          {uploads.map((upload) => (
            <UploadRow key={upload.id} upload={upload} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
