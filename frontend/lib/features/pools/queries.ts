import { queryOptions } from "@tanstack/react-query";
import { getDriverPoolHistory, getPoolDetail } from "@/lib/features/pools/api";

export const poolQueryKeys = {
  all: ["pools"] as const,
  history: () => [...poolQueryKeys.all, "driver-history"] as const,
  detail: (poolId: string) => [...poolQueryKeys.all, "detail", poolId] as const,
};

export function driverPoolHistoryQueryOptions(accessToken: string | null) {
  return queryOptions({
    queryKey: poolQueryKeys.history(),
    enabled: Boolean(accessToken),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load pools.");
      return getDriverPoolHistory(accessToken, signal);
    },
  });
}

export function poolDetailQueryOptions(poolId: string, accessToken: string | null) {
  return queryOptions({
    queryKey: poolQueryKeys.detail(poolId),
    enabled: Boolean(poolId && accessToken),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load this pool.");
      return getPoolDetail(poolId, accessToken, signal);
    },
  });
}
