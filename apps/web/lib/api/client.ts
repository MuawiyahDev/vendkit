export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetches a same-origin Next.js endpoint and normalizes error responses.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the server. Check your connection and try again.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, getApiErrorMessage(payload));
  }

  return payload as T;
}

function getApiErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message: unknown };
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }
  return "Something went wrong. Please try again.";
}

/**
 * Builds an ApiError from a raw error payload using the shared message
 * extraction rules. Used by callers that cannot go through `apiFetch`
 * (e.g. XMLHttpRequest-based uploads with progress events).
 */
export function apiErrorFromPayload(
  status: number,
  payload: unknown,
): ApiError {
  return new ApiError(status, getApiErrorMessage(payload));
}
