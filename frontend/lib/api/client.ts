import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@/lib/api/types";
import { resolveApiUrl } from "@/lib/api/config";

export { API_BASE_URL, resolveApiUrl } from "@/lib/api/config";

export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: ApiHttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  accessToken?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isApiErrorEnvelope = (value: unknown): value is ApiErrorEnvelope => {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  );
};

const isApiSuccessEnvelope = <T>(
  value: unknown,
): value is ApiSuccessEnvelope<T> =>
  isRecord(value) &&
  value.success === true &&
  typeof value.message === "string" &&
  "data" in value;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(resolveApiUrl(path), {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers,
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: options.cache,
  });

  let responseBody: unknown;

  try {
    const responseText = await response.text();
    responseBody = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
    );
  }

  if (!response.ok) {
    if (isApiErrorEnvelope(responseBody)) {
      throw new ApiError(
        response.status,
        responseBody.error.code,
        responseBody.error.message,
      );
    }

    throw new ApiError(
      response.status,
      "HTTP_ERROR",
      "The request could not be completed.",
    );
  }

  if (isApiErrorEnvelope(responseBody)) {
    throw new ApiError(
      response.status,
      responseBody.error.code,
      responseBody.error.message,
    );
  }

  if (!isApiSuccessEnvelope<T>(responseBody)) {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
    );
  }

  return responseBody.data;
}
