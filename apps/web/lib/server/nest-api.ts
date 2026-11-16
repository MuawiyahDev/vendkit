export class NestApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NestApiError";
  }
}

interface NestRequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  accessToken?: string;
}

/**
 * Server-only HTTP client for the NestJS API.
 * Attaches the machine-to-machine API key, which must never reach the browser.
 */
export async function nestFetch<T>(
  path: string,
  options: NestRequestOptions,
): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
    "x-api-key": getApiKey(),
  });

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: options.method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
    });
  } catch {
    throw new NestApiError(502, "Unable to reach the authentication service");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new NestApiError(response.status, extractNestErrorMessage(payload));
  }

  return payload as T;
}

interface NestFormRequestOptions {
  accessToken?: string;
}

/**
 * Sends a multipart/form-data payload to the NestJS API.
 * The `Content-Type` header is intentionally left unset so `fetch` can
 * generate the multipart boundary from the FormData body.
 */
export async function nestFormData<T>(
  path: string,
  formData: FormData,
  { accessToken }: NestFormRequestOptions = {},
): Promise<T> {
  const headers = new Headers({ "x-api-key": getApiKey() });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });
  } catch {
    throw new NestApiError(502, "Unable to reach the authentication service");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new NestApiError(response.status, extractNestErrorMessage(payload));
  }

  return payload as T;
}

export interface NestFileResponse {
  mimeType: string;
  contentLength: string | null;
  contentDisposition: string | null;
  stream: ReadableStream<Uint8Array> | null;
}

/**
 * Fetches a binary file (e.g. a stored image) from the NestJS API and
 * returns the response body as a stream suitable for a proxied response.
 */
export async function nestFetchFile(
  path: string,
  { accessToken }: NestFormRequestOptions,
): Promise<NestFileResponse> {
  const headers = new Headers({ "x-api-key": getApiKey() });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    throw new NestApiError(502, "Unable to reach the authentication service");
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new NestApiError(response.status, extractNestErrorMessage(payload));
  }

  return {
    mimeType: response.headers.get("content-type") ?? "application/octet-stream",
    contentLength: response.headers.get("content-length"),
    contentDisposition: response.headers.get("content-disposition"),
    stream: response.body,
  };
}

function getBaseUrl(): string {
  const url = process.env.NEST_API_URL?.trim();
  if (!url) {
    throw new NestApiError(500, "The authentication service is not configured");
  }
  return url.replace(/\/+$/, "");
}

function getApiKey(): string {
  const apiKey = process.env.API_KEY?.trim();
  if (!apiKey) {
    throw new NestApiError(500, "The authentication service is not configured");
  }
  return apiKey;
}

function extractNestErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const { message } = payload as { message: unknown };
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }
  return "Authentication service request failed";
}
