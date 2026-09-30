import { queryOptions } from "@tanstack/react-query";
import { getMyVehicles } from "@/lib/features/vehicles/api";

export const vehicleQueryKeys = {
  all: ["vehicles"] as const,
  my: () => [...vehicleQueryKeys.all, "my"] as const,
};

export function myVehiclesQueryOptions(accessToken: string | null) {
  return queryOptions({
    queryKey: vehicleQueryKeys.my(),
    enabled: Boolean(accessToken),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load vehicles.");
      return getMyVehicles(accessToken, signal);
    },
  });
}
