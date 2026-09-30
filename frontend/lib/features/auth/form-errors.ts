import { ApiError } from "@/lib/api/client";

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function getValidationFieldError(
  error: unknown,
  allowedFields: readonly string[],
): { field: string; message: string } | null {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_ERROR") {
    return null;
  }

  const separator = error.message.indexOf(":");
  if (separator < 1) {
    return null;
  }

  const field = error.message.slice(0, separator);
  const message = error.message.slice(separator + 1).trim();

  return allowedFields.includes(field) && message ? { field, message } : null;
}
