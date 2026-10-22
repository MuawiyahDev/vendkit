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
  method: "GET" | "POST";
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
