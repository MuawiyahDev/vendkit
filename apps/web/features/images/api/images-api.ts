import { ApiError, apiErrorFromPayload, apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

/** Where an image is referenced in VendKit. */
export interface ImageUsage {
  total: number;
  productCount: number;
  businessProfileLogo: boolean;
  invoiceLogo: boolean;
}

/** Image shape returned by the NestJS images endpoints. */
export interface Image {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
  usage: ImageUsage;
  createdAt: string;
  updatedAt: string;
}

export interface ImageListResponse {
  data: Image[];
  meta: PaginationMeta;
}

/** Aggregate counts returned by the media-library statistics endpoint. */
export interface ImageTypeUsage {
  mimeType: string;
  count: number;
  size: number;
}

export interface ImageLibraryStats {
  totalImages: number;
  storageBytes: number;
  recentUploads: number;
  recentWindowDays: number;
  byType: ImageTypeUsage[];
}

export type ImageMimeType =
  "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type ImageTypeFilter = "all" | ImageMimeType;

export type ImageSortField = "createdAt" | "originalName" | "size";

export type ImageSortOrder = "asc" | "desc";

export interface ImageListParams {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: ImageMimeType;
  sortBy?: ImageSortField;
  sortOrder?: ImageSortOrder;
}

/**
 * Minimal metadata needed to render a picked image outside the library
 * (e.g. inside a product form). Deliberately independent from the library
 * list state so callers can persist and restore selections.
 */
export interface PickedImage {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
}

/** Accepts an Image record wherever a PickedImage is expected. */
export function toPickedImage(image: Image): PickedImage {
  return {
    id: image.id,
    originalName: image.originalName,
    mimeType: image.mimeType,
    size: image.size,
    width: image.width,
    height: image.height,
    altText: image.altText,
    url: image.url,
  };
}

/** Runtime type guard for stored image selections. */
export function isPickedImage(value: unknown): value is PickedImage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.originalName === "string" &&
    typeof record.mimeType === "string" &&
    typeof record.size === "number" &&
    (typeof record.width === "number" || record.width === null) &&
    (typeof record.height === "number" || record.height === null) &&
    (typeof record.altText === "string" || record.altText === null) &&
    typeof record.url === "string"
  );
}

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listImages(
  params: ImageListParams = {},
  { signal }: RequestOptions = {},
): Promise<ImageListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.mimeType) {
    searchParams.set("mimeType", params.mimeType);
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  return apiFetch<ImageListResponse>(`/api/images${query ? `?${query}` : ""}`, {
    signal,
  });
}

export async function getImage(
  id: string,
  { signal }: RequestOptions = {},
): Promise<Image> {
  return apiFetch<Image>(`/api/images/${id}`, { signal });
}

export async function getImageStats({
  signal,
}: RequestOptions = {}): Promise<ImageLibraryStats> {
  return apiFetch<ImageLibraryStats>("/api/images/stats", { signal });
}

export async function deleteImage(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/images/${id}`, { method: "DELETE" });
}

export interface UploadImageOptions {
  altText?: string;
  /** Receives upload progress as a 0–1 fraction. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/**
 * Thrown when an upload is aborted through its `AbortSignal`, so callers
 * can tell cancellations apart from network failures.
 */
export class UploadCancelledError extends Error {
  constructor() {
    super("Upload was cancelled.");
    this.name = "UploadCancelledError";
  }
}

/**
 * Uploads an image through the multipart upload endpoint.
 *
 * Uses XMLHttpRequest instead of `fetch` because it is the only browser API
 * that reports request upload progress. Errors are normalized to the same
 * `ApiError` contract as `apiFetch`. The multipart `Content-Type` header is
 * never set manually so the browser can generate the boundary.
 */
export function uploadImage(
  file: File,
  { altText, onProgress, signal }: UploadImageOptions = {},
): Promise<Image> {
  return new Promise<Image>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    if (altText && altText.trim().length > 0) {
      formData.append("altText", altText.trim());
    }

    const request = new XMLHttpRequest();
    request.open("POST", "/api/images");
    request.responseType = "json";

    function abort() {
      request.abort();
    }

    if (signal) {
      if (signal.aborted) {
        reject(new UploadCancelledError());
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
        resolve(payload as Image);
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
      reject(new UploadCancelledError());
    });

    request.send(formData);
  });
}
