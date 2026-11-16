import type { ImageUsage } from "../api/images-api";

/** Matches the backend default (`IMAGE_MAX_FILE_SIZE`, overridable via env). */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Formats accepted by the NestJS images endpoint. The backend verifies the
 * actual file signature, so this list is a client-side convenience check.
 */
export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_IMAGE_MIME_TYPES_LABEL = "JPEG, PNG, WebP, or GIF";

/** Value for the `accept` attribute of image file inputs. */
export const IMAGE_FILE_ACCEPT = ACCEPTED_IMAGE_MIME_TYPES.join(",");

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;
const GIGABYTE = MEGABYTE * 1024;

/** Formats a byte count as a compact human-readable size (e.g. "312 KB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < KILOBYTE) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / KILOBYTE;
  if (kilobytes < KILOBYTE) {
    return `${formatNumber(kilobytes, kilobytes < 10 ? 1 : 0)} KB`;
  }
  const megabytes = bytes / MEGABYTE;
  if (megabytes < KILOBYTE) {
    return `${formatNumber(megabytes, 1)} MB`;
  }
  const gigabytes = bytes / GIGABYTE;
  return `${formatNumber(gigabytes, gigabytes < 10 ? 1 : 0)} GB`;
}

function formatNumber(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Returns an error message when the file cannot be uploaded, else null. */
export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `“${file.name}” is not a supported image. Use ${ACCEPTED_IMAGE_MIME_TYPES_LABEL}.`;
  }

  if (file.size === 0) {
    return `“${file.name}” is empty and cannot be uploaded.`;
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The maximum allowed size is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`;
  }

  return null;
}

/** Friendly label for a supported image MIME type. */
export function formatImageMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WebP";
    case "image/gif":
      return "GIF";
    default:
      return mimeType;
  }
}

/** Human-readable summary of where an image is currently referenced. */
export function describeImageUsage(usage: ImageUsage): string {
  const references: string[] = [];

  if (usage.productCount > 0) {
    references.push(
      `${usage.productCount} ${usage.productCount === 1 ? "product" : "products"}`,
    );
  }
  if (usage.businessProfileLogo) {
    references.push("the business profile logo");
  }
  if (usage.invoiceLogo) {
    references.push("the invoice logo");
  }

  if (references.length === 0) {
    return "Not used by any product or settings record.";
  }

  return `Used by ${references.join(", ")}.`;
}

/** Converts the API image path into an absolute, shareable URL in the browser. */
export function toAbsoluteImageUrl(url: string): string {
  if (typeof window === "undefined") {
    return url;
  }

  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}
