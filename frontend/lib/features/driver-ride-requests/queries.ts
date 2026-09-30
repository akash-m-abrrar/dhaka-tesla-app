import { queryOptions } from "@tanstack/react-query";
import { getDriverRideRequests } from "@/lib/features/driver-ride-requests/api";

export const driverRequestQueryKeys = {
  all: ["driver", "ride-requests"] as const,
  list: () => driverRequestQueryKeys.all,
};

export function driverRideRequestsQueryOptions(accessToken: string | null) {
  return queryOptions({
    queryKey: driverRequestQueryKeys.list(),
    enabled: Boolean(accessToken),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load ride requests.");
      return getDriverRideRequests(accessToken, signal);
    },
  });
}
