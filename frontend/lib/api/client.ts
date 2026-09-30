import type { ApiErrorEnvelope, ApiSuccessEnvelope } from "@/lib/api/types";
import { resolveApiUrl } from "@/lib/api/config";

export { API_BASE_URL, resolveApiUrl } from "@/lib/api/config";

export type ApiHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_REQUEST_TIMEOUT_MS = 30_000;

export interface ApiRequestOptions {
  method?: ApiHttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  accessToken?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
}

export interface ApiSessionTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface ApiAuthHandlers {
  getSessionTokens(): ApiSessionTokens;
  updateAccessToken(accessToken: string): void;
  clearSession(): void;
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

let authHandlers: ApiAuthHandlers | undefined;
let refreshInFlight: Promise<string> | undefined;

export function configureApiAuth(handlers: ApiAuthHandlers): void {
  authHandlers = handlers;
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
  (!("message" in value) || typeof value.message === "string") &&
  "data" in value;

async function requestOnce<T>(
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

  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(resolveApiUrl(path), {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
      cache: options.cache,
    });

    let responseBody: unknown;

    const responseText = await response.text();
    try {
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
  } catch (error) {
    if (didTimeout) {
      throw new ApiError(
        408,
        "REQUEST_TIMEOUT",
        "The server took too long to respond. Check your connection and try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

function isRefreshableRequest(path: string, options: ApiRequestOptions): boolean {
  if (!options.accessToken) {
    return false;
  }

  const endpoint = path.replace(/^\/+|\/+$/g, "");
  return ![
    "auth/login",
    "auth/register",
    "auth/refresh",
  ].includes(endpoint);
}

function authenticationError(): ApiError {
  return new ApiError(
    401,
    "UNAUTHORIZED",
    "Your session has expired. Please sign in again.",
  );
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

async function refreshAccessTokenSingleFlight(): Promise<string> {
  if (!refreshInFlight) {
    const attempt = (async () => {
      try {
        const refreshToken = authHandlers?.getSessionTokens().refreshToken;

        if (!refreshToken) {
          throw authenticationError();
        }

        const result = await requestOnce<{ accessToken: string }>(
          "/auth/refresh",
          {
            method: "POST",
            body: { refreshToken },
          },
        );

        if (!result.accessToken) {
          throw authenticationError();
        }

        authHandlers?.updateAccessToken(result.accessToken);
        return result.accessToken;
      } catch {
        authHandlers?.clearSession();
        throw authenticationError();
      }
    })();

    refreshInFlight = attempt;
  }

  const activeAttempt = refreshInFlight;

  try {
    return await activeAttempt;
  } finally {
    if (refreshInFlight === activeAttempt) {
      refreshInFlight = undefined;
    }
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    return await requestOnce<T>(path, options);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !isRefreshableRequest(path, options)
    ) {
      throw error;
    }

    if (options.signal?.aborted) {
      throw abortError();
    }

    const currentAccessToken = authHandlers?.getSessionTokens().accessToken;
    let accessToken: string;

    if (currentAccessToken && currentAccessToken !== options.accessToken) {
      accessToken = currentAccessToken;
    } else {
      accessToken = await refreshAccessTokenSingleFlight();
    }

    if (options.signal?.aborted) {
      throw abortError();
    }

    return requestOnce<T>(path, { ...options, accessToken });
  }
}
