import { apiRequest } from "@/lib/api/client";
import type {
  CreateRideRequestInput,
  PassengerRideRequestHistory,
  RideRequest,
  Zone,
} from "@/lib/features/ride-requests/types";

export function getZones(signal?: AbortSignal): Promise<Zone[]> {
  return apiRequest<Zone[]>("/zones", { signal });
}

export function createRideRequest(
  input: CreateRideRequestInput,
  accessToken: string,
): Promise<RideRequest> {
  return apiRequest<RideRequest>("/ride-requests", {
    method: "POST",
    body: input,
    accessToken,
  });
}

export function getPassengerRideRequests(
  accessToken: string,
  signal?: AbortSignal,
): Promise<PassengerRideRequestHistory[]> {
  return apiRequest<PassengerRideRequestHistory[]>("/ride-requests/history", {
    accessToken,
    signal,
  });
}

export function getRideRequest(
  id: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<RideRequest> {
  return apiRequest<RideRequest>(`/ride-requests/${encodeURIComponent(id)}`, {
    accessToken,
    signal,
  });
}

export function cancelRideRequest(
  id: string,
  accessToken: string,
): Promise<RideRequest> {
  return apiRequest<RideRequest>(
    `/ride-requests/${encodeURIComponent(id)}/cancel`,
    {
      method: "PATCH",
      accessToken,
    },
  );
}
