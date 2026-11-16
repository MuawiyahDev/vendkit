import { ApiError, apiErrorFromPayload, apiFetch } from "@/lib/api/client";

import {
  RESTORE_CONFIRMATION_PHRASE,
  type BackupListResponse,
  type BackupSummary,
  type RestoreJobSummary,
} from "../backups.types";

interface RequestOptions {
  signal?: AbortSignal;
}

export async function getBackupOverview({
  signal,
}: RequestOptions = {}): Promise<BackupListResponse> {
  return apiFetch<BackupListResponse>("/api/backups", { signal });
}

export async function createBackup(): Promise<BackupSummary> {
  return apiFetch<BackupSummary>("/api/backups", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deleteBackup(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/backups/${id}`, { method: "DELETE" });
}

export async function getRestoreJob(
  id: string,
  { signal }: RequestOptions = {},
): Promise<RestoreJobSummary> {
  return apiFetch<RestoreJobSummary>(`/api/backups/restore/${id}`, { signal });
}

export async function restoreBackup(id: string): Promise<RestoreJobSummary> {
  return apiFetch<RestoreJobSummary>(`/api/backups/${id}/restore`, {
    method: "POST",
    body: JSON.stringify({
      confirmation: RESTORE_CONFIRMATION_PHRASE,
    }),
  });
}

export function backupDownloadUrl(id: string): string {
  return `/api/backups/${id}/download`;
}

export interface UploadRestoreOptions {
  /** Receives upload progress as a 0–1 fraction. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/**
 * Uploads a backup archive for restoration. XMLHttpRequest is used so the UI
 * can show upload progress before the server starts the asynchronous restore.
 */
export function restoreBackupFromFile(
  file: File,
  { onProgress, signal }: UploadRestoreOptions = {},
): Promise<RestoreJobSummary> {
  return new Promise<RestoreJobSummary>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("confirmation", RESTORE_CONFIRMATION_PHRASE);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/backups/restore");
    request.responseType = "json";

    function abort() {
      request.abort();
    }

    if (signal) {
      if (signal.aborted) {
        reject(new ApiError(0, "The upload was cancelled."));
        return;
      }
      signal.addEventListener("abort", abort, { once: true });
    }

    function cleanup() {
      signal?.removeEventListener("abort", abort);
    }

    request.upload.addEventListener("progress", (event) => {
      if (onProgress && event.lengthComputable && event.total > 0) {
        onProgress(Math.min(event.loaded / event.total, 1));
      }
    });

    request.addEventListener("load", () => {
      cleanup();
      const payload: unknown = request.response;

      if (request.status >= 200 && request.status < 300) {
        onProgress?.(1);
        resolve(payload as RestoreJobSummary);
        return;
      }

      reject(apiErrorFromPayload(request.status, payload));
    });

    request.addEventListener("error", () => {
      cleanup();
      reject(
        new ApiError(
          0,
          "Unable to reach the server. Check your connection and try again.",
        ),
      );
    });

    request.addEventListener("abort", () => {
      cleanup();
      reject(new ApiError(0, "The upload was cancelled."));
    });

    request.send(formData);
  });
}
