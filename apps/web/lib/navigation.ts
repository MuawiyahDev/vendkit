/**
 * Sanitizes a post-login redirect target so it can only point to an internal path.
 * Falls back to the dashboard when the value is missing or unsafe.
 */
export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) {
    return fallback;
  }
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
