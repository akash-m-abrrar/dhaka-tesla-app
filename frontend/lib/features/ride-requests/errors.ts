import { ApiError } from "@/lib/api/client";

export function getRideRequestErrorMessage(
  error: unknown,
  action: "create" | "cancel",
): string {
  if (!(error instanceof ApiError)) {
    return action === "create"
      ? "We couldn’t create the request. Check your connection and try again."
      : "We couldn’t cancel the request. Check your connection and try again.";
  }

  if (error.code === "BUSINESS_RULE_ERROR" || error.code === "VALIDATION_ERROR") {
    return error.message;
  }

  if (error.status === 401) {
    return "Your session expired. Sign in again to continue.";
  }

  if (error.status === 403) {
    return "This action is only available to the passenger who owns this request.";
  }

  if (error.status === 404) {
    return "A selected zone or ride request could not be found. Refresh and try again.";
  }

  if (error.status === 409) {
    return "The request’s status changed and it can’t be cancelled now. Its latest status is being refreshed.";
  }

  return action === "create"
    ? "We couldn’t create the request. Please try again."
    : "We couldn’t cancel the request. Please try again.";
}
