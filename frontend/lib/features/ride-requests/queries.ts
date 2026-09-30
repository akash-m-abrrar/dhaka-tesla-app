import { queryOptions } from "@tanstack/react-query";
import {
  getPassengerRideRequests,
  getRideRequest,
  getZones,
} from "@/lib/features/ride-requests/api";

export const zoneQueryKeys = {
  all: ["zones"] as const,
};

export const rideRequestQueryKeys = {
  all: ["ride-requests"] as const,
  passengerList: () => [...rideRequestQueryKeys.all, "passenger-list"] as const,
  detail: (id: string) => [...rideRequestQueryKeys.all, "detail", id] as const,
};

export function zonesQueryOptions() {
  return queryOptions({
    queryKey: zoneQueryKeys.all,
    queryFn: ({ signal }) => getZones(signal),
    retry: false,
  });
}

export function passengerRideRequestsQueryOptions(accessToken: string | null, enabled = true) {
  return queryOptions({
    queryKey: rideRequestQueryKeys.passengerList(),
    enabled: Boolean(accessToken && enabled),
    queryFn: ({ signal }) => {
      if (!accessToken) {
        throw new Error("An access token is required to load ride requests.");
      }

      return getPassengerRideRequests(accessToken, signal);
    },
    retry: false,
  });
}

export function rideRequestQueryOptions(
  id: string,
  accessToken: string | null,
) {
  return queryOptions({
    queryKey: rideRequestQueryKeys.detail(id),
    enabled: Boolean(accessToken && id),
    queryFn: ({ signal }) => {
      if (!accessToken) {
        throw new Error("An access token is required to load this ride request.");
      }

      return getRideRequest(id, accessToken, signal);
    },
    retry: false,
  });
}
