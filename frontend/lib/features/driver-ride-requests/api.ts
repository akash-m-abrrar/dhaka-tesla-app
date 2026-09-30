import { apiRequest } from "@/lib/api/client";
import type { DriverRideRequest } from "@/lib/features/driver-ride-requests/types";

export function getDriverRideRequests(accessToken: string, signal?: AbortSignal) {
  return apiRequest<DriverRideRequest[]>("/driver/ride-requests", { accessToken, signal });
}
