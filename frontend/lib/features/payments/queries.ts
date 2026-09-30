import { queryOptions } from "@tanstack/react-query";
import { getMyPayments, getPoolPayments } from "@/lib/features/payments/api";

export const paymentQueryKeys = {
  all: ["payments"] as const,
  mine: () => [...paymentQueryKeys.all, "mine"] as const,
  pool: (poolId: string) => [...paymentQueryKeys.all, "pool", poolId] as const,
};

export function myPaymentsQueryOptions(accessToken: string | null, enabled = true) {
  return queryOptions({
    queryKey: paymentQueryKeys.mine(),
    enabled: Boolean(accessToken && enabled),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load payments.");
      return getMyPayments(accessToken, signal);
    },
  });
}

export function poolPaymentsQueryOptions(poolId: string, accessToken: string | null, enabled = true) {
  return queryOptions({
    queryKey: paymentQueryKeys.pool(poolId),
    enabled: Boolean(accessToken && poolId && enabled),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) throw new Error("An access token is required to load pool payments.");
      return getPoolPayments(poolId, accessToken, signal);
    },
  });
}
