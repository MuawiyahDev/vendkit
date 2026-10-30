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
  return `${formatNumber(kilobytes / KILOBYTE, 1)} MB`;
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
